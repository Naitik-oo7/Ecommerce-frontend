import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';
import type { Product, ProductMedia } from '@/types/product';

interface RawProduct extends Omit<Product, 'price' | 'comparePrice' | 'avgRating' | 'images' | 'media'> {
  price: string | number;
  comparePrice?: string | number;
  avgRating?: string | number;
  media?: ProductMedia[];
}

interface PaginatedProductsResponse {
  data: Product[];
  [key: string]: unknown;
}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  lowStock: number;
  outOfStock: number;
}

// Sort primary image first and parse numeric fields that the API may return as strings
const mapImages = (p: RawProduct): Product => {
  const media: ProductMedia[] = p.media ?? [];
  const sorted = [...media].sort((a, b) => {
    const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0);
  });
  return {
    ...p,
    media,
    price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
    comparePrice:
      p.comparePrice != null
        ? typeof p.comparePrice === 'string'
          ? parseFloat(p.comparePrice)
          : p.comparePrice
        : undefined,
    avgRating:
      p.avgRating != null
        ? typeof p.avgRating === 'string'
          ? parseFloat(p.avgRating)
          : p.avgRating
        : undefined,
    images: sorted.filter((m) => m.type === 'image' || !m.type).map((m) => m.url),
  };
};

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Products'],
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedProductsResponse | Product[], Record<string, unknown>>({
      query: (params = {}) => ({ url: '/api/v1/products', method: 'GET', params }),
      transformResponse: (response: unknown) => {
        const r = response as { data?: RawProduct[] } | RawProduct[];
        if (Array.isArray((r as { data?: RawProduct[] }).data)) {
          const typed = r as { data: RawProduct[]; [key: string]: unknown };
          return { ...typed, data: typed.data.map(mapImages) };
        }
        if (Array.isArray(r)) {
          return (r as RawProduct[]).map(mapImages);
        }
        return r as Product[];
      },
      providesTags: ['Products'],
    }),
    getProductBySlug: builder.query<Product, string>({
      query: (slug) => ({ url: `/api/v1/products/${slug}`, method: 'GET' }),
      transformResponse: (response: unknown) => {
        const r = response as { data?: RawProduct; id?: number } | RawProduct;
        if ((r as { data?: RawProduct }).data) {
          return mapImages((r as { data: RawProduct }).data);
        }
        if ((r as RawProduct).id) return mapImages(r as RawProduct);
        return r as Product;
      },
      providesTags: (result, _error, slug) => [{ type: 'Products', id: slug }],
    }),
    createProduct: builder.mutation({
      query: (data) => ({ url: '/api/v1/products', method: 'POST', data }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation<unknown, { id: string | number; data: unknown }>({
      query: ({ id, data }) => ({ url: `/api/v1/products/${id}`, method: 'PATCH', data }),
      invalidatesTags: (_result, _error, { id }) => ['Products', { type: 'Products', id }],
    }),
    deleteProduct: builder.mutation<unknown, string | number>({
      query: (id) => ({ url: `/api/v1/products/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => ['Products', { type: 'Products', id }],
    }),
    updateStock: builder.mutation({
      query: ({ id, variantId, stock }: { id: number; variantId: number; stock: number }) => ({
        url: `/api/v1/products/${id}/stock`,
        method: 'PATCH',
        data: { variantId, stock },
      }),
      invalidatesTags: (_result, _error, { id }) => ['Products', { type: 'Products', id }],
    }),
    getFilterMetadata: builder.query({
      query: (params = {}) => ({ url: '/api/v1/products/filters/meta', method: 'GET', params }),
      providesTags: ['Products'],
    }),
    getProductStats: builder.query<ProductStats, void>({
      query: () => ({ url: '/api/v1/products/stats', method: 'GET' }),
      transformResponse: (response: unknown) => {
        const r = response as { data?: ProductStats } | ProductStats;
        return ((r as { data?: ProductStats }).data ?? r) as ProductStats;
      },
      providesTags: ['Products'],
    }),
    getRelatedProducts: builder.query<Product[], { slug: string; limit?: number }>({
      query: ({ slug, limit = 8 }) => ({
        url: `/api/v1/products/${slug}/related`,
        method: 'GET',
        params: { limit },
      }),
      transformResponse: (response: unknown) => {
        const r = response as { data?: RawProduct[] } | RawProduct[];
        if (Array.isArray((r as { data?: RawProduct[] }).data)) {
          return (r as { data: RawProduct[] }).data.map(mapImages);
        }
        if (Array.isArray(r)) return (r as RawProduct[]).map(mapImages);
        return r as Product[];
      },
      providesTags: (_result, _error, { slug }) => [{ type: 'Products', id: `related-${slug}` }],
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
  useGetRelatedProductsQuery,
  useGetProductStatsQuery,
} = productsApi;
