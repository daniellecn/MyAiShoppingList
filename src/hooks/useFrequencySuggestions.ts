import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { shouldSuggest, daysUntilNeeded } from '../utils/frequencyCalc';
import { PurchaseRecord } from '../types';

export interface Suggestion {
  itemName: string;
  lastPurchased: string;
  frequencyDays: number;
  daysOverdue: number;
}

export function useFrequencySuggestions(): Suggestion[] {
  const purchaseRecords = useStore(s => s.purchaseRecords);
  const currentList = useStore(s => s.currentList);

  return useMemo(() => {
    const currentNames = new Set(currentList.map(i => i.name.toLowerCase().trim()));

    return purchaseRecords
      .filter(record => !currentNames.has(record.itemName) && shouldSuggest(record))
      .map(record => {
        const sorted = [...record.dates].sort();
        const lastPurchased = sorted[sorted.length - 1];
        const daysSinceLast = (Date.now() - new Date(lastPurchased).getTime()) / (1000 * 60 * 60 * 24);
        const days = daysUntilNeeded(record);
        const freqDays = Math.round(daysSinceLast + days);
        return {
          itemName: record.itemName,
          lastPurchased,
          frequencyDays: freqDays,
          daysOverdue: Math.max(0, Math.round(daysSinceLast - freqDays * 0.85)),
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [purchaseRecords, currentList]);
}
