import { useState, useEffect, useCallback } from 'react';

// @react-native-voice/voice requires a native build (dev client).
// In Expo Go it is not available, so we load it dynamically and degrade gracefully.
let Voice: any = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch {
  // Native module not available in Expo Go — voice will be disabled
}

export function useVoiceInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = Voice !== null;

  useEffect(() => {
    if (!available) return;
    Voice.onSpeechResults = (e: any) => {
      const result = e.value?.[0];
      if (result) {
        onResult(result);
        setIsListening(false);
      }
    };
    Voice.onSpeechError = (e: any) => {
      setError(e.error?.message ?? 'שגיאה בזיהוי קול');
      setIsListening(false);
    };
    Voice.onSpeechEnd = () => setIsListening(false);
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [onResult, available]);

  const startListening = useCallback(async () => {
    if (!available) {
      setError('זיהוי קול אינו זמין ב-Expo Go. נדרש בניית אפליקציה מלאה.');
      return;
    }
    try {
      setError(null);
      await Voice.start('he-IL');
      setIsListening(true);
    } catch (e: any) {
      setError(e.message);
    }
  }, [available]);

  const stopListening = useCallback(async () => {
    if (!available) return;
    try {
      await Voice.stop();
      setIsListening(false);
    } catch {}
  }, [available]);

  return { isListening, error, startListening, stopListening, available };
}
