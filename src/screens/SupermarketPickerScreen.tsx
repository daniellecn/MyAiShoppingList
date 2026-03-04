import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';

export function SupermarketPickerScreen() {
  const navigation = useNavigation<any>();
  const supermarkets = useStore(s => s.supermarkets);
  const setSelectedSupermarket = useStore(s => s.setSelectedSupermarket);
  const selectedId = useStore(s => s.selectedSupermarketId);

  const handleSelect = (id: string) => {
    setSelectedSupermarket(id);
    navigation.navigate('Shopping');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏪 לאיזה סופר הולכים?</Text>
        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => navigation.navigate('ManageSupermarkets')}
        >
          <Text style={styles.manageBtnText}>ניהול ⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={supermarkets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, selectedId === item.id && styles.cardSelected]}
            onPress={() => handleSelect(item.id)}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.promotionUrl ? (
                <Text style={styles.discountLabel}>🏷 מבצעים זמינים</Text>
              ) : null}
            </View>
            {selectedId === item.id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    backgroundColor: '#C4865A',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  manageBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, marginBottom: 2,
  },
  manageBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
    borderWidth: 2, borderColor: 'transparent',
  },
  cardSelected: { borderColor: '#C4865A', backgroundColor: '#FDF5EE' },
  cardLeft: { flex: 1, gap: 3 },
  cardName: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  discountLabel: { fontSize: 12, color: '#C4865A', fontWeight: '600' },
  checkmark: { color: '#C4865A', fontSize: 22, fontWeight: '700' },
});
