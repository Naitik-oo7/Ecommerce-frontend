import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const addressesApi = createApi({
  reducerPath: 'addressesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Addresses'],
  endpoints: (builder) => ({
    getAddresses: builder.query({
      query: () => ({ url: '/api/v1/addresses', method: 'GET' }),
      providesTags: ['Addresses'],
    }),
    createAddress: builder.mutation({
      query: (data) => ({ url: '/api/v1/addresses', method: 'POST', data }),
      invalidatesTags: ['Addresses'],
    }),
    updateAddress: builder.mutation({
      query: ({ id, ...data }: { id: number; [key: string]: any }) => ({
        url: `/api/v1/addresses/${id}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['Addresses'],
    }),
    deleteAddress: builder.mutation({
      query: (id: number) => ({ url: `/api/v1/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Addresses'],
    }),
    setDefaultAddress: builder.mutation({
      query: (id: number) => ({ url: `/api/v1/addresses/${id}/default`, method: 'PATCH' }),
      invalidatesTags: ['Addresses'],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} = addressesApi;
