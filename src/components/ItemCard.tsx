import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Item, Discount } from '../types';
import { DepartmentBadge } from './DepartmentBadge';
import { useStore } from '../store/useStore';
import { Colors } from '../theme/colors';

interface Props {
  item: Item;
  discount?: Discount;
  showDepartment?: boolean;
  onLongPress?: () => void;
  onDepartmentPress?: () => void;
  onDiscountToggle?: () => void;
  hasManualDiscount?: boolean;
}

export function ItemCard({
  item, discount, showDepartment = true,
  onLongPress, onDepartmentPress,
  onDiscountToggle, hasManualDiscount,
}: Props) {
  const toggleItem = useStore(s => s.toggleItem);
  const updateItemQuantity = useStore(s => s.updateItemQuantity);
  const removeItem = useStore(s => s.removeItem);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onLongPress={onLongPress}
      delayLongPress={600}
      style={[styles.card, item.checked && styles.checked]}
    >
      {/* Checkbox */}
      <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkArea}>
        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
          {item.checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      {/* Name + badges */}
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, item.checked && styles.nameStrike]} numberOfLines={1}>
            {item.name}
          </Text>
          {(discount || hasManualDiscount) && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {discount?.discountPercent ? `${discount.discountPercent}% הנחה` : '🏷 מבצע'}
              </Text>
            </View>
          )}
        </View>
        {showDepartment && (
          <DepartmentBadge departmentId={item.departmentId} onPress={onDepartmentPress} size="small" />
        )}
        {item.estimatedPrice != null && (
          <Text style={styles.priceText}>
            ₪{(item.estimatedPrice * item.quantity).toFixed(item.estimatedPrice % 1 === 0 ? 0 : 2)}
          </Text>
        )}
      </View>

      {/* Right controls */}
      <View style={styles.qtyRow}>
        {onDiscountToggle && (
          <TouchableOpacity
            onPress={onDiscountToggle}
            style={[styles.discountToggle, hasManualDiscount && styles.discountToggleActive]}
          >
            <Text style={styles.discountToggleText}>🏷</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => item.quantity > 1 ? updateItemQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
        >
          <Text style={styles.qtyBtnText}>{item.quantity > 1 ? '−' : '🗑'}</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{item.quantity} {item.unit}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateItemQuantity(item.id, item.quantity + 1)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    gap: 8,
  },
  checked: { opacity: 0.55, backgroundColor: '#f5f5f5' },
  checkArea: { padding: 4 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.brand,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.brand },
  checkmark: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  body: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary, writingDirection: 'rtl' },
  nameStrike: { textDecorationLine: 'line-through', color: '#888' },
  discountBadge: {
    backgroundColor: Colors.discount,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  priceText: { fontSize: 12, color: '#7BA8C4', fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.controlBg,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '600', color: '#333' },
  qty: { fontSize: 13, color: Colors.textSecondary, minWidth: 36, textAlign: 'center' },
  discountToggle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.controlBg,
    justifyContent: 'center', alignItems: 'center',
  },
  discountToggleActive: { backgroundColor: '#fef3e2', borderWidth: 1.5, borderColor: Colors.discount },
  discountToggleText: { fontSize: 14 },
});
