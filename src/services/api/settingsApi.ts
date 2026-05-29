import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Settings'],
  endpoints: (builder) => ({
    getSetting: builder.query<unknown, string>({
      query: (key) => ({ url: `/api/v1/settings/${key}`, method: 'GET' }),
      providesTags: (result, error, key) => [{ type: 'Settings', id: key }],
    }),
    getAllSettings: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/api/v1/settings', method: 'GET' }),
      providesTags: ['Settings'],
    }),
    updateSetting: builder.mutation<unknown, { key: string; value: unknown }>({
      query: ({ key, value }) => ({ url: `/api/v1/settings/${key}`, method: 'PUT', data: { value } }),
      invalidatesTags: (result, error, { key }) => [{ type: 'Settings', id: key }, 'Settings'],
    }),
  }),
});

export const {
  useGetSettingQuery,
  useGetAllSettingsQuery,
  useUpdateSettingMutation,
} = settingsApi;
