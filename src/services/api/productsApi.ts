import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Products'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params = {}) => ({ url: '/api/v1/products', method: 'GET', params }),
      providesTags: ['Products'],
    }),
    getProductBySlug: builder.query({
      query: (slug) => ({ url: `/api/v1/products/${slug}`, method: 'GET' }),
      providesTags: (result, error, slug) => [{ type: 'Products', id: slug }],
    }),
    createProduct: builder.mutation({
      query: (data) => ({ url: '/api/v1/products', method: 'POST', data }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, data }) => ({ url: `/api/v1/products/${id}`, method: 'PATCH', data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Products', id }],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/api/v1/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Products'],
    }),
    updateStock: builder.mutation({
      query: ({ id, stock }) => ({ url: `/api/v1/products/${id}/stock`, method: 'PATCH', data: { stock } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Products', id }],
    }),
  }),
});

export const { useGetProductsQuery, useGetProductBySlugQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation, useUpdateStockMutation } = productsApi;
