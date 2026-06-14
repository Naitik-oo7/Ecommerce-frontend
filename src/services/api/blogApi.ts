import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content?: string;
  image: string;
  publishedAt: string;
  readTime: string;
  isFeatured: boolean;
  isPublished: boolean;
}

export const blogApi = createApi({
  reducerPath: 'blogApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['BlogPosts'],
  endpoints: (builder) => ({
    getBlogPosts: builder.query<{ data: BlogPost[]; pagination?: { total: number; page: number; limit: number; totalPages: number } }, { limit?: number; isFeatured?: string; category?: string; search?: string; page?: number; includeUnpublished?: string }>({
      query: (params = {}) => ({ url: '/api/v1/blog', method: 'GET', params }),
      providesTags: ['BlogPosts'],
    }),
    getBlogPostBySlug: builder.query<BlogPost, string>({
      query: (slug) => ({ url: `/api/v1/blog/${slug}`, method: 'GET' }),
      providesTags: (result, error, slug) => [{ type: 'BlogPosts', id: slug }],
    }),
    uploadBlogImage: builder.mutation<{ url: string }, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/api/v1/upload',
          method: 'POST',
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    createBlogPost: builder.mutation<BlogPost, Partial<BlogPost>>({
      query: (data) => ({ url: '/api/v1/blog', method: 'POST', data }),
      invalidatesTags: ['BlogPosts'],
    }),
    updateBlogPost: builder.mutation<BlogPost, { id: number } & Partial<BlogPost>>({
      query: ({ id, ...data }) => ({ url: `/api/v1/blog/${id}`, method: 'PATCH', data }),
      invalidatesTags: ['BlogPosts'],
    }),
    deleteBlogPost: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/blog/${id}`, method: 'DELETE' }),
      invalidatesTags: ['BlogPosts'],
    }),
  }),
});

export const {
  useGetBlogPostsQuery,
  useGetBlogPostBySlugQuery,
  useUploadBlogImageMutation,
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  useDeleteBlogPostMutation,
} = blogApi;
