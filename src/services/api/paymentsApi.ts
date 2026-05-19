import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export interface CreatePaymentRequest {
  orderId: number;
}

export interface CreatePaymentResponse {
  payment: {
    id: number;
    orderId: number;
    amount: number;
    currency: string;
    status: string;
  };
  razorpayOrder: {
    id: string;
    amount: number;
    currency: string;
  };
  key: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Payments'],
  endpoints: (builder) => ({
    createPayment: builder.mutation<CreatePaymentResponse, CreatePaymentRequest>({
      query: (data) => ({
        url: '/api/v1/payments',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Payments'],
    }),
    verifyPayment: builder.mutation<void, VerifyPaymentRequest>({
      query: (data) => ({
        url: '/api/v1/payments/verify',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Payments'],
    }),
    getPaymentByOrderId: builder.query<Payment, number>({
      query: (orderId) => ({
        url: `/api/v1/payments/order/${orderId}`,
        method: 'GET',
      }),
      providesTags: (result, error, orderId) => [{ type: 'Payments', id: orderId }],
    }),
    getAllPayments: builder.query({
      query: (params = {}) => ({
        url: '/api/v1/payments',
        method: 'GET',
        params,
      }),
      providesTags: ['Payments'],
    }),
    refundPayment: builder.mutation<void, { orderId: number; amount?: number }>({
      query: ({ orderId, amount }) => ({
        url: `/api/v1/payments/${orderId}/refund`,
        method: 'POST',
        data: amount ? { amount } : {},
      }),
      invalidatesTags: ['Payments'],
    }),
  }),
});

export const {
  useCreatePaymentMutation,
  useVerifyPaymentMutation,
  useGetPaymentByOrderIdQuery,
  useGetAllPaymentsQuery,
  useRefundPaymentMutation,
} = paymentsApi;
