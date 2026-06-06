import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GuestCartItem {
  variantId: number;
  size: string;
  quantity: number;
  productName: string;
  productSlug: string;
  price: number;
  comparePrice?: number | null;
  imageUrl?: string | null;
  category?: string;
}

interface GuestCartState {
  items: GuestCartItem[];
}

const STORAGE_KEY = 'mono_guest_cart';

function load(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

function persist(items: GuestCartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

const guestCartSlice = createSlice({
  name: 'guestCart',
  initialState: { items: load() } as GuestCartState,
  reducers: {
    addGuestItem(state, action: PayloadAction<GuestCartItem>) {
      const { variantId, size, quantity } = action.payload;
      const existing = state.items.find(
        (i) => i.variantId === variantId && i.size === size
      );
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push(action.payload);
      }
      persist(state.items);
    },
    updateGuestItem(
      state,
      action: PayloadAction<{ variantId: number; size: string; quantity: number }>
    ) {
      const { variantId, size, quantity } = action.payload;
      const item = state.items.find(
        (i) => i.variantId === variantId && i.size === size
      );
      if (item && quantity >= 1) {
        item.quantity = quantity;
        persist(state.items);
      }
    },
    removeGuestItem(
      state,
      action: PayloadAction<{ variantId: number; size: string }>
    ) {
      const { variantId, size } = action.payload;
      state.items = state.items.filter(
        (i) => !(i.variantId === variantId && i.size === size)
      );
      persist(state.items);
    },
    clearGuestCart(state) {
      state.items = [];
      persist([]);
    },
  },
});

export const { addGuestItem, updateGuestItem, removeGuestItem, clearGuestCart } =
  guestCartSlice.actions;
export default guestCartSlice.reducer;
