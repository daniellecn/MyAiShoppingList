import { PurchaseRecord } from '../types';

export function getAverageFrequencyDays(record: PurchaseRecord): number | null {
  const sorted = [...record.dates].sort();
  if (sorted.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / (1000 * 60 * 60 * 24);
    gaps.push(diff);
  }
  return gaps.reduce((a, b) => a + b, 0) / gaps.length;
}

export function shouldSuggest(record: PurchaseRecord): boolean {
  if (record.dates.length === 0) return false;
  const avgDays = getAverageFrequencyDays(record);
  if (avgDays === null) return false; // only bought once — suggest after that interval
  const lastDate = new Date(record.dates[record.dates.length - 1]);
  const daysSinceLast = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLast >= avgDays * 0.85; // suggest slightly early (15% buffer)
}

export function daysUntilNeeded(record: PurchaseRecord): number {
  if (record.dates.length === 0) return 0;
  const avgDays = getAverageFrequencyDays(record);
  if (avgDays === null) return 0;
  const lastDate = new Date(record.dates[record.dates.length - 1]);
  const daysSinceLast = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.round(avgDays - daysSinceLast));
}
