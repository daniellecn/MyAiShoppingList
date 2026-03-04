import * as FileSystem from 'expo-file-system';

export interface OcrItem {
  name: string;
  quantity: number;
  price: number | null;
}

export async function recognizeReceiptItems(
  imageUri: string,
  apiKey: string,
): Promise<OcrItem[]> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
            },
            {
              type: 'text',
              text: 'This is a grocery receipt. Extract all purchased items. Return ONLY a valid JSON array with no other text: [{"name":"item name (use Hebrew if receipt is in Hebrew)","quantity":1,"price":9.90}]. If quantity is unclear use 1. If price is unclear use null. Do not include tax lines, totals, or store information.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as any;
    throw new Error(err.error?.message ?? `שגיאת API ${response.status}`);
  }

  const data = await response.json() as any;
  const text: string = data.content?.[0]?.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('לא זוהו פריטים בקבלה');
  return JSON.parse(match[0]) as OcrItem[];
}
