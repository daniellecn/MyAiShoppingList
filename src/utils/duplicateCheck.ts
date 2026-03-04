import { Item } from '../types';

function stripSuffixes(s: string): string {
  // Hebrew plural suffixes: ים, ות, י
  // English plural/possessive: s, es
  return s
    .replace(/ות$/, '').replace(/ים$/, '').replace(/י$/, '')
    .replace(/es$/, '').replace(/s$/, '')
    .trim();
}

function normalizeForDup(s: string): string {
  return stripSuffixes(
    s.toLowerCase()
      .replace(/[\d"'״׳\-,.()\[\]]/g, '') // strip punctuation + numbers
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const val = a[i - 1] === b[j - 1]
        ? row[j - 1]
        : 1 + Math.min(prev, row[j], row[j - 1]);
      row[j - 1] = prev;
      prev = val;
    }
    row[n] = prev;
  }
  return row[n];
}

export function findDuplicate(items: Item[], newName: string): Item | undefined {
  const normNew = normalizeForDup(newName);
  return items.find(item => {
    const normExisting = normalizeForDup(item.name);
    if (normNew === normExisting) return true;
    // One is a prefix/substring of the other — "Bamba" inside "Bamba 80g"
    if (normNew.length >= 3 && normExisting.includes(normNew)) return true;
    if (normExisting.length >= 3 && normNew.includes(normExisting)) return true;
    // Close edit distance for short–medium strings (typos / slight variations)
    const maxLen = Math.max(normNew.length, normExisting.length);
    if (maxLen >= 4 && levenshtein(normNew, normExisting) <= Math.floor(maxLen * 0.2)) return true;
    return false;
  });
}
