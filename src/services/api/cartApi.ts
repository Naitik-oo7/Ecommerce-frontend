import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const cartApi = createApi({
  reducerPath: 'cartApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Cart'],
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => ({ url: '/api/v1/cart', method: 'GET' }),
      providesTags: ['Cart'],
    }),
    // Updated: Now requires variantId and size instead of productId
    addToCart: builder.mutation({
      query: (data: { variantId: number; size: string; quantity?: number }) => ({
        url: '/api/v1/cart/items',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Cart'],
    }),
    // Updated: Now uses cart item ID instead of productId
    updateCartItem: builder.mutation({
      query: ({ itemId, quantity }: { itemId: number; quantity: number }) => ({
        url: `/api/v1/cart/items/${itemId}`,
        method: 'PATCH',
        data: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),
    // Updated: Now uses cart item ID instead of productId
    removeFromCart: builder.mutation({
      query: (itemId: number) => ({
        url: `/api/v1/cart/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation({
      query: () => ({ url: '/api/v1/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    applyCoupon: builder.mutation({
      query: (code: string) => ({
        url: '/api/v1/cart/apply-coupon',
        method: 'POST',
        data: { code },
      }),
      invalidatesTags: ['Cart'],
    }),
    removeCoupon: builder.mutation({
      query: () => ({ url: '/api/v1/cart/remove-coupon', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,
} = cartApi;
