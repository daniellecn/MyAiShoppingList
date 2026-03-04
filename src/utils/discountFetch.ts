import { Discount } from '../types';

// Israeli government-mandated price transparency XML parser
// Promotions XML format: PromotionId, PromotionDescription, DiscountedPrice, etc.
async function fetchPromotionXml(url: string): Promise<string> {
  const response = await fetch(url, { headers: { Accept: 'text/xml, application/xml' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function extractTextBetween(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function parsePromotionsXml(xml: string, supermarketId: string): Discount[] {
  const promotions: Discount[] = [];

  // Find all <Promotion> or <Sale> blocks
  const blockRegex = /<(?:Promotion|Sale|SALE|PROMOTION)>([\s\S]*?)<\/(?:Promotion|Sale|SALE|PROMOTION)>/gi;
  let match;

  while ((match = blockRegex.exec(xml)) !== null) {
    const block = match[1];
    const description =
      extractTextBetween(block, 'PromotionDescription') ||
      extractTextBetween(block, 'ItemName') ||
      extractTextBetween(block, 'SaleDescription');

    if (!description) continue;

    const validUntilRaw = extractTextBetween(block, 'PromotionEndDate') ||
      extractTextBetween(block, 'EndDate');

    // Try to extract discount percent from description
    const pctMatch = description.match(/(\d+)%/);
    const discountPercent = pctMatch ? parseInt(pctMatch[1]) : undefined;

    promotions.push({
      itemName: description.toLowerCase(),
      supermarketId,
      description,
      discountPercent,
      validUntil: validUntilRaw || undefined,
      isManual: false,
    });
  }

  return promotions;
}

export async function fetchDiscountsForSupermarket(
  supermarketId: string,
  promotionUrl: string,
): Promise<Discount[]> {
  try {
    const xml = await fetchPromotionXml(promotionUrl);
    return parsePromotionsXml(xml, supermarketId);
  } catch {
    return []; // silently fail — user can mark manually
  }
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/['"״׳,.\-()]/g, '').replace(/\s+/g, ' ').trim();
}

function wordOverlapScore(a: string, b: string): number {
  const wordsA = normalize(a).split(' ').filter(w => w.length > 1);
  const wordsB = normalize(b).split(' ').filter(w => w.length > 1);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  const matches = wordsA.filter(w => wordsB.some(wb => wb.includes(w) || w.includes(wb)));
  return matches.length / Math.min(wordsA.length, wordsB.length);
}

export function matchDiscountsToItem(
  itemName: string,
  discounts: Discount[],
  supermarketId: string,
): Discount | undefined {
  const norm = normalize(itemName);
  const candidates = discounts.filter(d => d.supermarketId === supermarketId);

  // 1. Exact substring match
  const exact = candidates.find(d => d.itemName.includes(norm) || norm.includes(d.itemName));
  if (exact) return exact;

  // 2. Word-overlap fuzzy match (≥50% of item words match)
  let best: Discount | undefined;
  let bestScore = 0;
  for (const d of candidates) {
    const score = wordOverlapScore(norm, d.itemName);
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return bestScore >= 0.5 ? best : undefined;
}
