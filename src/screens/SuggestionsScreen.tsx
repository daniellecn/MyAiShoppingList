import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFrequencySuggestions, Suggestion } from '../hooks/useFrequencySuggestions';
import { useStore } from '../store/useStore';
import { getAllDepartments } from '../data/departments';
import { guessDepartment } from '../data/itemDepartmentMap';

interface DeptSection {
  deptId: string;
  title: string;
  icon: string;
  color: string;
  data: Suggestion[];
}

export function SuggestionsScreen() {
  const navigation = useNavigation<any>();
  const suggestions = useFrequencySuggestions();
  const addItem = useStore(s => s.addItem);
  const customDepartments = useStore(s => s.customDepartments);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allDepts = useMemo(() => getAllDepartments(customDepartments), [customDepartments]);

  const sections = useMemo((): DeptSection[] => {
    const byDept: Record<string, Suggestion[]> = {};
    suggestions.forEach(s => {
      const deptId = guessDepartment(s.itemName);
      if (!byDept[deptId]) byDept[deptId] = [];
      byDept[deptId].push(s);
    });
    return allDepts
      .filter(d => byDept[d.id]?.length)
      .map(d => ({
        deptId: d.id,
        title: d.name,
        icon: d.icon,
        color: d.color,
        data: byDept[d.id],
      }));
  }, [suggestions, allDepts]);

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selected.size === suggestions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(suggestions.map(s => s.itemName)));
    }
  };

  const handleAddSelected = () => {
    selected.forEach(name => {
      addItem({ name, quantity: 1, unit: 'יח', departmentId: guessDepartment(name) });
    });
  };

  const handleContinue = () => {
    if (selected.size > 0) handleAddSelected();
    navigation.navigate('SupermarketPicker');
  };

  const handleSkip = () => navigation.navigate('SupermarketPicker');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💡 מה כדאי לקנות?</Text>
        <Text style={styles.subtitle}>לפי הרגלי הקנייה שלך</Text>
      </View>

      {suggestions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>אין הצעות עדיין</Text>
          <Text style={styles.emptySubtext}>לאחר מספר קניות נוכל להציע לך פריטים</Text>
        </View>
      ) : (
        <SectionList<Suggestion, DeptSection>
          sections={sections}
          keyExtractor={item => item.itemName}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.selectedCount}>
                {selected.size > 0 ? `${selected.size} נבחרו` : `${suggestions.length} הצעות`}
              </Text>
              <TouchableOpacity onPress={handleSelectAll}>
                <Text style={styles.selectAllBtn}>
                  {selected.size === suggestions.length ? 'בטל הכל' : 'בחר הכל'}
                </Text>
              </TouchableOpacity>
            </View>
          }
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
          renderItem={({ item }) => {
            const isSelected = selected.has(item.itemName);
            return (
              <TouchableOpacity
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => toggleSelect(item.itemName)}
                activeOpacity={0.8}
              >
                <Text style={[styles.checkCircle, isSelected && styles.checkCircleOn]}>
                  {isSelected ? '✓' : '○'}
                </Text>
                <View style={styles.cardBody}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.meta}>
                    כל ~{item.frequencyDays} ימים
                    {item.daysOverdue > 0 ? ` · עיכוב ${item.daysOverdue} ימים` : ''}
                  </Text>
                </View>
                {item.daysOverdue > 3 && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>דחוף!</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>
            {selected.size > 0 ? `הוסף ${selected.size} ועבור לסופרמרקט ←` : 'עבור לסופרמרקט ←'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>דלג על הצעות</Text>
        </TouchableOpacity>
      </View>
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
    gap: 2,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#deeaf4' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#555' },
  emptySubtext: { fontSize: 13, color: '#888', textAlign: 'center', paddingHorizontal: 40 },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10,
  },
  selectedCount: { fontSize: 13, color: '#888', fontWeight: '500' },
  selectAllBtn: { fontSize: 13, color: '#7BA8C4', fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9, paddingRight: 12,
    marginTop: 8, gap: 8,
  },
  sectionAccent: { width: 4, height: 28, borderRadius: 2 },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  countBadge: {
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
    minWidth: 22, alignItems: 'center',
  },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12,
    borderWidth: 2, borderColor: 'transparent',
    marginBottom: 6,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 2,
  },
  cardSelected: { borderColor: '#5C8A6B', backgroundColor: '#f0f6f2' },
  checkCircle: { fontSize: 22, color: '#ccc', width: 26, textAlign: 'center' },
  checkCircleOn: { color: '#5C8A6B', fontWeight: '700' },
  cardBody: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  urgentBadge: {
    backgroundColor: '#C4655A', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  urgentText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  footer: { padding: 16, gap: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  continueBtn: {
    backgroundColor: '#7BA8C4', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', elevation: 2,
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: { paddingVertical: 10, alignItems: 'center' },
  skipBtnText: { color: '#888', fontSize: 14 },
});
