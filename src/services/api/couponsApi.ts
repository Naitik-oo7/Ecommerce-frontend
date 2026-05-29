import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const couponsApi = createApi({
  reducerPath: 'couponsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Coupons'],
  endpoints: (builder) => ({
    getCoupons: builder.query({
      query: (params = {}) => ({ url: '/api/v1/coupons', method: 'GET', params }),
      providesTags: ['Coupons'],
    }),
    getCouponById: builder.query({
      query: (id: number) => ({ url: `/api/v1/coupons/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Coupons', id }],
    }),
    createCoupon: builder.mutation({
      query: (data) => ({ url: '/api/v1/coupons', method: 'POST', data }),
      invalidatesTags: ['Coupons'],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...data }: { id: number; [key: string]: unknown }) => ({
        url: `/api/v1/coupons/${id}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['Coupons'],
    }),
    deleteCoupon: builder.mutation({
      query: (id: number) => ({ url: `/api/v1/coupons/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Coupons'],
    }),
    validateCoupon: builder.mutation({
      query: (data: { code: string; cartTotal: number }) => ({
        url: '/api/v1/coupons/validate',
        method: 'POST',
        data,
      }),
    }),
  }),
});

export const {
  useGetCouponsQuery,
  useGetCouponByIdQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useValidateCouponMutation,
} = couponsApi;
