'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useGetUserByIdQuery, useDeleteUserMutation } from '@/services/api/usersApi';
import { useGetOrdersQuery } from '@/services/api/ordersApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_CONFIG } from '@/constants/order-status';
import {
  ArrowLeft, Mail, Calendar, ShoppingBag, Wallet, MapPin,
  BadgeCheck, Clock, Loader2, AlertCircle, Trash2, Package,
  ChevronRight, Hash, IndianRupee,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } };

interface Address {
  id: number;
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

interface UserStats {
  orderCount: number;
  totalSpent: number | string;
  lastOrderAt: string | null;
}

interface UserDetail {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
  avatar?: string;
  createdAt?: string;
  addresses?: Address[];
  stats?: UserStats;
}

interface OrderRow {
  id: number;
  status: string;
  paymentStatus?: string;
  total?: string | number;
  createdAt?: string;
  items?: { id: number }[];
}

function fmt(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function inr(value?: string | number) {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

function StatCard({ icon: Icon, label, value, tint }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tint: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-lg font-bold text-foreground leading-tight truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const userId = parseInt(id as string, 10);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { data: userResponse, isLoading, error } = useGetUserByIdQuery(userId);
  const { data: ordersResponse, isLoading: ordersLoading } = useGetOrdersQuery({ isAdmin: true, userId, limit: 50 });
  const [deleteUser] = useDeleteUserMutation();

  // Single-object responses come back unwrapped from axiosBaseQuery (no `.data`),
  // while list responses are wrapped as `{ data: [...], ...pagination }`.
  const user = (userResponse as { data?: UserDetail } | undefined)?.data
    ?? (userResponse as UserDetail | undefined);
  const orders: OrderRow[] = (ordersResponse as { data?: OrderRow[] } | undefined)?.data ?? [];

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteUser(userId).unwrap();
      router.push('/admin/users');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setDeleteError(e?.data?.message || 'Failed to delete customer');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (isLoading) return <UserDetailSkeleton />;

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Customer not found</h2>
        <p className="text-muted-foreground mb-6 max-w-sm text-sm">This customer doesn&apos;t exist or may have been removed.</p>
        <Link href="/admin/users"><Button className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Customers</Button></Link>
      </div>
    );
  }

  const initials = user.name
    ? user.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const stats = user.stats;
  const addresses = user.addresses ?? [];

  return (
    <motion.div initial="hidden" animate="visible" variants={container} className="space-y-5">
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <Link href="/admin/users" aria-label="Back to customers">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Customer Profile</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ID #{user.id}</p>
        </div>
      </motion.div>

      {deleteError && (
        <motion.div variants={item} className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{deleteError}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* LEFT: profile + addresses */}
        <div className="space-y-5">
          {/* Profile card */}
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold mx-auto mb-4 select-none overflow-hidden">
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name ?? 'Customer'} className="w-full h-full object-cover" />
                    : initials}
                </div>
                <h2 className="text-lg font-bold">{user.name || 'Unnamed customer'}</h2>
                <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{user.email || '—'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {user.isVerified ? (
                    <Badge variant="outline" className="gap-1 text-green-700 border-green-200 bg-green-50 dark:bg-green-950/40 dark:border-green-900 dark:text-green-400">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5" /> Unverified
                    </Badge>
                  )}
                  <Badge variant="secondary" className="capitalize">{user.role || 'customer'}</Badge>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4 pt-4 border-t">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  Joined {fmt(user.createdAt)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger zone */}
          <motion.div variants={item}>
            <Card className="border-destructive/20">
              <CardHeader className="py-3 px-5 border-b bg-destructive/5">
                <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Permanently delete this customer and their account data. This cannot be undone.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete Customer
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Addresses */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="py-3 px-5 bg-muted/30 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Saved Addresses <span className="text-muted-foreground font-normal">({addresses.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {addresses.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">No saved addresses.</p>
                ) : addresses.map((addr) => (
                  <div key={addr.id} className="text-sm border rounded-lg p-3">
                    {addr.label && <Badge variant="secondary" className="mb-1.5 capitalize text-xs">{addr.label}</Badge>}
                    <p className="font-medium leading-snug">{addr.street || '—'}</p>
                    <p className="text-muted-foreground leading-snug">
                      {[addr.city, addr.state].filter(Boolean).join(', ')}
                      {addr.pincode ? ` – ${addr.pincode}` : ''}
                    </p>
                    {addr.country && <p className="text-muted-foreground leading-snug">{addr.country}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* RIGHT: stats + orders */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats */}
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              icon={ShoppingBag}
              label="Orders"
              value={stats?.orderCount ?? 0}
              tint="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
            />
            <StatCard
              icon={Wallet}
              label="Lifetime Spend"
              value={inr(stats?.totalSpent)}
              tint="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
            />
            <StatCard
              icon={Calendar}
              label="Last Order"
              value={stats?.lastOrderAt ? fmt(stats.lastOrderAt) : '—'}
              tint="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
            />
          </motion.div>

          {/* Order history */}
          <motion.div variants={item}>
            <Card className="overflow-hidden">
              <CardHeader className="py-3 px-5 bg-muted/30 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Order History <span className="text-muted-foreground font-normal">({orders.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {ordersLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No orders yet</p>
                    <p className="text-xs text-muted-foreground mt-1">This customer hasn&apos;t placed any orders.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {orders.map((order) => {
                      const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
                      const StatusIcon = cfg.icon;
                      return (
                        <Link
                          key={order.id}
                          href={`/admin/orders/${order.id}`}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors group"
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-sm shrink-0">
                            <Hash className="h-3.5 w-3.5 text-muted-foreground" />{order.id}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.bg} ${cfg.color}`}>
                              <StatusIcon className="h-3 w-3" />{cfg.label}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {fmt(order.createdAt)} · {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-sm tabular-nums flex items-center gap-0.5 justify-end">
                              <IndianRupee className="h-3.5 w-3.5" />
                              {(typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0)).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-background rounded-xl border shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold">Delete customer?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{user.name || 'This customer'}</span>
                  {' '}will be permanently removed. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
          <div className="h-40 rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
          </div>
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
