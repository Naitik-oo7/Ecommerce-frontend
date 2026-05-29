import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: (params: Record<string, unknown> = {}) => {
        const { isAdmin, ...rest } = params;
        const url = isAdmin ? '/api/v1/orders/admin' : '/api/v1/orders';
        return { url, method: 'GET', params: rest };
      },
      providesTags: ['Orders'],
    }),
    getOrderById: builder.query({
      query: (id) => ({ url: `/api/v1/orders/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Orders', id }],
    }),
    getOrderByIdAdmin: builder.query({
      query: (id: number) => ({ url: `/api/v1/orders/admin/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Orders', id }],
    }),
    createOrder: builder.mutation({
      query: (data) => ({ url: '/api/v1/orders', method: 'POST', data }),
      invalidatesTags: ['Orders'],
    }),
    cancelOrder: builder.mutation({
      query: (id) => ({ url: `/api/v1/orders/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Orders', id }, 'Orders'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status, isAdmin }: { id: number; status: string; isAdmin?: boolean }) => ({
        url: isAdmin ? `/api/v1/orders/admin/${id}/status` : `/api/v1/orders/${id}/status`,
        method: 'PATCH',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Orders', id }, 'Orders'],
    }),
    updatePaymentStatus: builder.mutation({
      query: ({ id, paymentStatus, isAdmin }: { id: number; paymentStatus: string; isAdmin?: boolean }) => ({
        url: isAdmin ? `/api/v1/orders/admin/${id}/payment-status` : `/api/v1/orders/${id}/payment-status`,
        method: 'PATCH',
        data: { paymentStatus },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Orders', id }, 'Orders'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrderByIdAdminQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdatePaymentStatusMutation,
} = ordersApi;
