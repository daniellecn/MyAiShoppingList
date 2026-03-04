import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useStore } from '../store/useStore';
import { DEFAULT_DEPARTMENTS } from '../data/departments';
import { guessDepartment } from '../data/itemDepartmentMap';
import { findDuplicate } from '../utils/duplicateCheck';
import { parseVoiceInput } from '../utils/voiceParse';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { VoiceButton } from './VoiceButton';
import { DepartmentBadge } from './DepartmentBadge';
import { Unit } from '../types';

const UNITS: Unit[] = ['יח', 'ק"ג', 'גרם', 'ליטר', 'מ"ל', 'אריזה', 'צרור'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddItemModal({ visible, onClose }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<Unit>('יח');
  const [departmentId, setDepartmentId] = useState('other');
  const [showDeptPicker, setShowDeptPicker] = useState(false);

  const addItem = useStore(s => s.addItem);
  const updateItemQuantity = useStore(s => s.updateItemQuantity);
  const currentList = useStore(s => s.currentList);
  const itemDepartmentOverrides = useStore(s => s.itemDepartmentOverrides);
  const setItemDepartmentOverride = useStore(s => s.setItemDepartmentOverride);

  const handleVoiceResult = useCallback((text: string) => {
    const parsed = parseVoiceInput(text);
    setName(parsed.name);
    setQuantity(parsed.quantity);
    setUnit(parsed.unit);
    const override = itemDepartmentOverrides[parsed.name.toLowerCase().trim()];
    setDepartmentId(override ?? guessDepartment(parsed.name));
  }, [itemDepartmentOverrides]);

  const { isListening, error: voiceError, startListening, stopListening } = useVoiceInput(handleVoiceResult);

  const handleNameChange = (text: string) => {
    setName(text);
    if (text.trim()) {
      const override = itemDepartmentOverrides[text.toLowerCase().trim()];
      setDepartmentId(override ?? guessDepartment(text));
    }
  };

  const handleAdd = () => {
    if (!name.trim()) return;

    const duplicate = findDuplicate(currentList, name);
    if (duplicate) {
      Alert.alert(
        'פריט קיים',
        `"${duplicate.name}" כבר ברשימה (כמות: ${duplicate.quantity} ${duplicate.unit}).\nלסכם את הכמות?`,
        [
          {
            text: 'כן, סכם',
            onPress: () => {
              const newQty = duplicate.quantity + quantity;
              updateItemQuantity(duplicate.id, newQty);
              reset();
              onClose();
            },
          },
          {
            text: 'הוסף בנפרד',
            onPress: () => {
              doAdd();
            },
          },
          { text: 'ביטול', style: 'cancel' },
        ],
      );
      return;
    }

    doAdd();
  };

  const doAdd = () => {
    addItem({ name: name.trim(), quantity, unit, departmentId });
    if (departmentId !== guessDepartment(name)) {
      setItemDepartmentOverride(name.trim(), departmentId);
    }
    reset();
    onClose();
  };

  const reset = () => {
    setName('');
    setQuantity(1);
    setUnit('יח');
    setDepartmentId('other');
    setShowDeptPicker(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>הוסף פריט</Text>

          {/* Name row */}
          <View style={styles.nameRow}>
            <TextInput
              style={styles.input}
              placeholder="שם הפריט..."
              value={name}
              onChangeText={handleNameChange}
              autoFocus
              textAlign="right"
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <VoiceButton
              isListening={isListening}
              onPress={isListening ? stopListening : startListening}
              size={44}
            />
          </View>
          {voiceError && <Text style={styles.voiceError}>{voiceError}</Text>}

          {/* Department */}
          <TouchableOpacity onPress={() => setShowDeptPicker(!showDeptPicker)}>
            <View style={styles.deptRow}>
              <Text style={styles.label}>מדור:</Text>
              <DepartmentBadge departmentId={departmentId} />
              <Text style={styles.chevron}>{showDeptPicker ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>

          {showDeptPicker && (
            <ScrollView style={styles.deptPicker} horizontal showsHorizontalScrollIndicator={false}>
              {DEFAULT_DEPARTMENTS.map(dept => (
                <TouchableOpacity
                  key={dept.id}
                  onPress={() => { setDepartmentId(dept.id); setShowDeptPicker(false); }}
                  style={[styles.deptOption, departmentId === dept.id && styles.deptOptionSelected]}
                >
                  <Text style={styles.deptOptionIcon}>{dept.icon}</Text>
                  <Text style={styles.deptOptionName}>{dept.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Quantity row */}
          <View style={styles.qtyRow}>
            <Text style={styles.label}>כמות:</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.qtyInput}
              value={String(quantity)}
              onChangeText={t => setQuantity(Number(t) || 1)}
              keyboardType="numeric"
              textAlign="center"
            />
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => q + 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
              {UNITS.map(u => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.unitChip, unit === u && styles.unitChipSelected]}
                >
                  <Text style={[styles.unitText, unit === u && styles.unitTextSelected]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Add button */}
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={!name.trim()}>
            <Text style={styles.addBtnText}>הוסף לרשימה ➕</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', color: '#1a1a1a' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 17, backgroundColor: '#fafafa',
  },
  voiceError: { color: '#F44336', fontSize: 12, textAlign: 'center' },
  deptRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, color: '#555', fontWeight: '500' },
  chevron: { color: '#888', marginLeft: 'auto' },
  deptPicker: { maxHeight: 80 },
  deptOption: {
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    marginRight: 8, borderRadius: 10, borderWidth: 1, borderColor: '#eee',
    backgroundColor: '#fafafa',
  },
  deptOptionSelected: { borderColor: '#5C8A6B', backgroundColor: '#edf4f0' },
  deptOptionIcon: { fontSize: 20 },
  deptOptionName: { fontSize: 10, color: '#555', marginTop: 2, textAlign: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { fontSize: 20, fontWeight: '600', color: '#333' },
  qtyInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    width: 44, paddingVertical: 4, fontSize: 16,
  },
  unitScroll: { flex: 1 },
  unitChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd', marginRight: 6, backgroundColor: '#fafafa',
  },
  unitChipSelected: { borderColor: '#5C8A6B', backgroundColor: '#edf4f0' },
  unitText: { fontSize: 13, color: '#555' },
  unitTextSelected: { color: '#2e7d32', fontWeight: '600' },
  addBtn: {
    backgroundColor: '#5C8A6B', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  addBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
