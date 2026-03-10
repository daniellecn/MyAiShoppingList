import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity, Alert,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { ItemCard } from '../components/ItemCard';
import { DEFAULT_DEPARTMENTS, getAllDepartments } from '../data/departments';
import { fetchDiscountsForSupermarket, matchDiscountsToItem } from '../utils/discountFetch';
import { Department, Item } from '../types';
import { Colors } from '../theme/colors';

interface DeptSection {
  id: string;
  title: string;
  color: string;
  icon: string;
  data: Item[];
}

export function ShoppingModeScreen() {
  const navigation = useNavigation<any>();
  const currentList = useStore(s => s.currentList);
  const supermarkets = useStore(s => s.supermarkets);
  const selectedSupermarketId = useStore(s => s.selectedSupermarketId);
  const discounts = useStore(s => s.discounts);
  const setDiscounts = useStore(s => s.setDiscounts);
  const updateSupermarketDepartmentOrder = useStore(s => s.updateSupermarketDepartmentOrder);
  const toggleManualDiscount = useStore(s => s.toggleManualDiscount);
  const customDepartments = useStore(s => s.customDepartments);

  const [editingOrder, setEditingOrder] = useState(false);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);

  const supermarket = supermarkets.find(s => s.id === selectedSupermarketId);
  const allDepartments = useMemo(() => getAllDepartments(customDepartments), [customDepartments]);

  useEffect(() => {
    if (!supermarket?.promotionUrl) return;
    setLoadingDiscounts(true);
    fetchDiscountsForSupermarket(supermarket.id, supermarket.promotionUrl)
      .then(fetched => {
        if (fetched.length > 0) {
          const manual = discounts.filter(d => d.isManual);
          setDiscounts([...manual, ...fetched]);
        }
      })
      .finally(() => setLoadingDiscounts(false));
  }, [supermarket?.id]);

  const orderedDeptIds = useMemo(() => {
    const base = supermarket?.departmentOrder ?? DEFAULT_DEPARTMENTS.map(d => d.id);
    const extra = customDepartments.map(d => d.id).filter(id => !base.includes(id));
    return [...base, ...extra];
  }, [supermarket, customDepartments]);

  const sections: DeptSection[] = useMemo(() => {
    const byDept: Record<string, Item[]> = {};
    currentList.forEach(item => {
      if (!byDept[item.departmentId]) byDept[item.departmentId] = [];
      byDept[item.departmentId].push(item);
    });
    return orderedDeptIds
      .map(deptId => {
        const dept = allDepartments.find(d => d.id === deptId) ?? allDepartments[allDepartments.length - 1];
        return { id: deptId, title: dept.name, color: dept.color, icon: dept.icon, data: byDept[deptId] ?? [] };
      })
      .filter(s => s.data.length > 0);
  }, [currentList, orderedDeptIds, allDepartments]);

  const allDeptsSorted = useMemo(() => {
    return orderedDeptIds
      .map(id => allDepartments.find(d => d.id === id) ?? allDepartments[allDepartments.length - 1]);
  }, [orderedDeptIds, allDepartments]);

  const checkedCount = currentList.filter(i => i.checked).length;
  const total = currentList.length;

  const totalEstimate = useMemo(() => {
    return currentList
      .filter(i => i.checked)
      .reduce((sum, i) => sum + (i.estimatedPrice ? i.estimatedPrice * i.quantity : 0), 0);
  }, [currentList]);

  const handleExit = () => {
    Alert.alert('יציאה מקניות', 'מה תרצה לעשות?', [
      {
        text: 'שמור מסומנים וצא',
        onPress: () => navigation.navigate('Receipt', { supermarketId: selectedSupermarketId }),
      },
      {
        text: 'צא ללא שמירה',
        style: 'destructive',
        onPress: () => navigation.popToTop(),
      },
      { text: 'המשך לקנות', style: 'cancel' },
    ]);
  };

  const handleFinish = () => {
    if (checkedCount === 0) {
      Alert.alert('לא סומן דבר', 'סמן לפחות פריט אחד לפני סיום');
      return;
    }
    navigation.navigate('Receipt', { supermarketId: selectedSupermarketId });
  };

  const handleDiscountToggle = (itemName: string) => {
    if (selectedSupermarketId) toggleManualDiscount(itemName, selectedSupermarketId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleExit} style={styles.exitBtn}>
            <Text style={styles.exitBtnText}>← יציאה</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {supermarket?.name ?? 'קניות'} {loadingDiscounts ? '⏳' : ''}
          </Text>
          {totalEstimate > 0 && (
            <View style={styles.estimateBadge}>
              <Text style={styles.estimateText}>₪{totalEstimate.toFixed(0)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.progress}>{checkedCount}/{total} פריטים</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: total > 0 ? `${(checkedCount / total) * 100}%` : '0%' }]} />
        </View>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolbarBtn, editingOrder && styles.toolbarBtnActive]}
          onPress={() => setEditingOrder(!editingOrder)}
        >
          <Text style={styles.toolbarBtnText}>{editingOrder ? '✓ שמור סדר' : '↕ סדר מדורים'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishBtnText}>סיים קנייה ✓</Text>
        </TouchableOpacity>
      </View>

      {editingOrder ? (
        <View style={styles.reorderContainer}>
          <Text style={styles.reorderHint}>גרור לשינוי סדר המדורים</Text>
          <DraggableFlatList
            data={allDeptsSorted}
            keyExtractor={item => item.id}
            onDragEnd={({ data }) => {
              if (selectedSupermarketId) {
                updateSupermarketDepartmentOrder(selectedSupermarketId, data.map(d => d.id));
              }
            }}
            renderItem={({ item, drag, isActive }: RenderItemParams<Department>) => (
              <ScaleDecorator>
                <TouchableOpacity
                  onLongPress={drag}
                  style={[styles.deptRow, isActive && styles.deptRowActive, { borderLeftColor: item.color }]}
                >
                  <Text style={styles.deptIcon}>{item.icon}</Text>
                  <Text style={styles.deptName}>{item.name}</Text>
                  <Text style={styles.dragHandle}>⠿</Text>
                </TouchableOpacity>
              </ScaleDecorator>
            )}
          />
        </View>
      ) : (
        <SectionList<Item, DeptSection>
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const discount = selectedSupermarketId
              ? matchDiscountsToItem(item.name, discounts, selectedSupermarketId)
              : undefined;
            const isManual = discounts.some(
              d => d.isManual && d.itemName === item.name.toLowerCase() && d.supermarketId === selectedSupermarketId,
            );
            return (
              <ItemCard
                item={item}
                discount={discount}
                showDepartment={false}
                hasManualDiscount={isManual}
                onDiscountToggle={() => handleDiscountToggle(item.name)}
              />
            );
          }}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: section.color + '18' }]}>
              <View style={[styles.sectionAccent, { backgroundColor: section.color }]} />
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
              <View style={[styles.countBadge, { backgroundColor: section.color }]}>
                <Text style={styles.countText}>{section.data.length}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    backgroundColor: '#7BA8C4',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 6,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  exitBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  exitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: '#fff' },
  estimateBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  estimateText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  progress: { fontSize: 14, color: '#deeaf4' },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#fff', borderRadius: 3 },
  toolbar: {
    flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  toolbarBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.controlBg, alignItems: 'center',
  },
  toolbarBtnActive: { backgroundColor: '#e8f5e9' },
  toolbarBtnText: { fontSize: 13, fontWeight: '600', color: '#333' },
  finishBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.brand, alignItems: 'center',
  },
  finishBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  list: { paddingHorizontal: 12, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingRight: 14,
    marginTop: 10, gap: 8,
  },
  sectionAccent: { width: 4, height: 32, borderRadius: 2 },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  countBadge: {
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, minWidth: 26, alignItems: 'center',
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  reorderContainer: { flex: 1, padding: 16 },
  reorderHint: { textAlign: 'center', color: '#888', fontSize: 13, marginBottom: 12 },
  deptRow: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 6, borderLeftWidth: 4,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 2,
  },
  deptRowActive: { elevation: 8, shadowOpacity: 0.2 },
  deptIcon: { fontSize: 20 },
  deptName: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  dragHandle: { fontSize: 20, color: '#ccc' },
});
