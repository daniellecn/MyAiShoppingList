import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, Modal, TextInput, Platform, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { Colors } from '../theme/colors';
import { ShoppingList } from '../types';

export function ListsScreen() {
  const navigation = useNavigation<any>();
  const lists = useStore(s => s.lists);
  const activeListId = useStore(s => s.activeListId);
  const createList = useStore(s => s.createList);
  const renameList = useStore(s => s.renameList);
  const deleteList = useStore(s => s.deleteList);
  const switchList = useStore(s => s.switchList);

  const [renameModal, setRenameModal] = useState<{ id: string; name: string } | null>(null);
  const [renameText, setRenameText] = useState('');

  const handleCreateList = () => {
    const autoName = `רשימה ${lists.length + 1}`;
    const id = createList(autoName);
    switchList(id);
    navigation.navigate('Home');
  };

  const handleTap = (list: ShoppingList) => {
    switchList(list.id);
    navigation.navigate('Home');
  };

  const handleLongPress = (list: ShoppingList) => {
    Alert.alert(list.name, 'מה לעשות עם הרשימה?', [
      {
        text: '✏️ שנה שם',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Alert.prompt(
              'שנה שם רשימה',
              '',
              (text) => { if (text?.trim()) renameList(list.id, text.trim()); },
              'plain-text',
              list.name,
            );
          } else {
            setRenameText(list.name);
            setRenameModal({ id: list.id, name: list.name });
          }
        },
      },
      {
        text: '🗑 מחק',
        style: 'destructive',
        onPress: () => {
          if (lists.length <= 1) {
            Alert.alert('לא ניתן למחוק', 'חייבת להיות לפחות רשימה אחת');
            return;
          }
          Alert.alert('מחק רשימה', `למחוק את "${list.name}"? הפריטים יימחקו לצמיתות.`, [
            { text: 'מחק', style: 'destructive', onPress: () => deleteList(list.id) },
            { text: 'ביטול', style: 'cancel' },
          ]);
        },
      },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const handleRenameConfirm = () => {
    if (renameModal && renameText.trim()) {
      renameList(renameModal.id, renameText.trim());
    }
    setRenameModal(null);
  };

  const renderItem = ({ item }: { item: ShoppingList }) => {
    const isActive = item.id === activeListId;
    return (
      <TouchableOpacity
        style={[styles.card, isActive && styles.cardActive]}
        onPress={() => handleTap(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <Text style={[styles.cardName, isActive && styles.cardNameActive]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardCount}>{item.items.length} פריטים</Text>
        </View>
        {isActive && <Text style={styles.checkIcon}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📋 הרשימות שלי</Text>
        <Text style={styles.subtitle}>{lists.length} רשימות</Text>
      </View>

      <FlatList
        data={lists}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>אין רשימות עדיין</Text>
          </View>
        }
      />

      {/* Create new list */}
      <TouchableOpacity style={styles.createBtn} onPress={handleCreateList}>
        <Text style={styles.createBtnText}>＋ רשימה חדשה</Text>
      </TouchableOpacity>

      {/* Android rename modal */}
      <Modal
        visible={renameModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>שנה שם רשימה</Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
              placeholder="שם הרשימה"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRenameModal(null)}>
                <Text style={styles.modalCancelText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleRenameConfirm}>
                <Text style={styles.modalConfirmText}>אישור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    backgroundColor: Colors.brand,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#c8ddd0', marginTop: 2 },

  list: { padding: 12, paddingBottom: 80 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardActive: {
    borderColor: Colors.brand,
  },
  cardContent: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  cardNameActive: { color: Colors.brand },
  cardCount: { fontSize: 13, color: '#888', marginTop: 3 },
  checkIcon: { fontSize: 20, color: Colors.brand, fontWeight: '700' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888' },

  createBtn: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: Colors.brand,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 12, color: Colors.textPrimary },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'right',
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancel: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, color: '#555', fontWeight: '600' },
  modalConfirm: {
    flex: 1,
    backgroundColor: Colors.brand,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
