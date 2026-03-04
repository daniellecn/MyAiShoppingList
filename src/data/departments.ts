import { Department } from '../types';

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'produce',    name: 'ירקות ופירות',       icon: '🥦', color: '#4CAF50' },
  { id: 'dairy',      name: 'מוצרי חלב וביצים',   icon: '🥛', color: '#2196F3' },
  { id: 'meat',       name: 'בשר ועוף',            icon: '🥩', color: '#F44336' },
  { id: 'fish',       name: 'דגים ופירות ים',      icon: '🐟', color: '#03A9F4' },
  { id: 'bakery',     name: 'לחם ומאפים',          icon: '🍞', color: '#FF9800' },
  { id: 'deli',       name: 'מעדנייה',             icon: '🧀', color: '#FF5722' },
  { id: 'frozen',     name: 'קפואים',              icon: '🧊', color: '#00BCD4' },
  { id: 'canned',     name: 'שימורים ומזון יבש',  icon: '🥫', color: '#795548' },
  { id: 'snacks',     name: 'חטיפים וממתקים',     icon: '🍫', color: '#9C27B0' },
  { id: 'beverages',  name: 'משקאות',              icon: '🧃', color: '#00897B' },
  { id: 'cleaning',   name: 'ניקיון',              icon: '🧹', color: '#607D8B' },
  { id: 'hygiene',    name: 'היגיינה אישית',       icon: '🧴', color: '#E91E63' },
  { id: 'baby',       name: 'תינוקות',             icon: '👶', color: '#FFEB3B' },
  { id: 'pharma',     name: 'פארמה ובריאות',       icon: '💊', color: '#8BC34A' },
  { id: 'other',      name: 'אחר',                 icon: '🛒', color: '#9E9E9E' },
];

export const getDepartmentById = (id: string): Department =>
  DEFAULT_DEPARTMENTS.find(d => d.id === id) ?? DEFAULT_DEPARTMENTS[DEFAULT_DEPARTMENTS.length - 1];

export function getAllDepartments(customDepts: Department[]): Department[] {
  return [...DEFAULT_DEPARTMENTS, ...customDepts];
}
