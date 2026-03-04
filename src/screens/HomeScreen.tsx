import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, SectionList, Share, KeyboardAvoidingView, Platform, Modal, Pressable, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { ItemCard } from '../components/ItemCard';
import { AddItemBar } from '../components/AddItemBar';
import { getAllDepartments } from '../data/departments';
import { Item } from '../types';

interface ListSection {
  title: string;
  icon: string;
  data: Item[];
  color: string;
  deptId: string;
  allItems: Item[];
}

export function HomeScreen() {
  const navigation = useNavigation<any>();

  const currentList = useStore(s => s.currentList);
  const clearCheckedItems = useStore(s => s.clearCheckedItems);
  const customDepartments = useStore(s => s.customDepartments);
  const shareRoomCode = useStore(s => s.shareRoomCode);
  const shareRole = useStore(s => s.shareRole);
  const setItemDepartmentOverride = useStore(s => s.setItemDepartmentOverride);
  const updateItemDept = useStore(s => s.updateItemDept);

  const allDepts = useMemo(() => getAllDepartments(customDepartments), [customDepartments]);

  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const [editingDeptItem, setEditingDeptItem] = useState<Item | null>(null);

  const toggleCollapse = (deptId: string) => {
    setCollapsedDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  const sections = useMemo((): ListSection[] => {
    const byDept: Record<string, Item[]> = {};
    currentList.forEach(item => {
      if (!byDept[item.departmentId]) byDept[item.departmentId] = [];
      byDept[item.departmentId].push(item);
    });
    return allDepts
      .filter(d => (byDept[d.id]?.length ?? 0) > 0)
      .map(d => {
        const items = byDept[d.id] ?? [];
        const collapsed = collapsedDepts.has(d.id);
        return {
          title: d.name,
          icon: d.icon,
          deptId: d.id,
          allItems: items,
          data: collapsed ? [] : items,
          color: d.color,
        };
      });
  }, [currentList, allDepts, collapsedDepts]);

  const totalEstimate = useMemo(() => {
    return currentList.reduce((sum, item) => {
      return sum + (item.estimatedPrice ? item.estimatedPrice * item.quantity : 0);
    }, 0);
  }, [currentList]);

  const checkedCount = currentList.filter(i => i.checked).length;
  const isSharing = shareRoomCode !== null;

  const handleClearChecked = () => {
    Alert.alert('הסר מסומנים', `להסיר ${checkedCount} פריטים מסומנים?`, [
      { text: 'כן', onPress: clearCheckedItems },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const handleSharePress = () => {
    Alert.alert('שיתוף רשימה', 'בחר סוג שיתוף:', [
      { text: '📝 שתף כטקסט', onPress: shareAsText },
      { text: '👥 שיתוף לעריכה (משפחה)', onPress: () => navigation.navigate('Collab') },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const shareAsText = async () => {
    if (currentList.length === 0) {
      Alert.alert('הרשימה ריקה', 'אין פריטים לשיתוף');
      return;
    }
    const text = sections
      .map(s =>
        `${s.icon} ${s.title}:\n${s.allItems.map(item => `  • ${item.name} (${item.quantity} ${item.unit})`).join('\n')}`,
      )
      .join('\n\n');
    try {
      await Share.share({ message: `🛒 רשימת הקניות שלי:\n\n${text}`, title: 'רשימת קניות' });
    } catch {}
  };

  const handleChangeDept = (deptId: string) => {
    if (!editingDeptItem) return;
    updateItemDept(editingDeptItem.id, deptId);
    setItemDepartmentOverride(editingDeptItem.name, deptId);
    setEditingDeptItem(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>🛒 הרשימה שלי</Text>
          <Text style={styles.subtitle}>{currentList.length} פריטים</Text>
        </View>
        <View style={styles.headerRight}>
          {totalEstimate > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalText}>₪{totalEstimate.toFixed(0)}</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('ReceiptUpload')} style={styles.shareBtn} accessibilityLabel="העלה קבלה">
            <Text style={styles.shareIcon}>🧾</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSharePress} style={styles.shareBtn} accessibilityLabel="שתף רשימה">
            <Text style={styles.shareIcon}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live sync banner */}
      {isSharing && (
        <TouchableOpacity
          style={[styles.syncBanner, shareRole === 'owner' ? styles.syncBannerOwner : styles.syncBannerMember]}
          onPress={() => navigation.navigate('Collab')}
        >
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>
            {shareRole === 'owner'
              ? `📡 משתף בזמן אמת · קוד: ${shareRoomCode}`
              : `📡 מחובר לרשימה משותפת · קוד: ${shareRoomCode}`}
          </Text>
          <Text style={styles.syncChevron}>›</Text>
        </TouchableOpacity>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.suggestBtn} onPress={() => navigation.navigate('Suggestions')}>
          <Text style={styles.suggestBtnText}>💡 הצעות לקנייה</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.goShoppingBtn} onPress={() => navigation.navigate('SupermarketPicker')}>
          <Text style={styles.goShoppingText}>🛍 יוצאים!</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>הרשימה ריקה</Text>
          <Text style={styles.emptySubtext}>כתוב פריט למטה כדי להוסיף</Text>
        </View>
      ) : (
        <SectionList<Item, ListSection>
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onDepartmentPress={() => setEditingDeptItem(item)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.sectionHeader, { backgroundColor: section.color + '18' }]}
              onPress={() => toggleCollapse(section.deptId)}
            >
              <View style={[styles.sectionAccent, { backgroundColor: section.color }]} />
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
              <View style={[styles.countBadge, { backgroundColor: section.color }]}>
                <Text style={styles.countText}>{section.allItems.length}</Text>
              </View>
              <Text style={[styles.collapseIcon, { color: section.color }]}>
                {collapsedDepts.has(section.deptId) ? '▶' : '▼'}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled
        />
      )}

      {/* Clear checked */}
      {checkedCount > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearChecked}>
          <Text style={styles.clearBtnText}>הסר {checkedCount} מסומנים ✓</Text>
        </TouchableOpacity>
      )}

      {/* Inline add item bar */}
      <AddItemBar />

      {/* Change department modal */}
      <Modal
        visible={editingDeptItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingDeptItem(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditingDeptItem(null)}>
          <Pressable style={styles.deptModalCard}>
            <Text style={styles.deptModalTitle}>שנה קטגוריה</Text>
            <Text style={styles.deptModalItem}>{editingDeptItem?.name}</Text>
            <ScrollView style={styles.deptModalList}>
              {allDepts.map(dept => (
                <TouchableOpacity
                  key={dept.id}
                  style={[
                    styles.deptModalRow,
                    editingDeptItem?.departmentId === dept.id && { backgroundColor: dept.color + '22' },
                  ]}
                  onPress={() => handleChangeDept(dept.id)}
                >
                  <Text style={styles.deptModalIcon}>{dept.icon}</Text>
                  <Text style={[styles.deptModalName, { color: dept.color }]}>{dept.name}</Text>
                  {editingDeptItem?.departmentId === dept.id && (
                    <Text style={{ color: dept.color }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    backgroundColor: '#5C8A6B',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerLeft: { gap: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#c8ddd0', marginTop: 2 },
  totalBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  totalText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shareBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  shareIcon: { fontSize: 20 },

  syncBanner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 9, gap: 8,
  },
  syncBannerOwner: { backgroundColor: '#E8F5E9' },
  syncBannerMember: { backgroundColor: '#E3F2FD' },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5C8A6B' },
  syncText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  syncChevron: { fontSize: 18, color: '#5C8A6B', fontWeight: '700' },

  actionRow: {
    flexDirection: 'row',
    margin: 12,
    gap: 10,
  },
  suggestBtn: {
    flex: 1,
    backgroundColor: '#7BA8C4',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  suggestBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  goShoppingBtn: {
    flex: 1,
    backgroundColor: '#5C8A6B',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  goShoppingText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  list: { paddingHorizontal: 12, paddingBottom: 20 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 14,
    marginTop: 8,
    gap: 8,
  },
  sectionAccent: { width: 4, height: 32, borderRadius: 2 },
  sectionIcon: { fontSize: 22 },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '800' },
  countBadge: {
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
    minWidth: 26, alignItems: 'center',
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  collapseIcon: { fontSize: 12, fontWeight: '700' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 64 },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#555' },
  emptySubtext: { fontSize: 14, color: '#888' },

  clearBtn: {
    marginHorizontal: 12,
    marginBottom: 4,
    backgroundColor: '#D9534F',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  deptModalCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '85%', maxHeight: '70%',
  },
  deptModalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 4, color: '#1a1a1a' },
  deptModalItem: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 12 },
  deptModalList: { maxHeight: 400 },
  deptModalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 10, marginBottom: 4,
  },
  deptModalIcon: { fontSize: 22 },
  deptModalName: { flex: 1, fontSize: 15, fontWeight: '600' },
});
