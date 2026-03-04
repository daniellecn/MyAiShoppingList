import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getAllDepartments } from '../data/departments';
import { useStore } from '../store/useStore';

interface Props {
  departmentId: string;
  onPress?: () => void;
  size?: 'small' | 'normal';
}

export function DepartmentBadge({ departmentId, onPress, size = 'normal' }: Props) {
  const customDepartments = useStore(s => s.customDepartments);
  const dept = useMemo(
    () => getAllDepartments(customDepartments).find(d => d.id === departmentId)
      ?? { id: 'other', name: 'אחר', icon: '🛒', color: '#9E9E9E' },
    [departmentId, customDepartments],
  );
  const isSmall = size === 'small';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.badge, { backgroundColor: dept.color + '22', borderColor: dept.color }, isSmall && styles.small]}
    >
      <Text style={isSmall ? styles.iconSmall : styles.icon}>{dept.icon}</Text>
      <Text style={[styles.text, { color: dept.color }, isSmall && styles.textSmall]}>
        {dept.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  icon: { fontSize: 14 },
  iconSmall: { fontSize: 11 },
  text: { fontSize: 12, fontWeight: '500' },
  textSmall: { fontSize: 10 },
});
