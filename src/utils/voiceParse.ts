import { Unit } from '../types';

const UNIT_ALIASES: Array<{ patterns: string[]; unit: Unit }> = [
  { patterns: ['קג', 'ק"ג', 'קילו', 'ק.ג', 'kg', 'kilo'], unit: 'ק"ג' },
  { patterns: ['גרם', 'gr', 'gram', 'grams'], unit: 'גרם' },
  { patterns: ['ליטר', 'ל', 'liter', 'litre', 'l'], unit: 'ליטר' },
  { patterns: ['מל', 'מ"ל', 'ml', 'milliliter'], unit: 'מ"ל' },
  { patterns: ['אריזה', 'pack', 'package'], unit: 'אריזה' },
  { patterns: ['צרור', 'bunch', 'bouquet'], unit: 'צרור' },
];

export interface ParsedVoiceItem {
  name: string;
  quantity: number;
  unit: Unit;
}

export function parseVoiceInput(text: string): ParsedVoiceItem {
  const trimmed = text.trim();

  // Try to extract leading number: "2 ק״ג עגבניות" or "שלוש בצלים"
  const numberWords: Record<string, number> = {
    'אחד': 1, 'אחת': 1, 'שניים': 2, 'שתיים': 2, 'שלושה': 3, 'שלוש': 3,
    'ארבעה': 4, 'ארבע': 4, 'חמישה': 5, 'חמש': 5, 'שישה': 6, 'שש': 6,
    'שבעה': 7, 'שבע': 7, 'שמונה': 8, 'תשעה': 9, 'תשע': 9, 'עשרה': 10, 'עשר': 10,
  };

  let quantity = 1;
  let unit: Unit = 'יח';
  let rest = trimmed;

  // Check leading digit
  const digitMatch = rest.match(/^(\d+(?:\.\d+)?)\s*/);
  if (digitMatch) {
    quantity = parseFloat(digitMatch[1]);
    rest = rest.slice(digitMatch[0].length);
  } else {
    // Check Hebrew number words
    for (const [word, val] of Object.entries(numberWords)) {
      if (rest.startsWith(word + ' ') || rest === word) {
        quantity = val;
        rest = rest.slice(word.length).trim();
        break;
      }
    }
  }

  // Check unit
  for (const { patterns, unit: u } of UNIT_ALIASES) {
    for (const p of patterns) {
      const regex = new RegExp(`^${p}\\s+`, 'i');
      if (regex.test(rest)) {
        unit = u;
        rest = rest.replace(regex, '').trim();
        break;
      }
    }
  }

  // Remove filler words
  const fillers = ['של', 'עם', 'את', 'of', 'some'];
  for (const f of fillers) {
    const r = new RegExp(`^${f}\\s+`, 'i');
    rest = rest.replace(r, '').trim();
  }

  return { name: rest || trimmed, quantity, unit };
}
