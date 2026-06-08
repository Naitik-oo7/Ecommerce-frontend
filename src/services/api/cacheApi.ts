import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export interface CacheStats {
  enabled: boolean;
  namespaces: Record<string, number>;
  total: number;
}

interface ClearCacheResponse {
  cleared: string[];
}

export const cacheApi = createApi({
  reducerPath: 'cacheApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Cache'],
  endpoints: (builder) => ({
    getCacheStats: builder.query<CacheStats, void>({
      query: () => ({ url: '/api/v1/admin/cache', method: 'GET' }),
      providesTags: ['Cache'],
    }),
    clearAllCache: builder.mutation<ClearCacheResponse, void>({
      query: () => ({ url: '/api/v1/admin/cache', method: 'DELETE' }),
      invalidatesTags: ['Cache'],
    }),
    clearCacheNamespace: builder.mutation<ClearCacheResponse, string>({
      query: (namespace) => ({ url: `/api/v1/admin/cache/${namespace}`, method: 'DELETE' }),
      invalidatesTags: ['Cache'],
    }),
  }),
});

export const {
  useGetCacheStatsQuery,
  useClearAllCacheMutation,
  useClearCacheNamespaceMutation,
} = cacheApi;
