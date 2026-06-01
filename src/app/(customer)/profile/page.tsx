'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { setUser } from '@/lib/redux/authSlice';
import { useUpdateProfileMutation, useGetProfileQuery } from '@/services/api/usersApi';
import { useGetOrdersQuery } from '@/services/api/ordersApi';
import { useGetWishlistQuery } from '@/services/api/wishlistApi';
import { useGetAddressesQuery } from '@/services/api/addressesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Edit2,
  Check,
  X,
  Loader2,
  Package,
  Heart,
  MapPin,
  Settings,
  ShoppingBag,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Sparkles,
  Bell,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: 'Pending', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200/80', icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200/80', icon: Package },
  shipped: { label: 'Shipped', color: 'text-indigo-800', bg: 'bg-indigo-50 border-indigo-200/80', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200/80', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-800', bg: 'bg-red-50 border-red-200/80', icon: XCircle },
};

const ACTIVE_STATUSES = new Set(['pending', 'processing', 'shipped']);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const { data: profileResponse } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
  const { data: ordersResponse, isLoading: ordersLoading } = useGetOrdersQuery(
    { limit: 5 },
    { skip: !isAuthenticated }
  );
  const { data: wishlistResponse } = useGetWishlistQuery({}, { skip: !isAuthenticated });
  const { data: addressesResponse } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  interface ProfileResponse {
    name?: string;
    createdAt?: string;
    avatar?: string;
    email?: string;
    role?: string;
  }
  interface RecentOrder {
    id: number;
    status: string;
    createdAt: string;
    total: string;
    items?: { productImage?: string; variant?: { product?: { media?: { url?: string }[] } } }[];
    orderItems?: { productImage?: string; variant?: { product?: { media?: { url?: string }[] } } }[];
    itemCount?: number;
    _count?: { items?: number };
  }
  interface OrdersResponse {
    data?: RecentOrder[];
    pagination?: { total?: number };
  }
  interface WishlistResponse {
    data?: unknown[];
  }

  const profile = ((profileResponse as ProfileResponse | undefined) ||
    (user as ProfileResponse | undefined)) as ProfileResponse | undefined;
  const recentOrders = (ordersResponse as OrdersResponse | undefined)?.data || [];
  const totalOrders = (ordersResponse as OrdersResponse | undefined)?.pagination?.total ?? recentOrders.length;
  const wishlistItems =
    (wishlistResponse as WishlistResponse | undefined)?.data ||
    (Array.isArray(wishlistResponse) ? wishlistResponse : []);
  const wishlistCount = wishlistItems.length;
  const addresses = Array.isArray(addressesResponse) ? addressesResponse : [];
  const addressCount = addresses.length;

  const activeOrder = recentOrders.find((o) => ACTIVE_STATUSES.has(o.status));
  const inProgressCount = recentOrders.filter((o) => ACTIVE_STATUSES.has(o.status)).length;

  const firstName = profile?.name?.split(' ')[0] || 'there';

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  const handleEdit = () => {
    setNameInput(profile?.name || '');
    setIsEditing(true);
    setSaveError('');
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError('');
  };

  const handleSave = async () => {
    setSaveError('');
    if (!nameInput.trim()) {
      setSaveError('Name is required');
      return;
    }
    try {
      const updated = await updateProfile({ name: nameInput.trim() }).unwrap();
      const updatedWithData = updated as { data?: { name?: string; avatar?: string } };
      const updatedUser = updatedWithData?.data || updated;
      if (user && updatedUser) {
        dispatch(
          setUser({
            ...user,
            name: (updatedUser as { name?: string })?.name ?? user?.name ?? '',
            avatar: (updatedUser as { avatar?: string })?.avatar ?? user?.avatar,
          })
        );
      }
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const errorWithData = err as { data?: { message?: string } };
      setSaveError(errorWithData?.data?.message || 'Failed to update profile');
    }
  };

  const stats = [
    {
      label: 'Orders',
      value: totalOrders,
      sub: inProgressCount > 0 ? `${inProgressCount} in progress` : 'All time',
      icon: ShoppingBag,
      href: '/profile/orders',
      accent: 'from-blue-500/10 to-transparent',
      iconClass: 'text-blue-600 bg-blue-500/10',
    },
    {
      label: 'Wishlist',
      value: wishlistCount,
      sub: wishlistCount === 1 ? 'Saved item' : 'Saved items',
      icon: Heart,
      href: '/wishlist',
      accent: 'from-rose-500/10 to-transparent',
      iconClass: 'text-rose-600 bg-rose-500/10',
    },
    {
      label: 'Addresses',
      value: addressCount,
      sub: addressCount === 0 ? 'Add one for faster checkout' : 'Delivery locations',
      icon: MapPin,
      href: '/profile/addresses',
      accent: 'from-accent/15 to-transparent',
      iconClass: 'text-accent bg-accent/10',
    },
  ];

  const quickActions = [
    { href: '/products', icon: Sparkles, label: 'Shop new arrivals', color: 'text-accent' },
    { href: '/profile/orders', icon: Package, label: 'Track an order', color: 'text-blue-600' },
    { href: '/profile/addresses', icon: MapPin, label: 'Delivery addresses', color: 'text-emerald-600' },
    { href: '/profile/settings', icon: Settings, label: 'Password & preferences', color: 'text-foreground' },
    { href: '/notifications', icon: Bell, label: 'Notifications', color: 'text-amber-600' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="container-mono py-16 text-center">
        <p className="text-muted-foreground mb-4">Please login to view your profile.</p>
        <Link href="/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header — dashboard intro, not duplicate avatar */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-1">Overview</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Manage orders, saved items, and account details from your dashboard.
          </p>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={handleEdit} className="rounded-full shrink-0 self-start sm:self-auto">
            <Edit2 className="h-3.5 w-3.5" />
            Edit name
          </Button>
        )}
      </header>

      {/* Inline account edit */}
      <AnimatePresence mode="wait">
        {(isEditing || saveSuccess) && (
          <motion.div
            key={isEditing ? 'edit' : 'success'}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl border border-border p-5 md:p-6">
              {saveSuccess && !isEditing ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Check className="h-4 w-4 shrink-0" />
                  Profile updated successfully
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-foreground">Update display name</h2>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleCancel} className="rounded-full">
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={updating} className="rounded-full">
                        {updating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                  {saveError && <p className="text-xs text-destructive">{saveError}</p>}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="profile-name" className="text-xs text-muted-foreground mb-1.5 block">
                        Full name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="profile-name"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="pl-9 h-10"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="profile-email" className="text-xs text-muted-foreground mb-1.5 block">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="profile-email"
                          value={profile?.email || ''}
                          disabled
                          className="pl-9 h-10 bg-muted/60"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active order highlight */}
      {activeOrder && (
        <Link href={`/profile/orders/${activeOrder.id}`} className="block group">
          <motion.div
            whileHover={{ scale: 1.005 }}
            className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/8 via-card to-card p-5 md:p-6"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                <Truck className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-0.5">
                  Order in progress
                </p>
                <p className="text-base font-semibold text-foreground">
                  Order #{activeOrder.id} ·{' '}
                  {STATUS_CONFIG[activeOrder.status]?.label ?? activeOrder.status}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  ₹{parseFloat(activeOrder.total).toLocaleString('en-IN')} · Tap to view details and tracking
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:gap-2 transition-all shrink-0">
                View order
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </motion.div>
        </Link>
      )}

      {/* Stats */}
      <section aria-label="Account summary">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href} className="group">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                  className={`relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md hover:border-accent/30`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} pointer-events-none`} />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-3xl font-bold tabular-nums text-foreground">{stat.value}</p>
                      <p className="text-sm font-medium text-foreground mt-1">{stat.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{stat.sub}</p>
                    </div>
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/0 group-hover:text-accent/60 transition-colors" />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders — primary column */}
        <section className="lg:col-span-2" aria-labelledby="recent-orders-heading">
          <div className="bg-card rounded-2xl border border-border overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-6 border-b border-border">
              <div>
                <h2 id="recent-orders-heading" className="text-base font-semibold text-foreground">
                  Recent orders
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your latest purchases</p>
              </div>
              <Link
                href="/profile/orders"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline shrink-0"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {ordersLoading ? (
              <div className="p-4 md:p-5 space-y-3 flex-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-xl bg-muted/40 animate-pulse">
                    <div className="w-14 h-14 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3.5 bg-muted rounded w-28" />
                      <div className="h-3 bg-muted rounded w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center flex-1">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Package className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-semibold text-foreground">No orders yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-5 max-w-xs">
                  When you place your first order, it will show up here for quick access.
                </p>
                <Link href="/products">
                  <Button size="sm" className="rounded-full">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Browse products
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border flex-1">
                {recentOrders.slice(0, 4).map((order) => {
                  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusInfo.icon;
                  const items = order.items || order.orderItems || [];
                  const itemCount = items.length || order.itemCount || order._count?.items || 0;
                  const firstImage =
                    items[0]?.productImage || items[0]?.variant?.product?.media?.[0]?.url;

                  return (
                    <li key={order.id}>
                      <Link href={`/profile/orders/${order.id}`} className="block group">
                        <div className="flex items-center gap-4 px-5 py-4 md:px-6 hover:bg-muted/40 transition-colors">
                          <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/80">
                            {firstImage ? (
                              <img src={firstImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">
                                #{order.id}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusInfo.bg} ${statusInfo.color}`}
                              >
                                <StatusIcon className="h-2.5 w-2.5" />
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {itemCount > 0 && (
                                <>
                                  {itemCount} item{itemCount !== 1 ? 's' : ''} ·{' '}
                                </>
                              )}
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground tabular-nums">
                              ₹{parseFloat(order.total).toLocaleString('en-IN')}
                            </p>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Sidebar column */}
        <aside className="space-y-4">
          {/* Account snapshot */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Account</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Signed in as</dt>
                <dd className="font-medium text-foreground truncate mt-0.5">{profile?.email}</dd>
              </div>
              {memberSince && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Member since</dt>
                    <dd className="font-medium text-foreground mt-0.5">{memberSince}</dd>
                  </div>
                </div>
              )}
              {profile?.role === 'admin' && (
                <div>
                  <span className="inline-flex text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                    Admin
                  </span>
                </div>
              )}
            </dl>
            <Link href="/profile/settings" className="mt-4 block">
              <Button variant="outline" size="sm" className="w-full rounded-full">
                <Settings className="h-3.5 w-3.5" />
                Account settings
              </Button>
            </Link>
          </div>

          {/* Quick actions */}
          <nav className="bg-card rounded-2xl border border-border overflow-hidden" aria-label="Quick actions">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Common tasks</p>
            </div>
            <ul>
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <li key={action.href}>
                    <Link
                      href={action.href}
                      className={`flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors ${
                        i > 0 ? 'border-t border-border' : ''
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${action.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground">{action.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
