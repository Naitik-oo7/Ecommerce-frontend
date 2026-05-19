'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, Loader2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAsReadByIdMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
} from '@/services/api/notificationsApi';
import { useAppSelector } from '@/lib/redux/hooks';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const notificationIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const notificationColors = {
  info: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-mono-rose',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notificationsData, isLoading } = useGetNotificationsQuery({
    page,
    limit: 20,
    isRead: filter === 'unread' ? false : undefined,
  }, { skip: !isAuthenticated });

  const [markAsRead, { isLoading: isMarking }] = useMarkAsReadByIdMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAsReadMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
  const [clearAll, { isLoading: isClearing }] = useClearAllNotificationsMutation();

  const notifications = (notificationsData as any)?.data || [];
  const pagination = (notificationsData as any)?.pagination || {};

  if (!isAuthenticated) {
    return (
      <div className="container-mono py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 rounded-full bg-mono-cream flex items-center justify-center mx-auto mb-6">
            <Bell className="h-10 w-10 text-mono-terracotta" />
          </div>
          <h2 className="text-editorial text-2xl text-mono-charcoal mb-3">Sign in to view notifications</h2>
          <Link href="/login"><Button size="lg" className="bg-mono-charcoal">Login</Button></Link>
        </motion.div>
      </div>
    );
  }

  const handleMarkAsRead = async (id: number) => await markAsRead(id);
  const handleMarkAllAsRead = async () => await markAllAsRead({});
  const handleDelete = async (id: number) => await deleteNotification(id);
  const handleClearAll = async () => { if (confirm('Clear all notifications?')) await clearAll(); };

  return (
    <div className="container-mono py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bell className="h-5 w-5 text-mono-terracotta" />
                Notifications
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={isMarkingAll || notifications.every((n: any) => n.isRead)}>
                  {isMarkingAll ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                  Mark all read
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAll} disabled={isClearing || notifications.length === 0}>
                  {isClearing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  Clear all
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-2 mb-6">
              <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('all'); setPage(1); }}>All</Button>
              <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('unread'); setPage(1); }}>Unread</Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-mono-terracotta" /></div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                  {notifications.map((notification: any) => {
                    const Icon = notificationIcons[notification.type] || Info;
                    return (
                      <motion.div key={notification.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} layout>
                        <div className={`p-4 border rounded-xl transition-colors ${notification.isRead ? 'bg-background' : 'bg-mono-terracotta/5 border-mono-terracotta/20'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${notificationColors[notification.type]} text-white`}><Icon className="h-4 w-4" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium">{notification.title}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                  <p className="text-xs text-muted-foreground mt-2">{new Date(notification.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {!notification.isRead && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkAsRead(notification.id)} disabled={isMarking}><Check className="h-4 w-4" /></Button>}
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-mono-rose" onClick={() => handleDelete(notification.id)} disabled={isDeleting}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
