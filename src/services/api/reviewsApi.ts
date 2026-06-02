import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Reviews'],
  endpoints: (builder) => ({
    getProductReviews: builder.query({
      query: ({ productId, ...params }: { productId: number; page?: number; limit?: number }) => ({
        url: `/api/v1/reviews/product/${productId}`,
        method: 'GET',
        params,
      }),
      providesTags: (result, error, { productId }) => [{ type: 'Reviews', id: productId }],
    }),
    getAllReviews: builder.query({
      query: (params = {}) => ({ url: '/api/v1/reviews', method: 'GET', params }),
      providesTags: ['Reviews'],
    }),
    getUserReviews: builder.query({
      query: (params = {}) => ({
        url: '/api/v1/reviews',
        method: 'GET',
        params: { ...params, myReviews: true },
      }),
      providesTags: ['Reviews'],
    }),
    createReview: builder.mutation({
      query: (data: { productId: number; orderId: number; rating: number; comment?: string; images?: string[] }) => ({
        url: '/api/v1/reviews',
        method: 'POST',
        data,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Reviews', id: productId },
        'Reviews',
      ],
    }),
    updateReview: builder.mutation({
      query: ({ id, ...data }: { id: number; rating?: number; comment?: string; images?: string[] }) => ({
        url: `/api/v1/reviews/${id}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['Reviews'],
    }),
    deleteReview: builder.mutation({
      query: (id: number) => ({ url: `/api/v1/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Reviews'],
    }),
    verifyReview: builder.mutation({
      query: (id: number) => ({ url: `/api/v1/reviews/${id}/verify`, method: 'PATCH' }),
      invalidatesTags: ['Reviews'],
    }),
  }),
});

export const {
  useGetProductReviewsQuery,
  useGetAllReviewsQuery,
  useGetUserReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useVerifyReviewMutation,
} = reviewsApi;
