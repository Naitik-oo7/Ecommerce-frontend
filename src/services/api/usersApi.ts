import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => ({ url: '/api/v1/users/me', method: 'GET' }),
      providesTags: ['Users'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({ url: '/api/v1/users/me', method: 'PATCH', data }),
      invalidatesTags: ['Users'],
    }),
    changePassword: builder.mutation({
      query: (data) => ({ url: '/api/v1/auth/change-password', method: 'PATCH', data }),
    }),
    getUserById: builder.query({
      query: (id: number) => ({ url: `/api/v1/users/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),
    getAllUsers: builder.query({
      query: (params = {}) => ({ url: '/api/v1/users', method: 'GET', params }),
      providesTags: ['Users'],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({ url: `/api/v1/users/${id}/role`, method: 'PATCH', data: { role } }),
      invalidatesTags: ['Users'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/api/v1/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation, useGetUserByIdQuery, useGetAllUsersQuery, useUpdateUserRoleMutation, useDeleteUserMutation } = usersApi;
