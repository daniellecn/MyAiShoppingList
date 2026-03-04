import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { recognizeReceiptItems } from '../utils/receiptOcr';
import type { OcrItem } from '../utils/receiptOcr';

type OcrState = 'idle' | 'scanning' | 'done' | 'error';

export function ReceiptScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const supermarketId: string | undefined = route.params?.supermarketId;

  const currentList = useStore(s => s.currentList);
  const saveCurrentListToHistory = useStore(s => s.saveCurrentListToHistory);
  const anthropicApiKey = useStore(s => s.anthropicApiKey);

  const checkedItems = currentList.filter(i => i.checked);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [ocrItems, setOcrItems] = useState<OcrItem[]>([]);
  const [ocrError, setOcrError] = useState('');

  const totalEstimate = checkedItems.reduce(
    (sum, i) => sum + (i.estimatedPrice ? i.estimatedPrice * i.quantity : 0),
    0,
  );

  // Calculate total from OCR if available
  const ocrTotal = ocrItems.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);

  const runOcr = async (uri: string) => {
    if (!anthropicApiKey) return;
    setOcrState('scanning');
    setOcrError('');
    try {
      const items = await recognizeReceiptItems(uri, anthropicApiKey);
      setOcrItems(items);
      setOcrState('done');
    } catch (e: any) {
      setOcrError(e.message ?? 'שגיאה בזיהוי');
      setOcrState('error');
    }
  };

  const capturePhoto = async (launcher: () => Promise<ImagePicker.ImagePickerResult>) => {
    const result = await launcher();
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setReceiptUri(uri);
      setOcrState('idle');
      setOcrItems([]);
      if (anthropicApiKey) await runOcr(uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('נדרשת הרשאה', 'אפשר גישה למצלמה בהגדרות');
      return;
    }
    await capturePhoto(() =>
      ImagePicker.launchCameraAsync({ mediaTypes: ['images'] as any, quality: 0.7 }),
    );
  };

  const handlePickPhoto = async () => {
    await capturePhoto(() =>
      ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.7 }),
    );
  };

  const handleSave = () => {
    saveCurrentListToHistory(supermarketId, receiptUri ?? undefined);
    navigation.popToTop();
  };

  const handleSkip = () => {
    saveCurrentListToHistory(supermarketId, undefined);
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>סיום קנייה 🛍</Text>
        <Text style={styles.subtitle}>{checkedItems.length} פריטים נקנו</Text>
        {(ocrState === 'done' && ocrTotal > 0) ? (
          <Text style={styles.totalText}>סה״כ מקבלה: ₪{ocrTotal.toFixed(2)}</Text>
        ) : totalEstimate > 0 ? (
          <Text style={styles.totalText}>סה״כ משוער: ₪{totalEstimate.toFixed(2)}</Text>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Checked items summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>מה קנית</Text>
          {checkedItems.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
              {item.estimatedPrice && (
                <Text style={styles.itemPrice}>₪{(item.estimatedPrice * item.quantity).toFixed(2)}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Receipt photo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>קבלה / חשבונית</Text>
          {receiptUri ? (
            <View>
              <Image source={{ uri: receiptUri }} style={styles.receiptImage} resizeMode="contain" />
              <TouchableOpacity style={styles.retakeBtn} onPress={handleTakePhoto}>
                <Text style={styles.retakeBtnText}>📷 צלם מחדש</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
                <Text style={styles.photoBtnIcon}>📷</Text>
                <Text style={styles.photoBtnText}>צלם קבלה</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto}>
                <Text style={styles.photoBtnIcon}>🖼</Text>
                <Text style={styles.photoBtnText}>מהגלריה</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* OCR status */}
          {ocrState === 'scanning' && (
            <View style={styles.ocrLoading}>
              <ActivityIndicator color="#5C8A6B" />
              <Text style={styles.ocrLoadingText}>מזהה פריטים מהקבלה...</Text>
            </View>
          )}
          {ocrState === 'error' && (
            <View style={styles.ocrError}>
              <Text style={styles.ocrErrorText}>⚠️ {ocrError}</Text>
              {receiptUri && (
                <TouchableOpacity onPress={() => runOcr(receiptUri)}>
                  <Text style={styles.retryText}>נסה שוב</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {!anthropicApiKey && receiptUri && (
            <Text style={styles.ocrHint}>הגדר מפתח API בהעלאת קבלה לזיהוי אוטומטי</Text>
          )}
        </View>

        {/* OCR Results from receipt */}
        {ocrState === 'done' && ocrItems.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 פריטים מהקבלה ({ocrItems.length})</Text>
            <Text style={styles.cardHint}>זוהה אוטומטית מתמונת הקבלה</Text>
            {ocrItems.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.quantity} יח</Text>
                {item.price != null && (
                  <Text style={styles.itemPrice}>₪{item.price.toFixed(2)}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>שמור וסיים ✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>שמור ללא קבלה</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    backgroundColor: '#5C8A6B',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    gap: 4,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 15, color: '#c8ddd0' },
  totalText: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 4 },
  content: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  cardHint: { fontSize: 12, color: '#aaa' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  itemName: { flex: 1, fontSize: 14, color: '#333' },
  itemQty: { fontSize: 13, color: '#888' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#5C8A6B' },
  photoButtons: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1, backgroundColor: '#f0f4f8', borderRadius: 14,
    paddingVertical: 20, alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#e0e8f0', borderStyle: 'dashed',
  },
  photoBtnIcon: { fontSize: 32 },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: '#555' },
  receiptImage: { width: '100%', height: 220, borderRadius: 10 },
  retakeBtn: {
    marginTop: 10, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, backgroundColor: '#f0f4f8',
  },
  retakeBtnText: { fontSize: 13, color: '#555', fontWeight: '600' },
  ocrLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  ocrLoadingText: { fontSize: 13, color: '#5C8A6B', fontWeight: '600' },
  ocrError: { gap: 4 },
  ocrErrorText: { fontSize: 13, color: '#C4655A' },
  retryText: { fontSize: 13, color: '#5C8A6B', fontWeight: '700' },
  ocrHint: { fontSize: 12, color: '#aaa', fontStyle: 'italic' },
  footer: { padding: 16, gap: 10 },
  saveBtn: {
    backgroundColor: '#5C8A6B', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: {
    borderRadius: 14, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#c8d8e0',
  },
  skipBtnText: { color: '#888', fontSize: 14, fontWeight: '600' },
});
