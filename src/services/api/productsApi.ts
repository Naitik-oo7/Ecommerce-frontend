import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

// Sort primary image first, then map to URL array
const mapImages = (p: any) => {
  const media: any[] = p.media || [];
  const sorted = [...media].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  return {
    ...p,
    images: sorted.filter((m) => m.type === 'image' || !m.type).map((m) => m.url),
  };
};

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Products'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params = {}) => ({ url: '/api/v1/products', method: 'GET', params }),
      transformResponse: (response: any) => {
        if (Array.isArray(response?.data)) {
          return { ...response, data: response.data.map(mapImages) };
        }
        if (Array.isArray(response)) {
          return response.map(mapImages);
        }
        return response;
      },
      providesTags: ['Products'],
    }),
    getProductBySlug: builder.query({
      query: (slug) => ({ url: `/api/v1/products/${slug}`, method: 'GET' }),
      transformResponse: (response: any) => {
        if (response?.data) return { ...response, data: mapImages(response.data) };
        if (response?.id) return mapImages(response);
        return response;
      },
      providesTags: (result, error, slug) => [{ type: 'Products', id: slug }],
    }),
    createProduct: builder.mutation({
      query: (data) => ({ url: '/api/v1/products', method: 'POST', data }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, data }) => ({ url: `/api/v1/products/${id}`, method: 'PATCH', data }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/api/v1/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Products'],
    }),
    // Updated: variantId is now required for stock updates
    updateStock: builder.mutation({
      query: ({ id, variantId, stock }: { id: number; variantId: number; stock: number }) => ({
        url: `/api/v1/products/${id}/stock`,
        method: 'PATCH',
        data: { variantId, stock },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Products', id }],
    }),
    // New: Get filter metadata for faceted search
    getFilterMetadata: builder.query({
      query: (params = {}) => ({ url: '/api/v1/products/filters/meta', method: 'GET', params }),
      providesTags: ['Products'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductBySlugQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUpdateStockMutation,
  useGetFilterMetadataQuery,
} = productsApi;
