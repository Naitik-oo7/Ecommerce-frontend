import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const wishlistApi = createApi({
  reducerPath: 'wishlistApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Wishlist'],
  endpoints: (builder) => ({
    getWishlist: builder.query({
      query: (params = {}) => ({ url: '/api/v1/wishlist', method: 'GET', params }),
      providesTags: ['Wishlist'],
    }),
    addToWishlist: builder.mutation({
      query: (productId: number) => ({
        url: '/api/v1/wishlist',
        method: 'POST',
        data: { productId },
      }),
      invalidatesTags: ['Wishlist'],
    }),
    removeFromWishlist: builder.mutation({
      query: (productId: number) => ({
        url: `/api/v1/wishlist/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
    }),
    clearWishlist: builder.mutation({
      query: () => ({ url: '/api/v1/wishlist/clear', method: 'DELETE' }),
      invalidatesTags: ['Wishlist'],
    }),
    checkWishlist: builder.query({
      query: (productId: number) => ({
        url: `/api/v1/wishlist/check/${productId}`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useClearWishlistMutation,
  useCheckWishlistQuery,
} = wishlistApi;
