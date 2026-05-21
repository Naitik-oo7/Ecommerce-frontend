import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const newsletterApi = createApi({
  reducerPath: 'newsletterApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Newsletter'],
  endpoints: (builder) => ({
    subscribe: builder.mutation<{ email: string }, { email: string }>({
      query: (data) => ({ url: '/api/v1/newsletter/subscribe', method: 'POST', data }),
      invalidatesTags: ['Newsletter'],
    }),
    getSubscribers: builder.query<{ id: number; email: string; subscribedAt: string }[], void>({
      query: () => ({ url: '/api/v1/newsletter/subscribers', method: 'GET' }),
      providesTags: ['Newsletter'],
    }),
  }),
});

export const {
  useSubscribeMutation,
  useGetSubscribersQuery,
} = newsletterApi;
