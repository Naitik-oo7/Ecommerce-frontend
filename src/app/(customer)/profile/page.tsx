'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { setUser } from '@/lib/redux/authSlice';
import { useUpdateProfileMutation, useGetProfileQuery } from '@/services/api/usersApi';
import { useGetOrdersQuery } from '@/services/api/ordersApi';
import { useGetWishlistQuery } from '@/services/api/wishlistApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User, Mail, Edit2, Check, X, Loader2, Package, Heart, Star,
  MapPin, Settings, ShoppingBag, ChevronRight, Clock, Truck, CheckCircle, XCircle, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200',  icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: Package },
  shipped:    { label: 'Shipped',    color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       icon: XCircle },
};

export default function ProfilePage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const { data: profileResponse } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
  const { data: ordersResponse, isLoading: ordersLoading } = useGetOrdersQuery({ limit: 3 }, { skip: !isAuthenticated });
  const { data: wishlistResponse } = useGetWishlistQuery({}, { skip: !isAuthenticated });

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  interface ProfileResponse { name?: string; createdAt?: string; avatar?: string; email?: string; role?: string; }
  interface RecentOrder { id: number; status: string; createdAt: string; total: string; items?: { productImage?: string; variant?: { product?: { media?: { url?: string }[] } } }[]; orderItems?: { productImage?: string; variant?: { product?: { media?: { url?: string }[] } } }[]; itemCount?: number; _count?: { items?: number } }
  interface OrdersResponse { data?: RecentOrder[]; pagination?: { total?: number }; }
  interface WishlistResponse { data?: unknown[] }

  const profile = ((profileResponse as ProfileResponse | undefined) || (user as ProfileResponse | undefined)) as ProfileResponse | undefined;
  const recentOrders = (ordersResponse as OrdersResponse | undefined)?.data || [];
  const totalOrders = (ordersResponse as OrdersResponse | undefined)?.pagination?.total ?? recentOrders.length;
  const wishlistItems = (wishlistResponse as WishlistResponse | undefined)?.data || (Array.isArray(wishlistResponse) ? wishlistResponse : []);
  const wishlistCount = wishlistItems.length;

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

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
    if (!nameInput.trim()) { setSaveError('Name is required'); return; }
    try {
      const updated = await updateProfile({ name: nameInput.trim() }).unwrap();
      const updatedWithData = updated as { data?: { name?: string; avatar?: string } };
      const updatedUser = updatedWithData?.data || updated;
      if (user && updatedUser) {
        dispatch(setUser({ ...user, name: (updatedUser as { name?: string })?.name ?? user?.name ?? '', avatar: (updatedUser as { avatar?: string })?.avatar ?? user?.avatar }));
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
    { label: 'Total Orders', value: totalOrders, icon: ShoppingBag, href: '/profile/orders', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Wishlist', value: wishlistCount, icon: Heart, href: '/wishlist', color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Reviews', value: '–', icon: Star, href: '/reviews', color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Addresses', value: '–', icon: MapPin, href: '/profile/addresses', color: 'text-accent', bg: 'bg-accent/10' },
  ];

  const quickActions = [
    { href: '/products', icon: Sparkles, label: 'Browse Products', desc: 'Discover new arrivals' },
    { href: '/profile/addresses', icon: MapPin, label: 'Manage Addresses', desc: 'Add or edit delivery locations' },
    { href: '/notifications', icon: Package, label: 'Notifications', desc: 'View your alerts' },
    { href: '/profile/settings', icon: Settings, label: 'Account Settings', desc: 'Password & preferences' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="container-mono py-16 text-center">
        <p className="text-muted-foreground mb-4">Please login to view your profile.</p>
        <Link href="/login"><Button>Login</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Cover strip */}
        <div className="h-24 bg-gradient-to-r from-primary via-primary/80 to-accent/40" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {profile?.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name ?? ''}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-card border border-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center ring-4 ring-card border border-border">
                  <span className="text-2xl font-bold text-white">{initials}</span>
                </div>
              )}
            </div>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-full hover:border-accent hover:text-accent transition-colors"
              >
                <Edit2 className="h-3 w-3" /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-full hover:bg-muted transition-colors">
                  <X className="h-3 w-3" /> Cancel
                </button>
                <button onClick={handleSave} disabled={updating} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-full hover:bg-primary/80 transition-colors disabled:opacity-50">
                  {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Save
                </button>
              </div>
            )}
          </div>

          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm mb-4"
            >
              <Check className="h-4 w-4 shrink-0" /> Profile updated successfully
            </motion.div>
          )}

          {isEditing ? (
            <div className="space-y-3">
              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="pl-9 h-10 border-border focus:border-accent focus:ring-accent/20"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={profile?.email || ''} disabled className="pl-9 h-10 bg-muted text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{profile?.name}</h2>
                {profile?.role === 'admin' && (
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Admin</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{profile?.email}</p>
              {memberSince && (
                <p className="text-xs text-muted-foreground mt-1">Member since {memberSince}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-card rounded-2xl border border-border p-4 hover:border-accent/50 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-4.5 w-4.5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-accent block mb-0.5">Activity</span>
            <h3 className="text-base font-semibold text-foreground">Recent Orders</h3>
          </div>
          <Link href="/profile/orders" className="flex items-center gap-1 text-xs text-accent hover:underline font-medium">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="divide-y divide-border">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-12 h-12 rounded-xl bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded animate-pulse w-32" />
                  <div className="h-3 bg-muted rounded animate-pulse w-48" />
                </div>
                <div className="h-4 bg-muted rounded animate-pulse w-16" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Package className="h-10 w-10 mx-auto mb-3 text-border" />
            <p className="text-sm font-medium text-foreground mb-1">No orders yet</p>
            <p className="text-xs text-muted-foreground mb-4">Your order history will appear here</p>
            <Link href="/products">
              <button className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-full hover:bg-primary/80 transition-colors">
                Start Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => {
              const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusInfo.icon;
              const items = order.items || order.orderItems || [];
              const itemCount = items.length || order.itemCount || order._count?.items || 0;
              const firstImage = items[0]?.productImage || items[0]?.variant?.product?.media?.[0]?.url;
              return (
                <Link key={order.id} href={`/profile/orders/${order.id}`}>
                  <div className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors group">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-border">
                      {firstImage ? (
                        <img src={firstImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-foreground">Order #{order.id}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''} · ` : ''}
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {/* Total + arrow */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">₹{parseFloat(order.total).toLocaleString('en-IN')}</p>
                      <ChevronRight className="h-3.5 w-3.5 text-border ml-auto mt-1 group-hover:text-accent transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-accent block mb-0.5">Shortcuts</span>
          <h3 className="text-base font-semibold text-foreground">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 p-5 bg-card hover:bg-muted/50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{action.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-border shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
