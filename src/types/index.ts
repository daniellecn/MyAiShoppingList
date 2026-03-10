export type Unit = 'יח' | 'ק"ג' | 'גרם' | 'ליטר' | 'מ"ל' | 'אריזה' | 'צרור';

export interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  departmentId: string;
  checked: boolean;
  addedAt: string; // ISO date
  estimatedPrice?: number; // ₪ per unit
  note?: string;
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: Item[];
  supermarketId?: string;
  createdAt: string;
  completedAt?: string;
  totalEstimate?: number; // ₪ sum at time of saving
  receiptPhotoUri?: string;
}

export interface PurchaseRecord {
  itemName: string; // normalized lowercase
  dates: string[]; // ISO dates of each purchase
}

export interface Supermarket {
  id: string;
  name: string;
  promotionUrl?: string;
  departmentOrder: string[]; // department IDs in preferred order
}

export interface Discount {
  itemName: string; // normalized lowercase
  supermarketId: string;
  description: string;
  discountPercent?: number;
  validUntil?: string;
  isManual: boolean;
}

export interface AppState {
  // Current list
  currentList: Item[];
  addItem: (item: Omit<Item, 'id' | 'addedAt' | 'checked'>) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemDept: (id: string, departmentId: string) => void;
  clearCheckedItems: () => void;
  clearCurrentList: () => void;

  // History
  history: ShoppingList[];
  saveCurrentListToHistory: (supermarketId?: string, receiptPhotoUri?: string) => void;
  attachReceiptPhoto: (listId: string, uri: string) => void;
  purchaseRecords: PurchaseRecord[];

  // Supermarkets
  supermarkets: Supermarket[];
  selectedSupermarketId: string | null;
  setSelectedSupermarket: (id: string | null) => void;
  updateSupermarketDepartmentOrder: (supermarketId: string, order: string[]) => void;
  addSupermarket: (name: string, promotionUrl?: string) => void;
  removeSupermarket: (id: string) => void;
  updateSupermarket: (id: string, updates: { name?: string; promotionUrl?: string }) => void;

  // Discounts
  discounts: Discount[];
  setDiscounts: (discounts: Discount[]) => void;
  toggleManualDiscount: (itemName: string, supermarketId: string) => void;

  // Department overrides remembered per item name
  itemDepartmentOverrides: Record<string, string>;
  setItemDepartmentOverride: (itemName: string, departmentId: string) => void;

  // Custom departments created by user
  customDepartments: Department[];
  addCustomDepartment: (dept: Omit<Department, 'id'>) => void;
  removeCustomDepartment: (id: string) => void;

  // Retro / arbitrary history entry (for old receipts)
  saveArbitraryListToHistory: (
    items: Array<{ name: string; quantity: number; unit: string; estimatedPrice?: number; departmentId: string }>,
    supermarketId?: string,
    receiptPhotoUri?: string,
    date?: string,
  ) => void;

  // Anthropic API key (for receipt OCR)
  anthropicApiKey: string | null;
  setAnthropicApiKey: (key: string | null) => void;

  // Firebase real-time sharing
  shareRoomCode: string | null;
  shareRole: 'owner' | 'member' | null;
  setShareRoom: (code: string | null, role: 'owner' | 'member' | null) => void;
  setListFromSync: (items: Item[]) => void;

  // Multiple lists
  lists: ShoppingList[];
  activeListId: string;
  createList: (name: string) => string; // returns new list id
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  switchList: (id: string) => void;
}
