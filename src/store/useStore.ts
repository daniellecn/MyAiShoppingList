import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Item, ShoppingList } from '../types';
import { DEFAULT_SUPERMARKETS } from '../data/supermarkets';
import { DEFAULT_DEPARTMENTS } from '../data/departments';

// Helper: update items in a specific list
const updListItems = (
  lists: ShoppingList[], id: string, fn: (items: Item[]) => Item[]
): ShoppingList[] => lists.map(l => l.id === id ? { ...l, items: fn(l.items) } : l);

// Helper: derive currentList from lists + activeListId
const deriveCurrent = (lists: ShoppingList[], id: string): Item[] =>
  lists.find(l => l.id === id)?.items ?? [];

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
        set(s => {
          const newLists = updListItems(s.lists, s.activeListId, items => [...items, newItem]);
          return { lists: newLists, currentList: deriveCurrent(newLists, s.activeListId) };
        });
      },

      removeItem: (id) => set(s => {
        const newLists = updListItems(s.lists, s.activeListId, items => items.filter(i => i.id !== id));
        return { lists: newLists, currentList: deriveCurrent(newLists, s.activeListId) };
      }),

      toggleItem: (id) => set(s => {
        const newLists = updListItems(s.lists, s.activeListId, items =>
          items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
        return { lists: newLists, currentList: deriveCurrent(newLists, s.activeListId) };
      }),

      updateItemQuantity: (id, quantity) => set(s => {
        const newLists = updListItems(s.lists, s.activeListId, items =>
          items.map(i => i.id === id ? { ...i, quantity } : i));
        return { lists: newLists, currentList: deriveCurrent(newLists, s.activeListId) };
      }),

      updateItemDept: (id, departmentId) => set(s => {
        const newLists = updListItems(s.lists, s.activeListId, items =>
          items.map(i => i.id === id ? { ...i, departmentId } : i));
        return { lists: newLists, currentList: deriveCurrent(newLists, s.activeListId) };
      }),

      clearCheckedItems: () => set(s => {
        const newLists = updListItems(s.lists, s.activeListId, items => items.filter(i => !i.checked));
        return { lists: newLists, currentList: deriveCurrent(newLists, s.activeListId) };
      }),

      clearCurrentList: () => set(s => {
        const newLists = updListItems(s.lists, s.activeListId, () => []);
        return { lists: newLists, currentList: [] };
      }),

      // Used by Firebase sync — sets list without triggering re-push
      setListFromSync: (items) => set(s => {
        const newLists = updListItems(s.lists, s.activeListId, () => items);
        return { lists: newLists, currentList: items };
      }),

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

        set(s => {
          const newLists = updListItems(s.lists, s.activeListId, items => items.filter(i => !i.checked));
          const remaining = deriveCurrent(newLists, s.activeListId);
          return { history: [list, ...history], purchaseRecords: updatedRecords, lists: newLists, currentList: remaining };
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

      // ─── Multiple lists ───────────────────────────────────────────
      lists: [],
      activeListId: '',

      createList: (name) => {
        const id = uuidv4();
        set(s => ({
          lists: [...s.lists, { id, name: name.trim(), items: [], createdAt: new Date().toISOString() }],
        }));
        return id;
      },

      renameList: (id, name) =>
        set(s => ({ lists: s.lists.map(l => l.id === id ? { ...l, name: name.trim() } : l) })),

      deleteList: (id) => set(s => {
        if (s.lists.length <= 1) return s;
        const newLists = s.lists.filter(l => l.id !== id);
        const newId = s.activeListId === id ? newLists[0].id : s.activeListId;
        return { lists: newLists, activeListId: newId, currentList: deriveCurrent(newLists, newId) };
      }),

      switchList: (id) => set(s => {
        const target = s.lists.find(l => l.id === id);
        if (!target) return s;
        return { activeListId: id, currentList: target.items };
      }),
    }),
    {
      name: 'shopping-list-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist ephemeral share state — family re-joins each session
      partialize: (s) => ({
        lists: s.lists,
        activeListId: s.activeListId,
        history: s.history,
        purchaseRecords: s.purchaseRecords,
        supermarkets: s.supermarkets,
        selectedSupermarketId: s.selectedSupermarketId,
        discounts: s.discounts,
        itemDepartmentOverrides: s.itemDepartmentOverrides,
        customDepartments: s.customDepartments,
        anthropicApiKey: s.anthropicApiKey,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.lists || state.lists.length === 0) {
          // Migrate from old single-list schema
          const legacyItems: Item[] = (state as any).currentList ?? [];
          const id = uuidv4();
          state.lists = [{ id, name: 'הרשימה שלי', items: legacyItems, createdAt: new Date().toISOString() }];
          state.activeListId = id;
        }
        // Always sync currentList from active list
        state.currentList = state.lists.find(l => l.id === state.activeListId)?.items ?? [];
      },
    },
  ),
);
