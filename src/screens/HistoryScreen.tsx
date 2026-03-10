import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { ShoppingList } from '../types';
import { Colors } from '../theme/colors';

interface MonthSection {
  title: string;
  monthKey: string;
  total: number;
  data: ShoppingList[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
}

function formatMonth(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('he-IL', { year: 'numeric', month: 'long' });
}

function TripCard({ list }: { list: ShoppingList }) {
  const supermarkets = useStore(s => s.supermarkets);
  const supermarket = supermarkets.find(s => s.id === list.supermarketId);
  const [expanded, setExpanded] = useState(false);
  const displayTotal = list.totalEstimate;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.85}
    >
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardDate}>{formatDate(list.createdAt)}</Text>
          {supermarket && <Text style={styles.cardSuper}>{supermarket.name}</Text>}
        </View>
        <View style={styles.cardRight}>
          {displayTotal ? (
            <Text style={styles.totalAmount}>₪{displayTotal.toFixed(0)}</Text>
          ) : null}
          <Text style={styles.itemCount}>{list.items.length} פריטים</Text>
          {list.receiptPhotoUri && <Text style={styles.receiptIcon}>🧾</Text>}
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </View>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Receipt photo */}
          {list.receiptPhotoUri && (
            <Image
              source={{ uri: list.receiptPhotoUri }}
              style={styles.receiptThumb}
              resizeMode="cover"
            />
          )}

          {/* Items list */}
          <View style={styles.itemsList}>
            <Text style={styles.itemsHeader}>פריטים שנקנו</Text>
            {list.items.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>• {item.name}</Text>
                <Text style={styles.itemDetail}>{item.quantity} {item.unit}</Text>
                {item.estimatedPrice != null && (
                  <Text style={styles.itemPrice}>
                    ₪{(item.estimatedPrice * item.quantity).toFixed(0)}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Total row */}
          {displayTotal ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>סה״כ</Text>
              <Text style={styles.totalValue}>₪{displayTotal.toFixed(2)}</Text>
            </View>
          ) : (
            <Text style={styles.noTotal}>לא הוזן מחיר לקנייה זו</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export function HistoryScreen() {
  const navigation = useNavigation<any>();
  const history = useStore(s => s.history);

  const sections = useMemo((): MonthSection[] => {
    const map: Record<string, ShoppingList[]> = {};
    history.forEach(list => {
      const key = new Date(list.createdAt).toISOString().slice(0, 7);
      if (!map[key]) map[key] = [];
      map[key].push(list);
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, trips]) => ({
        title: formatMonth(key + '-01'),
        monthKey: key,
        total: trips.reduce((s, t) => s + (t.totalEstimate ?? 0), 0),
        data: trips,
      }));
  }, [history]);

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>📋 היסטוריה והוצאות</Text>
            <TouchableOpacity style={styles.receiptBtn} onPress={() => navigation.navigate('ReceiptUpload', { mode: 'retro' })}>
              <Text style={styles.receiptBtnText}>🧾 העלה קבלה</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>0 קניות</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>אין היסטוריה עדיין</Text>
          <Text style={styles.emptySubtext}>לאחר שמירת קנייה יופיעו כאן הנתונים</Text>
        </View>
      </View>
    );
  }

  const yearTotal = sections
    .filter(s => s.monthKey.startsWith(new Date().getFullYear().toString()))
    .reduce((s, m) => s + m.total, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>📋 היסטוריה והוצאות</Text>
          <TouchableOpacity style={styles.receiptBtn} onPress={() => navigation.navigate('ReceiptUpload', { mode: 'retro' })}>
            <Text style={styles.receiptBtnText}>🧾 העלה קבלה</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.subtitle}>{history.length} קניות</Text>
          {yearTotal > 0 && (
            <Text style={styles.yearTotal}>סה״כ השנה: ₪{yearTotal.toFixed(0)}</Text>
          )}
        </View>
      </View>

      <SectionList<ShoppingList, MonthSection>
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View style={styles.monthHeader}>
            <Text style={styles.monthLabel}>{section.title}</Text>
            {section.total > 0 && (
              <Text style={styles.monthTotal}>₪{section.total.toFixed(0)}</Text>
            )}
          </View>
        )}
        renderItem={({ item }) => <TripCard list={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    backgroundColor: '#8A7BC4',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 4,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  receiptBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  receiptBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  headerStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtitle: { fontSize: 14, color: '#d8d0f0' },
  yearTotal: { fontSize: 14, fontWeight: '700', color: '#fff' },
  list: { padding: 12, paddingBottom: 30 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#555' },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 40 },

  monthHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#8A7BC4',
    paddingHorizontal: 16, paddingVertical: 10,
    marginBottom: 4,
    borderRadius: 10,
  },
  monthLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  monthTotal: { fontSize: 15, fontWeight: '800', color: '#fff' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 8,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { gap: 2, flex: 1 },
  cardDate: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  cardSuper: { fontSize: 13, color: '#8A7BC4' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalAmount: { fontSize: 16, fontWeight: '700', color: Colors.brand },
  itemCount: { fontSize: 13, color: '#aaa' },
  receiptIcon: { fontSize: 16 },
  chevron: { color: '#bbb', fontSize: 12 },

  expandedContent: { marginTop: 12, gap: 10 },
  receiptThumb: {
    width: '100%', height: 200, borderRadius: 10,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  itemsList: {
    borderTopWidth: 1, borderTopColor: Colors.controlBg, paddingTop: 10, gap: 4,
  },
  itemsHeader: { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  itemName: { flex: 1, fontSize: 14, color: '#333' },
  itemDetail: { fontSize: 13, color: '#aaa' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: Colors.brand },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: Colors.controlBg, paddingTop: 10,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  totalValue: { fontSize: 15, fontWeight: '800', color: Colors.brand },
  noTotal: { fontSize: 13, color: '#bbb', fontStyle: 'italic', textAlign: 'center', paddingTop: 6 },
});
