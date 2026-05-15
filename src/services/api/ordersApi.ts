import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: (params = {}) => ({ url: '/api/v1/orders', method: 'GET', params }),
      providesTags: ['Orders'],
    }),
    getOrderById: builder.query({
      query: (id) => ({ url: `/api/v1/orders/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Orders', id }],
    }),
    createOrder: builder.mutation({
      query: (data) => ({ url: '/api/v1/orders', method: 'POST', data }),
      invalidatesTags: ['Orders'],
    }),
    cancelOrder: builder.mutation({
      query: (id) => ({ url: `/api/v1/orders/${id}/cancel`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [{ type: 'Orders', id }],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/api/v1/orders/${id}/status`, method: 'PATCH', data: { status } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Orders', id }],
    }),
  }),
});

export const { useGetOrdersQuery, useGetOrderByIdQuery, useCreateOrderMutation, useCancelOrderMutation, useUpdateOrderStatusMutation } = ordersApi;
