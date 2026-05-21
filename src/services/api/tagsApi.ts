import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const tagsApi = createApi({
  reducerPath: 'tagsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Tags'],
  endpoints: (builder) => ({
    getTags: builder.query({
      query: (params = {}) => ({ url: '/api/v1/tags', method: 'GET', params }),
      providesTags: ['Tags'],
    }),
    createTag: builder.mutation({
      query: (data: { name: string; type: 'collection' | 'sustainability' | 'feature'; color?: string }) => ({
        url: '/api/v1/tags',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Tags'],
    }),
  }),
});

export const {
  useGetTagsQuery,
  useCreateTagMutation,
} = tagsApi;
