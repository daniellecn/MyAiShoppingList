import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useStore } from '../store/useStore';
import { ShoppingList } from '../types';

interface MonthGroup {
  label: string;
  total: number;
  trips: ShoppingList[];
}

function formatMonth(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' });
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('he-IL');
}

export function SpendingScreen() {
  const history = useStore(s => s.history);
  const supermarkets = useStore(s => s.supermarkets);

  const monthGroups = useMemo((): MonthGroup[] => {
    const map: Record<string, ShoppingList[]> = {};
    history.forEach(list => {
      const key = new Date(list.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!map[key]) map[key] = [];
      map[key].push(list);
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, trips]) => ({
        label: formatMonth(key + '-01'),
        total: trips.reduce((s, t) => s + (t.totalEstimate ?? 0), 0),
        trips,
      }));
  }, [history]);

  const supermarketName = (id?: string) =>
    id ? (supermarkets.find(s => s.id === id)?.name ?? id) : 'לא ידוע';

  if (monthGroups.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>💰 הוצאות קניות</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>אין נתונים עדיין</Text>
          <Text style={styles.emptySubtext}>לאחר שמירת קניות יופיעו כאן הנתונים</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 הוצאות קניות</Text>
        <Text style={styles.subtitle}>
          סה״כ השנה: ₪{monthGroups
            .filter(m => m.label.includes(new Date().getFullYear().toString()))
            .reduce((s, m) => s + m.total, 0)
            .toFixed(0)}
        </Text>
      </View>

      <FlatList
        data={monthGroups}
        keyExtractor={m => m.label}
        contentContainerStyle={styles.list}
        renderItem={({ item: month }) => (
          <View style={styles.monthCard}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthLabel}>{month.label}</Text>
              {month.total > 0 && (
                <Text style={styles.monthTotal}>₪{month.total.toFixed(0)}</Text>
              )}
            </View>
            {month.trips.map(trip => (
              <View key={trip.id} style={styles.tripRow}>
                <View style={styles.tripLeft}>
                  <Text style={styles.tripDate}>{formatDate(trip.createdAt)}</Text>
                  <Text style={styles.tripSupermarket}>{supermarketName(trip.supermarketId)}</Text>
                </View>
                <View style={styles.tripRight}>
                  <Text style={styles.tripItems}>{trip.items.length} פריטים</Text>
                  {trip.totalEstimate ? (
                    <Text style={styles.tripAmount}>₪{trip.totalEstimate.toFixed(0)}</Text>
                  ) : (
                    <Text style={styles.tripNoAmount}>ללא הערכה</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      />
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
    gap: 4,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#deeaf4' },
  list: { padding: 16, gap: 14 },
  monthCard: {
    backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  monthHeader: {
    backgroundColor: '#7BA8C4',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  monthLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  monthTotal: { fontSize: 16, fontWeight: '800', color: '#fff' },
  tripRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f4f8',
  },
  tripLeft: { gap: 2 },
  tripDate: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  tripSupermarket: { fontSize: 12, color: '#888' },
  tripRight: { alignItems: 'flex-end', gap: 2 },
  tripItems: { fontSize: 12, color: '#aaa' },
  tripAmount: { fontSize: 15, fontWeight: '700', color: '#5C8A6B' },
  tripNoAmount: { fontSize: 12, color: '#bbb', fontStyle: 'italic' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 64 },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#555' },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 40 },
});
