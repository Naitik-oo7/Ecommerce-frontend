import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Settings'],
  endpoints: (builder) => ({
    getSetting: builder.query<any, string>({
      query: (key) => ({ url: `/api/v1/settings/${key}`, method: 'GET' }),
      providesTags: (result, error, key) => [{ type: 'Settings', id: key }],
    }),
    getAllSettings: builder.query<Record<string, any>, void>({
      query: () => ({ url: '/api/v1/settings', method: 'GET' }),
      providesTags: ['Settings'],
    }),
    updateSetting: builder.mutation<any, { key: string; value: any }>({
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
