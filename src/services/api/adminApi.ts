import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

/** Shared shape for the dashboard date-range query params. */
export interface AnalyticsRangeParams {
  range?: string;      // preset: '7d' | '30d' | '90d' | '12m'
  startDate?: string;  // ISO date (custom range)
  endDate?: string;    // ISO date (custom range)
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Admin'],
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: (params?: AnalyticsRangeParams) => ({ url: '/api/v1/admin/analytics/dashboard', method: 'GET', params }),
      providesTags: ['Admin'],
    }),
    getOverviewAnalytics: builder.query({
      query: (params?: AnalyticsRangeParams) => ({ url: '/api/v1/admin/analytics/overview', method: 'GET', params }),
      providesTags: ['Admin'],
    }),
    getSalesAnalytics: builder.query({
      query: (params?: AnalyticsRangeParams) => ({ url: '/api/v1/admin/analytics/sales', method: 'GET', params }),
      providesTags: ['Admin'],
    }),
    getProductAnalytics: builder.query({
      query: (params?: AnalyticsRangeParams) => ({ url: '/api/v1/admin/analytics/products', method: 'GET', params }),
      providesTags: ['Admin'],
    }),
    getUserAnalytics: builder.query({
      query: (params?: AnalyticsRangeParams) => ({ url: '/api/v1/admin/analytics/users', method: 'GET', params }),
      providesTags: ['Admin'],
    }),
    getOrderAnalytics: builder.query({
      query: (params?: AnalyticsRangeParams) => ({ url: '/api/v1/admin/analytics/orders', method: 'GET', params }),
      providesTags: ['Admin'],
    }),
    getCouponAnalytics: builder.query({
      query: (params?: AnalyticsRangeParams) => ({ url: '/api/v1/admin/analytics/coupons', method: 'GET', params }),
      providesTags: ['Admin'],
    }),
    getReviewAnalytics: builder.query({
      query: (params?: AnalyticsRangeParams) => ({ url: '/api/v1/admin/analytics/reviews', method: 'GET', params }),
      providesTags: ['Admin'],
    }),
    getInventoryAnalytics: builder.query({
      // Inventory is point-in-time (current stock) — not affected by the date range.
      query: () => ({ url: '/api/v1/admin/analytics/inventory', method: 'GET' }),
      providesTags: ['Admin'],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetOverviewAnalyticsQuery,
  useGetSalesAnalyticsQuery,
  useGetProductAnalyticsQuery,
  useGetUserAnalyticsQuery,
  useGetOrderAnalyticsQuery,
  useGetCouponAnalyticsQuery,
  useGetReviewAnalyticsQuery,
  useGetInventoryAnalyticsQuery,
} = adminApi;
