import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Item, ShoppingList } from '../types';
import { DEFAULT_SUPERMARKETS } from '../data/supermarkets';
import { DEFAULT_DEPARTMENTS } from '../data/departments';

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ─── Current list ────────────────────────────────────────────
      currentList: [],

      addItem: (itemData) => {
        const newItem: Item = {
          ...itemData,
          id: uuidv4(),
          checked: false,
          addedAt: new Date().toISOString(),
        };
        set(s => ({ currentList: [...s.currentList, newItem] }));
      },

      removeItem: (id) =>
        set(s => ({ currentList: s.currentList.filter(i => i.id !== id) })),

      toggleItem: (id) =>
        set(s => ({
          currentList: s.currentList.map(i =>
            i.id === id ? { ...i, checked: !i.checked } : i,
          ),
        })),

      updateItemQuantity: (id, quantity) =>
        set(s => ({
          currentList: s.currentList.map(i =>
            i.id === id ? { ...i, quantity } : i,
          ),
        })),

      updateItemDept: (id, departmentId) =>
        set(s => ({
          currentList: s.currentList.map(i =>
            i.id === id ? { ...i, departmentId } : i,
          ),
        })),

      clearCheckedItems: () =>
        set(s => ({ currentList: s.currentList.filter(i => !i.checked) })),

      clearCurrentList: () => set({ currentList: [] }),

      // Used by Firebase sync — sets list without triggering re-push
      setListFromSync: (items) => set({ currentList: items }),

      // ─── History ─────────────────────────────────────────────────
      history: [],
      purchaseRecords: [],

      saveCurrentListToHistory: (supermarketId, receiptPhotoUri) => {
        const { currentList, history, purchaseRecords } = get();
        if (currentList.length === 0) return;

        const checkedItems = currentList.filter(i => i.checked);
        const totalEstimate = checkedItems.reduce(
          (sum, i) => sum + (i.estimatedPrice ? i.estimatedPrice * i.quantity : 0),
          0,
        );

        const list: ShoppingList = {
          id: uuidv4(),
          name: new Date().toLocaleDateString('he-IL'),
          items: checkedItems,
          supermarketId,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          totalEstimate: totalEstimate > 0 ? totalEstimate : undefined,
          receiptPhotoUri,
        };

        const today = new Date().toISOString();
        const updatedRecords = [...purchaseRecords];
        currentList.filter(i => i.checked).forEach(item => {
          const normName = item.name.toLowerCase().trim();
          const idx = updatedRecords.findIndex(r => r.itemName === normName);
          if (idx >= 0) {
            updatedRecords[idx] = {
              ...updatedRecords[idx],
              dates: [...updatedRecords[idx].dates, today],
            };
          } else {
            updatedRecords.push({ itemName: normName, dates: [today] });
          }
        });

        set({
          history: [list, ...history],
          purchaseRecords: updatedRecords,
          currentList: currentList.filter(i => !i.checked),
        });
      },

      // ─── Supermarkets ────────────────────────────────────────────
      supermarkets: DEFAULT_SUPERMARKETS,
      selectedSupermarketId: null,

      setSelectedSupermarket: (id) => set({ selectedSupermarketId: id }),

      updateSupermarketDepartmentOrder: (supermarketId, order) =>
        set(s => ({
          supermarkets: s.supermarkets.map(sm =>
            sm.id === supermarketId ? { ...sm, departmentOrder: order } : sm,
          ),
        })),

      addSupermarket: (name, promotionUrl) => {
        const id = `sm_${Date.now()}`;
        set(s => ({
          supermarkets: [
            ...s.supermarkets,
            {
              id,
              name,
              promotionUrl,
              departmentOrder: DEFAULT_DEPARTMENTS.map(d => d.id),
            },
          ],
        }));
      },

      removeSupermarket: (id) =>
        set(s => ({
          supermarkets: s.supermarkets.filter(sm => sm.id !== id),
          selectedSupermarketId: s.selectedSupermarketId === id ? null : s.selectedSupermarketId,
        })),

      updateSupermarket: (id, updates) =>
        set(s => ({
          supermarkets: s.supermarkets.map(sm =>
            sm.id === id ? { ...sm, ...updates } : sm,
          ),
        })),

      // ─── Discounts ───────────────────────────────────────────────
      discounts: [],

      setDiscounts: (discounts) => set({ discounts }),

      toggleManualDiscount: (itemName, supermarketId) => {
        const { discounts } = get();
        const existing = discounts.find(
          d => d.itemName === itemName.toLowerCase() && d.supermarketId === supermarketId && d.isManual,
        );
        if (existing) {
          set({ discounts: discounts.filter(d => d !== existing) });
        } else {
          set({
            discounts: [
              ...discounts,
              {
                itemName: itemName.toLowerCase(),
                supermarketId,
                description: 'מבצע',
                isManual: true,
              },
            ],
          });
        }
      },

      // ─── Department overrides ────────────────────────────────────
      itemDepartmentOverrides: {},

      setItemDepartmentOverride: (itemName, departmentId) =>
        set(s => ({
          itemDepartmentOverrides: {
            ...s.itemDepartmentOverrides,
            [itemName.toLowerCase().trim()]: departmentId,
          },
        })),

      // ─── Custom departments ───────────────────────────────────────
      customDepartments: [],

      addCustomDepartment: (dept) => {
        const id = `custom_${Date.now()}`;
        set(s => ({ customDepartments: [...s.customDepartments, { ...dept, id }] }));
      },

      removeCustomDepartment: (id) =>
        set(s => ({ customDepartments: s.customDepartments.filter(d => d.id !== id) })),

      attachReceiptPhoto: (listId, uri) =>
        set(s => ({
          history: s.history.map(l => l.id === listId ? { ...l, receiptPhotoUri: uri } : l),
        })),

      // ─── Retro history entry ──────────────────────────────────────
      saveArbitraryListToHistory: (items, supermarketId, receiptPhotoUri, date) => {
        const { history, purchaseRecords } = get();
        const now = date ?? new Date().toISOString();
        const listItems = items.map(item => ({
          ...item,
          id: uuidv4(),
          checked: true,
          addedAt: now,
          unit: item.unit as any,
        }));
        const total = listItems.reduce(
          (sum, i) => sum + ((i.estimatedPrice ?? 0) * i.quantity),
          0,
        );
        const list: ShoppingList = {
          id: uuidv4(),
          name: new Date(now).toLocaleDateString('he-IL'),
          items: listItems,
          supermarketId,
          createdAt: now,
          completedAt: now,
          totalEstimate: total > 0 ? total : undefined,
          receiptPhotoUri,
        };
        const updatedRecords = [...purchaseRecords];
        listItems.forEach(item => {
          const normName = item.name.toLowerCase().trim();
          const idx = updatedRecords.findIndex(r => r.itemName === normName);
          if (idx >= 0) {
            updatedRecords[idx] = { ...updatedRecords[idx], dates: [...updatedRecords[idx].dates, now] };
          } else {
            updatedRecords.push({ itemName: normName, dates: [now] });
          }
        });
        const newHistory = [list, ...history].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        set({ history: newHistory, purchaseRecords: updatedRecords });
      },

      // ─── Anthropic API key ────────────────────────────────────────
      anthropicApiKey: null,
      setAnthropicApiKey: (key) => set({ anthropicApiKey: key }),

      // ─── Firebase sharing ────────────────────────────────────────
      shareRoomCode: null,
      shareRole: null,

      setShareRoom: (code, role) => set({ shareRoomCode: code, shareRole: role }),
    }),
    {
      name: 'shopping-list-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist ephemeral share state — family re-joins each session
      partialize: (s) => ({
        currentList: s.currentList,
        history: s.history,
        purchaseRecords: s.purchaseRecords,
        supermarkets: s.supermarkets,
        selectedSupermarketId: s.selectedSupermarketId,
        discounts: s.discounts,
        itemDepartmentOverrides: s.itemDepartmentOverrides,
        customDepartments: s.customDepartments,
        anthropicApiKey: s.anthropicApiKey,
      }),
    },
  ),
);
