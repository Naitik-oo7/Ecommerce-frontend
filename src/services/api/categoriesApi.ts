import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export interface CategoryFeaturedProduct {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  comparePrice?: number | string | null;
  avgRating?: number | string;
  imageUrl?: string | null;
}

export interface CategoryTreeItem {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  isFeatured: boolean;
  children: {
    id: number;
    name: string;
    slug: string;
    imageUrl?: string;
  }[];
  featuredProducts?: CategoryFeaturedProduct[];
}

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Categories'],
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: (params = {}) => ({ url: '/api/v1/categories', method: 'GET', params }),
      providesTags: ['Categories'],
    }),
    getCategoryTree: builder.query<
      CategoryTreeItem[],
      { limit?: number; withProducts?: boolean; productsPerCategory?: number } | void
    >({
      query: (params = {}) => ({ url: '/api/v1/categories/tree', method: 'GET', params: params || {} }),
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
      query: ({ id, ...data }: { id: number; [key: string]: unknown }) => ({
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
  useGetCategoryTreeQuery,
  useGetCategoryBySlugQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
