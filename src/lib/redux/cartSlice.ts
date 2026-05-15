import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  productId: number;
  quantity: number;
  isLoading?: boolean;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
}

const initialState: CartState = {
  items: [],
  isLoading: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setItemLoading: (state, action: PayloadAction<{ productId: number; isLoading: boolean }>) => {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (item) {
        item.isLoading = action.payload.isLoading;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { setItemLoading, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
