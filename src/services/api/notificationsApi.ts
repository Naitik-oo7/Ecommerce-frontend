import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: 'info' | 'success' | 'warning' | 'error';
  isRead?: boolean;
}

export interface MarkAsReadRequest {
  notificationIds?: number[];
}

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query<{ data: Notification[]; metadata: unknown }, GetNotificationsParams>({
      query: (params = {}) => ({
        url: '/api/v1/notifications',
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Notifications' as const, id })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),
    getUnreadCount: builder.query<{ unreadCount: number }, void>({
      query: () => ({
        url: '/api/v1/notifications/unread-count',
        method: 'GET',
      }),
      providesTags: [{ type: 'Notifications', id: 'UNREAD_COUNT' }],
    }),
    markAsRead: builder.mutation<void, MarkAsReadRequest>({
      query: (data) => ({
        url: '/api/v1/notifications/mark-read',
        method: 'PATCH',
        data,
      }),
      invalidatesTags: (result, error, { notificationIds }) => [
        ...(notificationIds?.length
          ? notificationIds.map((id) => ({ type: 'Notifications' as const, id }))
          : [{ type: 'Notifications' as const, id: 'LIST' }]),
        { type: 'Notifications' as const, id: 'UNREAD_COUNT' },
      ],
    }),
    markAsReadById: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/notifications/${id}`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notifications' as const, id },
        { type: 'Notifications' as const, id: 'LIST' },
        { type: 'Notifications' as const, id: 'UNREAD_COUNT' },
      ],
    }),
    deleteNotification: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }, { type: 'Notifications', id: 'UNREAD_COUNT' }],
    }),
    clearAllNotifications: builder.mutation<void, void>({
      query: () => ({
        url: '/api/v1/notifications/clear',
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }, { type: 'Notifications', id: 'UNREAD_COUNT' }],
    }),
    // Admin only endpoints
    createNotification: builder.mutation<Notification, { userId?: number; title: string; message: string; type?: string; data?: Record<string, unknown> }>({
      query: (data) => ({
        url: '/api/v1/notifications',
        method: 'POST',
        data,
      }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAsReadByIdMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useCreateNotificationMutation,
} = notificationsApi;
