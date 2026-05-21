import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export type ContactStatus = 'new' | 'read' | 'replied' | 'archived';

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface UpdateContactPayload {
  status?: ContactStatus;
  adminNotes?: string;
}

export const contactApi = createApi({
  reducerPath: 'contactApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Contact'],
  endpoints: (builder) => ({
    submitContact: builder.mutation<{ id: number }, SubmitContactPayload>({
      query: (data) => ({ url: '/api/v1/contact', method: 'POST', data }),
    }),
    getContacts: builder.query<{ data: ContactMessage[]; pagination: { total: number; page: number; limit: number; totalPages: number } }, { status?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: '/api/v1/contact', method: 'GET', params }),
      providesTags: ['Contact'],
    }),
    getContact: builder.query<ContactMessage, number>({
      query: (id) => ({ url: `/api/v1/contact/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Contact', id }],
    }),
    updateContact: builder.mutation<ContactMessage, { id: number } & UpdateContactPayload>({
      query: ({ id, ...data }) => ({ url: `/api/v1/contact/${id}`, method: 'PATCH', data }),
      invalidatesTags: (_result, _error, { id }) => ['Contact', { type: 'Contact', id }],
    }),
    deleteContact: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/contact/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Contact'],
    }),
  }),
});

export const {
  useSubmitContactMutation,
  useGetContactsQuery,
  useGetContactQuery,
  useUpdateContactMutation,
  useDeleteContactMutation,
} = contactApi;
