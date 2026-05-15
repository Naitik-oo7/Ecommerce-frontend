import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Admin'],
  endpoints: (builder) => ({
    getAnalytics: builder.query({
      query: () => ({ url: '/api/v1/admin/analytics', method: 'GET' }),
      providesTags: ['Admin'],
    }),
  }),
});

export const { useGetAnalyticsQuery } = adminApi;
