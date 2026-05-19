import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Categories'],
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: (params = {}) => ({ url: '/api/v1/categories', method: 'GET', params }),
      providesTags: ['Categories'],
    }),
    getCategoryBySlug: builder.query({
      query: (slug: string) => ({ url: `/api/v1/categories/${slug}`, method: 'GET' }),
      providesTags: (result, error, slug) => [{ type: 'Categories', id: slug }],
    }),
    createCategory: builder.mutation({
      query: (data) => ({ url: '/api/v1/categories', method: 'POST', data }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...data }: { id: number; [key: string]: any }) => ({
        url: `/api/v1/categories/${id}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: builder.mutation({
      query: (id: number) => ({ url: `/api/v1/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryBySlugQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
