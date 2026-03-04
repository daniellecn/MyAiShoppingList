import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { guessDepartment } from '../data/itemDepartmentMap';
import { recognizeReceiptItems } from '../utils/receiptOcr';
import type { OcrItem } from '../utils/receiptOcr';

type OcrState = 'idle' | 'scanning' | 'done' | 'error';

export function ReceiptUploadScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isRetro: boolean = route.params?.mode === 'retro';

  const currentList = useStore(s => s.currentList);
  const addItem = useStore(s => s.addItem);
  const toggleItem = useStore(s => s.toggleItem);
  const saveCurrentListToHistory = useStore(s => s.saveCurrentListToHistory);
  const saveArbitraryListToHistory = useStore(s => s.saveArbitraryListToHistory);
  const selectedSupermarketId = useStore(s => s.selectedSupermarketId);
  const supermarkets = useStore(s => s.supermarkets);
  const anthropicApiKey = useStore(s => s.anthropicApiKey);
  const setAnthropicApiKey = useStore(s => s.setAnthropicApiKey);

  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // OCR state
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [ocrItems, setOcrItems] = useState<OcrItem[]>([]);
  const [ocrError, setOcrError] = useState('');
  // Which OCR items are selected for saving
  const [selectedOcrIds, setSelectedOcrIds] = useState<Set<number>>(new Set());

  // Manual mode (when no OCR): current list marking + extra items
  const [boughtIds, setBoughtIds] = useState<Set<string>>(new Set());
  const [extraItems, setExtraItems] = useState<string[]>([]);
  const [boughtExtras, setBoughtExtras] = useState<Set<number>>(new Set());

  // Retro mode: date for old shopping
  const defaultDateStr = new Date().toLocaleDateString('he-IL');
  const [retroDateStr, setRetroDateStr] = useState(defaultDateStr);

  const useOcr = ocrState === 'done' && ocrItems.length > 0;
  const showManual = !useOcr;

  const runOcr = async (uri: string) => {
    if (!anthropicApiKey) return;
    setOcrState('scanning');
    setOcrError('');
    try {
      const items = await recognizeReceiptItems(uri, anthropicApiKey);
      setOcrItems(items);
      setSelectedOcrIds(new Set(items.map((_, i) => i)));
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

  const toggleOcrItem = (idx: number) => {
    setSelectedOcrIds(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleBought = (id: string) => {
    setBoughtIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExtra = (idx: number) => {
    setBoughtExtras(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleAddExtraItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    const match = currentList.find(i =>
      i.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(i.name.toLowerCase()),
    );
    if (match) {
      setBoughtIds(prev => new Set([...prev, match.id]));
      Alert.alert('נמצא ברשימה', `"${match.name}" סומן כנקנה`);
    } else {
      setExtraItems(prev => [...prev, name]);
      setBoughtExtras(prev => new Set([...prev, extraItems.length]));
    }
    setNewItemName('');
  };

  const handleSaveApiKey = () => {
    const key = apiKeyInput.trim();
    if (!key) return;
    setAnthropicApiKey(key);
    setShowApiKeyInput(false);
    setApiKeyInput('');
    if (receiptUri) runOcr(receiptUri);
  };

  // Retro save: parse the Hebrew/English date string back or just use today
  const parseRetroDate = (): string => {
    // Try parsing common formats; fallback to today
    const parts = retroDateStr.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
    if (parts) {
      const [, d, m, y] = parts;
      const year = y.length === 2 ? `20${y}` : y;
      return new Date(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`).toISOString();
    }
    return new Date().toISOString();
  };

  const handleSaveOcr = () => {
    const selected = ocrItems.filter((_, i) => selectedOcrIds.has(i));
    if (selected.length === 0) {
      Alert.alert('לא נבחרו פריטים', 'בחר לפחות פריט אחד');
      return;
    }

    if (isRetro || currentList.length === 0) {
      // Save directly to history
      const isoDate = parseRetroDate();
      saveArbitraryListToHistory(
        selected.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: 'יח',
          estimatedPrice: item.price ?? undefined,
          departmentId: guessDepartment(item.name),
        })),
        selectedSupermarketId ?? undefined,
        receiptUri ?? undefined,
        isoDate,
      );
      navigation.goBack();
    } else {
      // Match OCR items against current list, mark as bought, add extras
      const boughtFromOcr = new Set<string>();
      const extrasFromOcr: string[] = [];
      selected.forEach(item => {
        const match = currentList.find(i =>
          i.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(i.name.toLowerCase()),
        );
        if (match) {
          boughtFromOcr.add(match.id);
        } else {
          extrasFromOcr.push(item.name);
        }
      });
      boughtFromOcr.forEach(id => {
        const item = currentList.find(i => i.id === id);
        if (item && !item.checked) toggleItem(id);
      });
      extrasFromOcr.forEach(name => {
        addItem({ name, quantity: 1, unit: 'יח', departmentId: guessDepartment(name) });
      });
      setTimeout(() => {
        saveCurrentListToHistory(selectedSupermarketId ?? undefined, receiptUri ?? undefined);
        navigation.goBack();
      }, 100);
    }
  };

  const handleSaveManual = () => {
    const total = boughtIds.size + boughtExtras.size;
    if (total === 0) {
      Alert.alert('לא סומן דבר', 'סמן לפחות פריט אחד לפני שמירה');
      return;
    }
    boughtIds.forEach(id => {
      const item = currentList.find(i => i.id === id);
      if (item && !item.checked) toggleItem(id);
    });
    extraItems.forEach((name, idx) => {
      if (boughtExtras.has(idx)) {
        addItem({ name, quantity: 1, unit: 'יח', departmentId: guessDepartment(name) });
      }
    });
    setTimeout(() => {
      saveCurrentListToHistory(selectedSupermarketId ?? undefined, receiptUri ?? undefined);
      navigation.goBack();
    }, 100);
  };

  const canSave = useOcr
    ? selectedOcrIds.size > 0
    : boughtIds.size + boughtExtras.size > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isRetro ? 'קבלה ישנה 🧾' : 'העלה קבלה 🧾'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* API key setup */}
        {!anthropicApiKey && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔑 זיהוי אוטומטי מקבלה</Text>
            <Text style={styles.cardHint}>
              הוסף מפתח Anthropic API לזיהוי אוטומטי של פריטים מתמונת הקבלה
            </Text>
            {showApiKeyInput ? (
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  placeholder="sk-ant-..."
                  placeholderTextColor="#bbb"
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  autoCapitalize="none"
                  secureTextEntry
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleSaveApiKey}>
                  <Text style={styles.addBtnText}>שמור</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.apiKeyBtn}
                onPress={() => setShowApiKeyInput(true)}
              >
                <Text style={styles.apiKeyBtnText}>הגדר מפתח API</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Retro date picker */}
        {isRetro && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 תאריך הקנייה</Text>
            <TextInput
              style={styles.dateInput}
              value={retroDateStr}
              onChangeText={setRetroDateStr}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#bbb"
              textAlign="right"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        )}

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

          {/* OCR scanning indicator */}
          {ocrState === 'scanning' && (
            <View style={styles.ocrLoading}>
              <ActivityIndicator color="#8A7BC4" />
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
        </View>

        {/* OCR Results */}
        {useOcr && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>✅ זוהו {ocrItems.length} פריטים</Text>
              <TouchableOpacity onPress={() => {
                if (selectedOcrIds.size === ocrItems.length) {
                  setSelectedOcrIds(new Set());
                } else {
                  setSelectedOcrIds(new Set(ocrItems.map((_, i) => i)));
                }
              }}>
                <Text style={styles.selectAllBtn}>
                  {selectedOcrIds.size === ocrItems.length ? 'בטל הכל' : 'בחר הכל'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardHint}>לחץ לבחירה / ביטול</Text>
            {ocrItems.map((item, idx) => {
              const selected = selectedOcrIds.has(idx);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.itemRow, selected && styles.itemRowBought]}
                  onPress={() => toggleOcrItem(idx)}
                >
                  <View style={[styles.itemCheck, selected && styles.itemCheckOn]}>
                    {selected && <Text style={styles.itemCheckMark}>✓</Text>}
                  </View>
                  <Text style={[styles.itemName, selected && styles.itemNameBought]}>{item.name}</Text>
                  <Text style={styles.itemQty}>{item.quantity} יח</Text>
                  {item.price != null && (
                    <Text style={styles.itemPrice}>₪{item.price.toFixed(2)}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Manual mode: current list (only when not retro and OCR didn't work) */}
        {showManual && !isRetro && currentList.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>סמן מה נקנה מהרשימה</Text>
            <Text style={styles.cardHint}>לחץ על פריט לסימון כנקנה</Text>
            {currentList.map(item => {
              const bought = boughtIds.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemRow, bought && styles.itemRowBought]}
                  onPress={() => toggleBought(item.id)}
                >
                  <View style={[styles.itemCheck, bought && styles.itemCheckOn]}>
                    {bought && <Text style={styles.itemCheckMark}>✓</Text>}
                  </View>
                  <Text style={[styles.itemName, bought && styles.itemNameBought]}>{item.name}</Text>
                  <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Add items manually */}
        {showManual && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isRetro ? 'הוסף פריטים' : 'הוסף פריט שלא ברשימה'}
            </Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="שם פריט..."
                placeholderTextColor="#bbb"
                value={newItemName}
                onChangeText={setNewItemName}
                textAlign="right"
                returnKeyType="done"
                onSubmitEditing={handleAddExtraItem}
              />
              <TouchableOpacity
                style={[styles.addBtn, !newItemName.trim() && styles.addBtnDisabled]}
                onPress={handleAddExtraItem}
                disabled={!newItemName.trim()}
              >
                <Text style={styles.addBtnText}>הוסף</Text>
              </TouchableOpacity>
            </View>
            {extraItems.map((name, idx) => {
              const bought = boughtExtras.has(idx);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.itemRow, bought && styles.itemRowBought]}
                  onPress={() => toggleExtra(idx)}
                >
                  <View style={[styles.itemCheck, bought && styles.itemCheckOn]}>
                    {bought && <Text style={styles.itemCheckMark}>✓</Text>}
                  </View>
                  <Text style={[styles.itemName, bought && styles.itemNameBought]}>{name}</Text>
                  <Text style={styles.newBadge}>חדש</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={useOcr ? handleSaveOcr : handleSaveManual}
          disabled={!canSave}
        >
          <Text style={styles.saveBtnText}>
            {useOcr
              ? `שמור — ${selectedOcrIds.size} פריטים ✓`
              : canSave
                ? `שמור — ${boughtIds.size + boughtExtras.size} פריטים ✓`
                : ocrState === 'idle' && !receiptUri
                  ? 'צלם קבלה לזיהוי אוטומטי'
                  : 'סמן פריטים שנקנו'}
          </Text>
        </TouchableOpacity>
        {anthropicApiKey && (
          <TouchableOpacity onPress={() => { setAnthropicApiKey(null); }} style={styles.removeKeyBtn}>
            <Text style={styles.removeKeyText}>הסר מפתח API</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    backgroundColor: '#8A7BC4',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  content: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
    gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHint: { fontSize: 12, color: '#aaa' },
  selectAllBtn: { fontSize: 13, color: '#8A7BC4', fontWeight: '700' },

  apiKeyBtn: {
    backgroundColor: '#8A7BC4', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  apiKeyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  dateInput: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: '#333', backgroundColor: '#fafafa',
  },

  photoButtons: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1, backgroundColor: '#f0f4f8', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#e0e8f0', borderStyle: 'dashed',
  },
  photoBtnIcon: { fontSize: 26 },
  photoBtnText: { fontSize: 12, fontWeight: '600', color: '#555' },
  receiptImage: { width: '100%', height: 200, borderRadius: 10 },
  retakeBtn: {
    marginTop: 8, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, backgroundColor: '#f0f4f8',
  },
  retakeBtnText: { fontSize: 13, color: '#555', fontWeight: '600' },

  ocrLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  ocrLoadingText: { fontSize: 13, color: '#8A7BC4', fontWeight: '600' },
  ocrError: { gap: 4 },
  ocrErrorText: { fontSize: 13, color: '#C4655A' },
  retryText: { fontSize: 13, color: '#8A7BC4', fontWeight: '700' },

  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
    borderRadius: 8,
  },
  itemRowBought: { backgroundColor: '#f0f6f2' },
  itemCheck: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#c8d8e0',
    justifyContent: 'center', alignItems: 'center',
  },
  itemCheckOn: { backgroundColor: '#5C8A6B', borderColor: '#5C8A6B' },
  itemCheckMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  itemName: { flex: 1, fontSize: 15, color: '#333' },
  itemNameBought: { color: '#5C8A6B', fontWeight: '600' },
  itemQty: { fontSize: 12, color: '#aaa' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#5C8A6B' },
  newBadge: {
    fontSize: 10, color: '#7BA8C4', fontWeight: '700',
    borderWidth: 1, borderColor: '#7BA8C4', borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 1,
  },

  addRow: { flexDirection: 'row', gap: 10 },
  addInput: {
    flex: 1, height: 42, borderWidth: 1.5, borderColor: '#e0e0e0',
    borderRadius: 10, paddingHorizontal: 12, fontSize: 15,
    backgroundColor: '#fafafa', color: '#1a1a1a',
  },
  addBtn: {
    backgroundColor: '#5C8A6B', borderRadius: 10,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#ccc' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  footer: { padding: 16, gap: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  saveBtn: {
    backgroundColor: '#5C8A6B', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#ccc' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  removeKeyBtn: { paddingVertical: 6, alignItems: 'center' },
  removeKeyText: { fontSize: 12, color: '#aaa' },
});
