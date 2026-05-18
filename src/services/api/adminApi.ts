import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Admin'],
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => ({ url: '/api/v1/admin/analytics/dashboard', method: 'GET' }),
      providesTags: ['Admin'],
    }),
    getSalesAnalytics: builder.query({
      query: (params?: { startDate?: string; endDate?: string }) => ({
        url: '/api/v1/admin/analytics/sales',
        method: 'GET',
        params,
      }),
      providesTags: ['Admin'],
    }),
    getProductAnalytics: builder.query({
      query: () => ({ url: '/api/v1/admin/analytics/products', method: 'GET' }),
      providesTags: ['Admin'],
    }),
    getUserAnalytics: builder.query({
      query: () => ({ url: '/api/v1/admin/analytics/users', method: 'GET' }),
      providesTags: ['Admin'],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetSalesAnalyticsQuery,
  useGetProductAnalyticsQuery,
  useGetUserAnalyticsQuery,
} = adminApi;
