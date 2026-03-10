import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, Pressable, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { getAllDepartments } from '../data/departments';
import { guessDepartment, ITEM_DEPARTMENT_MAP } from '../data/itemDepartmentMap';
import { findDuplicate } from '../utils/duplicateCheck';
import { parseVoiceInput } from '../utils/voiceParse';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { VoiceButton } from './VoiceButton';
import { Unit } from '../types';
import { Colors } from '../theme/colors';

const UNITS: Unit[] = ['יח', 'ק"ג', 'גרם', 'ליטר', 'מ"ל', 'אריזה', 'צרור'];
const PRESET_COLORS = [Colors.brand, '#2196F3', Colors.danger, '#FF9800', '#9C27B0', '#00BCD4', '#FF5722', '#795548'];

export function AddItemBar() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<Unit>('יח');
  const [departmentId, setDepartmentId] = useState('other');
  const [showOptions, setShowOptions] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // New custom dept form state
  const [estimatedPrice, setEstimatedPrice] = useState('');

  // New custom dept form state
  const [showNewDeptModal, setShowNewDeptModal] = useState(false);
  const [newDeptIcon, setNewDeptIcon] = useState('🏷');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptColor, setNewDeptColor] = useState(PRESET_COLORS[0]);

  const addItem = useStore(s => s.addItem);
  const updateItemQuantity = useStore(s => s.updateItemQuantity);
  const currentList = useStore(s => s.currentList);
  const itemDepartmentOverrides = useStore(s => s.itemDepartmentOverrides);
  const setItemDepartmentOverride = useStore(s => s.setItemDepartmentOverride);
  const purchaseRecords = useStore(s => s.purchaseRecords);
  const customDepartments = useStore(s => s.customDepartments);
  const addCustomDepartment = useStore(s => s.addCustomDepartment);

  const allDepartments = useMemo(() => getAllDepartments(customDepartments), [customDepartments]);

  // Autocomplete corpus: past bought items + common Hebrew item keywords
  const knownItems = useMemo(() => {
    const fromHistory = purchaseRecords.map(r => r.itemName);
    const fromMap = ITEM_DEPARTMENT_MAP.flatMap(e =>
      e.keywords.filter(k => /[\u05D0-\u05EA]/.test(k)),
    );
    return [...new Set([...fromHistory, ...fromMap])];
  }, [purchaseRecords]);

  const currentDept = useMemo(
    () => allDepartments.find(d => d.id === departmentId) ?? allDepartments[allDepartments.length - 1],
    [departmentId, allDepartments],
  );

  const handleVoiceResult = useCallback((text: string) => {
    const parsed = parseVoiceInput(text);
    setName(parsed.name);
    setQuantity(parsed.quantity);
    setUnit(parsed.unit);
    const override = itemDepartmentOverrides[parsed.name.toLowerCase().trim()];
    setDepartmentId(override ?? guessDepartment(parsed.name));
    setShowOptions(true);
    setSuggestions([]);
  }, [itemDepartmentOverrides]);

  const { isListening, error: voiceError, startListening, stopListening } = useVoiceInput(handleVoiceResult);

  const handleNameChange = (text: string) => {
    setName(text);
    if (text.trim()) {
      const override = itemDepartmentOverrides[text.toLowerCase().trim()];
      setDepartmentId(override ?? guessDepartment(text));
    }
    if (text.trim().length >= 2) {
      const lower = text.toLowerCase();
      setSuggestions(
        knownItems.filter(k => k.toLowerCase().includes(lower)).slice(0, 5),
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item: string) => {
    setName(item);
    setSuggestions([]);
    const override = itemDepartmentOverrides[item.toLowerCase().trim()];
    setDepartmentId(override ?? guessDepartment(item));
  };

  const cycleUnit = () => {
    const idx = UNITS.indexOf(unit);
    setUnit(UNITS[(idx + 1) % UNITS.length]);
  };

  const doAdd = () => {
    const price = estimatedPrice ? parseFloat(estimatedPrice) : undefined;
    addItem({ name: name.trim(), quantity, unit, departmentId, estimatedPrice: price });
    if (departmentId !== guessDepartment(name.trim())) {
      setItemDepartmentOverride(name.trim(), departmentId);
    }
    reset();
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    const duplicate = findDuplicate(currentList, name);
    if (duplicate) {
      Alert.alert(
        'פריט קיים',
        `"${duplicate.name}" כבר ברשימה (${duplicate.quantity} ${duplicate.unit}). לסכם כמות?`,
        [
          {
            text: 'כן',
            onPress: () => { updateItemQuantity(duplicate.id, duplicate.quantity + quantity); reset(); },
          },
          { text: 'הוסף בנפרד', onPress: doAdd },
          { text: 'ביטול', style: 'cancel' },
        ],
      );
      return;
    }
    doAdd();
  };

  const reset = () => {
    setName('');
    setQuantity(1);
    setUnit('יח');
    setDepartmentId('other');
    setEstimatedPrice('');
    setShowOptions(false);
    setShowDeptPicker(false);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleCreateDept = () => {
    if (!newDeptName.trim()) return;
    addCustomDepartment({ name: newDeptName.trim(), icon: newDeptIcon, color: newDeptColor });
    setNewDeptName('');
    setNewDeptIcon('🏷');
    setNewDeptColor(PRESET_COLORS[0]);
    setShowNewDeptModal(false);
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {suggestions.map(s => (
            <TouchableOpacity
              key={s}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(s)}
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Dept picker */}
      {showDeptPicker && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.deptPicker}
          contentContainerStyle={styles.deptPickerContent}
        >
          {allDepartments.map(dept => (
            <TouchableOpacity
              key={dept.id}
              onPress={() => { setDepartmentId(dept.id); setShowDeptPicker(false); }}
              style={[
                styles.deptOption,
                departmentId === dept.id && { borderColor: dept.color, backgroundColor: dept.color + '22' },
              ]}
            >
              <Text style={styles.deptOptionIcon}>{dept.icon}</Text>
              <Text style={styles.deptOptionName} numberOfLines={2}>{dept.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.deptOption, styles.newDeptBtn]}
            onPress={() => { setShowDeptPicker(false); setShowNewDeptModal(true); }}
          >
            <Text style={styles.deptOptionIcon}>➕</Text>
            <Text style={[styles.deptOptionName, { color: Colors.brand }]}>קטגוריה{'\n'}חדשה</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Options row: qty + unit + dept */}
      {showOptions && (
        <View style={styles.optionsRow}>
          <View style={styles.qtyGroup}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => q + 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.unitBtn} onPress={cycleUnit}>
              <Text style={styles.unitBtnText}>{unit}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.priceGroup}>
            <Text style={styles.priceSymbol}>₪</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="מחיר"
              placeholderTextColor="#bbb"
              value={estimatedPrice}
              onChangeText={t => setEstimatedPrice(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              textAlign="center"
            />
          </View>

          <TouchableOpacity
            style={[styles.deptChip, { borderColor: currentDept.color, backgroundColor: currentDept.color + '22' }]}
            onPress={() => setShowDeptPicker(v => !v)}
          >
            <Text>{currentDept.icon}</Text>
            <Text style={[styles.deptChipText, { color: currentDept.color }]} numberOfLines={1}>
              {currentDept.name}
            </Text>
            <Text style={{ color: currentDept.color, fontSize: 10 }}>{showDeptPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {voiceError ? <Text style={styles.voiceError}>{voiceError}</Text> : null}

      {/* Main input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="הוסף פריט לרשימה..."
          placeholderTextColor="#bbb"
          value={name}
          onChangeText={handleNameChange}
          textAlign="right"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
          onFocus={() => setShowOptions(true)}
        />
        <VoiceButton
          isListening={isListening}
          onPress={isListening ? stopListening : startListening}
          size={40}
        />
        <TouchableOpacity
          style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!name.trim()}
        >
          <Text style={styles.addBtnText}>הוסף</Text>
        </TouchableOpacity>
      </View>

      {/* New category modal */}
      <Modal
        visible={showNewDeptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewDeptModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowNewDeptModal(false)}>
          <Pressable style={styles.newDeptCard}>
            <Text style={styles.newDeptTitle}>קטגוריה חדשה</Text>
            <View style={styles.newDeptRow}>
              <TextInput
                style={styles.iconInput}
                value={newDeptIcon}
                onChangeText={setNewDeptIcon}
                maxLength={2}
                textAlign="center"
                placeholder="🏷"
              />
              <TextInput
                style={[styles.nameInputField, { flex: 1 }]}
                placeholder="שם הקטגוריה..."
                value={newDeptName}
                onChangeText={setNewDeptName}
                textAlign="right"
                returnKeyType="done"
              />
            </View>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, newDeptColor === c && styles.colorDotSelected]}
                  onPress={() => setNewDeptColor(c)}
                />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.createBtn, !newDeptName.trim() && styles.addBtnDisabled]}
              onPress={handleCreateDept}
              disabled={!newDeptName.trim()}
            >
              <Text style={styles.createBtnText}>צור קטגוריה</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.inputBg,
    color: Colors.textPrimary,
  },
  addBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  addBtnDisabled: { backgroundColor: '#d0d0d0' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Options row
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 10,
  },
  qtyGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.controlBg, justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '600', color: '#333' },
  qtyValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, minWidth: 22, textAlign: 'center' },
  unitBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, backgroundColor: Colors.controlBg,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  unitBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  priceGroup: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  priceSymbol: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  priceInput: {
    width: 60, height: 32, borderWidth: 1, borderColor: '#e0e0e0',
    borderRadius: 8, fontSize: 13, backgroundColor: Colors.inputBg, color: Colors.textPrimary,
  },
  deptChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  deptChipText: { flex: 1, fontSize: 12, fontWeight: '600' },

  // Dept picker
  deptPicker: { maxHeight: 90 },
  deptPickerContent: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  deptOption: {
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#eee',
    backgroundColor: Colors.inputBg, minWidth: 62,
  },
  newDeptBtn: { borderStyle: 'dashed', borderColor: Colors.brand, backgroundColor: '#f0fdf4' },
  deptOptionIcon: { fontSize: 20 },
  deptOptionName: { fontSize: 9, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },

  // Autocomplete
  suggestionsBox: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.controlBg,
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  suggestionText: { fontSize: 15, color: Colors.textPrimary, textAlign: 'right' },

  voiceError: { color: Colors.danger, fontSize: 11, textAlign: 'center', paddingVertical: 4 },

  // New dept modal
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'center', alignItems: 'center',
  },
  newDeptCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '88%', gap: 16,
  },
  newDeptTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', color: Colors.textPrimary },
  newDeptRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconInput: {
    width: 56, height: 56, borderWidth: 1.5, borderColor: '#ddd',
    borderRadius: 14, fontSize: 26, backgroundColor: Colors.inputBg,
    justifyContent: 'center', textAlignVertical: 'center',
  },
  nameInputField: {
    height: 46, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 14, fontSize: 16, backgroundColor: Colors.inputBg,
  },
  colorRow: {
    flexDirection: 'row', gap: 10, justifyContent: 'center', flexWrap: 'wrap',
  },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorDotSelected: {
    borderWidth: 3, borderColor: '#fff',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2,
  },
  createBtn: {
    backgroundColor: Colors.brand, borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
