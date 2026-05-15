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
    addToCart: builder.mutation({
      query: (data) => ({ url: '/api/v1/cart', method: 'POST', data }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation({
      query: ({ cartItemId, quantity }) => ({ 
        url: `/api/v1/cart/${cartItemId}`, 
        method: 'PATCH', 
        data: { quantity } 
      }),
      invalidatesTags: ['Cart'],
    }),
    removeFromCart: builder.mutation({
      query: (cartItemId) => ({ url: `/api/v1/cart/${cartItemId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation({
      query: () => ({ url: '/api/v1/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const { useGetCartQuery, useAddToCartMutation, useUpdateCartItemMutation, useRemoveFromCartMutation, useClearCartMutation } = cartApi;
