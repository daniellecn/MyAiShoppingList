import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';

export function ManageSupermarketsScreen() {
  const navigation = useNavigation<any>();
  const supermarkets = useStore(s => s.supermarkets);
  const addSupermarket = useStore(s => s.addSupermarket);
  const removeSupermarket = useStore(s => s.removeSupermarket);
  const updateSupermarket = useStore(s => s.updateSupermarket);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // Editing existing entry
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    addSupermarket(newName.trim(), newUrl.trim() || undefined);
    setNewName('');
    setNewUrl('');
    setShowAddModal(false);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateSupermarket(editingId, {
      name: editName.trim(),
      promotionUrl: editUrl.trim() || undefined,
    });
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('מחק סופרמרקט', `למחוק את "${name}"?`, [
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => removeSupermarket(id),
      },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const startEdit = (id: string, name: string, url?: string) => {
    setEditingId(id);
    setEditName(name);
    setEditUrl(url ?? '');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏪 ניהול סופרמרקטים</Text>
      </View>

      <FlatList
        data={supermarkets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.hint}>
            ערוך, הוסף או מחק סופרמרקטים מהרשימה. ניתן גם להוסיף כתובת URL לקבצי המבצעים.
          </Text>
        }
        renderItem={({ item }) => {
          const isEditing = editingId === item.id;
          return (
            <View style={styles.card}>
              {isEditing ? (
                <View style={styles.editForm}>
                  <TextInput
                    style={styles.editInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="שם הסופרמרקט"
                    textAlign="right"
                    autoFocus
                  />
                  <TextInput
                    style={styles.editInput}
                    value={editUrl}
                    onChangeText={setEditUrl}
                    placeholder="כתובת URL למבצעים (אופציונלי)"
                    textAlign="left"
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                      <Text style={styles.saveBtnText}>שמור</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditingId(null)}>
                      <Text style={styles.cancelEditText}>ביטול</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.cardRow}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    {item.promotionUrl ? (
                      <Text style={styles.cardUrl} numberOfLines={1}>{item.promotionUrl}</Text>
                    ) : (
                      <Text style={styles.cardUrlEmpty}>ללא כתובת מבצעים</Text>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => startEdit(item.id, item.name, item.promotionUrl)}
                    >
                      <Text style={styles.editBtnText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item.id, item.name)}
                    >
                      <Text style={styles.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addBtnText}>+ הוסף סופרמרקט</Text>
          </TouchableOpacity>
        }
      />

      {/* Add new supermarket modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>הוסף סופרמרקט</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="שם הסופרמרקט *"
              value={newName}
              onChangeText={setNewName}
              textAlign="right"
              autoFocus
            />
            <TextInput
              style={styles.modalInput}
              placeholder="כתובת URL למבצעים (אופציונלי)"
              value={newUrl}
              onChangeText={setNewUrl}
              textAlign="left"
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.urlHint}>
              אם הסופרמרקט מפרסם קבצי מבצעים לפי חוק שקיפות המחירים, הדבק את הכתובת כאן. האפליקציה תטען מבצעים אוטומטית.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalAddBtn, !newName.trim() && styles.btnDisabled]}
                onPress={handleAdd}
                disabled={!newName.trim()}
              >
                <Text style={styles.modalAddBtnText}>הוסף</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    backgroundColor: '#C4865A',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: '#fff', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  list: { padding: 16, gap: 10 },
  hint: {
    fontSize: 13, color: '#888', textAlign: 'right',
    lineHeight: 20, marginBottom: 6,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  cardUrl: { fontSize: 11, color: '#999' },
  cardUrlEmpty: { fontSize: 11, color: '#ccc', fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 6 },
  editBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#f0f0f0',
    justifyContent: 'center', alignItems: 'center',
  },
  editBtnText: { fontSize: 16 },
  deleteBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFF0F0',
    justifyContent: 'center', alignItems: 'center',
  },
  deleteBtnText: { fontSize: 16 },
  editForm: { gap: 10 },
  editInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, backgroundColor: '#fafafa',
  },
  editActions: { flexDirection: 'row', gap: 10 },
  saveBtn: {
    flex: 1, backgroundColor: '#5C8A6B', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelEditBtn: {
    flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  cancelEditText: { color: '#555', fontWeight: '600', fontSize: 15 },
  addBtn: {
    marginTop: 8, backgroundColor: '#fff',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    borderWidth: 2, borderColor: '#C4865A', borderStyle: 'dashed',
  },
  addBtnText: { color: '#C4865A', fontWeight: '700', fontSize: 16 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 14,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', color: '#1a1a1a' },
  modalInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, backgroundColor: '#fafafa',
  },
  urlHint: { fontSize: 12, color: '#999', textAlign: 'right', lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalAddBtn: {
    flex: 1, backgroundColor: '#C4865A',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#ccc' },
  modalAddBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalCancelBtn: {
    flex: 1, backgroundColor: '#f0f0f0',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  modalCancelText: { color: '#555', fontWeight: '600', fontSize: 16 },
});
