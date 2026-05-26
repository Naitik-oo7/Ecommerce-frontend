'use client';

import { useState } from 'react';
import { useGetOrdersQuery } from '@/services/api/ordersApi';
import { Package, ChevronRight, Clock, Truck, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/redux/hooks';
import { motion } from 'framer-motion';

type StatusKey = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200',  icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: Package },
  shipped:    { label: 'Shipped',    color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       icon: XCircle },
};

const FILTER_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function ProfileOrdersPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: ordersResponse, isLoading } = useGetOrdersQuery(
    { status: statusFilter || undefined, page, limit: 10 },
    { skip: !isAuthenticated }
  );

  const orders: any[] = (ordersResponse as any)?.data || [];
  const pagination = (ordersResponse as any)?.pagination;
  const totalOrders = pagination?.total ?? orders.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C7A27C] block mb-1">History</span>
          <h1 className="text-2xl font-bold text-[#111111]">My Orders</h1>
          <p className="text-sm text-[#9B9B9B] mt-0.5">{totalOrders} order{totalOrders !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/products">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-full hover:bg-[#333] transition-colors">
            <ShoppingBag className="h-4 w-4" /> Continue Shopping
          </button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === tab.value
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#6B6B6B] border-[#E5E2DD] hover:border-[#C7A27C] hover:text-[#111111]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#F6F3EE] animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E2DD] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F6F3EE] flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-[#C7A27C]" />
          </div>
          <h2 className="text-lg font-semibold text-[#111111] mb-1">
            {statusFilter ? `No ${statusFilter} orders` : 'No orders yet'}
          </h2>
          <p className="text-sm text-[#9B9B9B] mb-6">
            {statusFilter ? 'Try a different filter' : 'Your orders will appear here once you make a purchase'}
          </p>
          {!statusFilter && (
            <Link href="/products">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-full hover:bg-[#333] transition-colors">
                Browse Products
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any, idx: number) => {
            const statusInfo = STATUS_CONFIG[order.status as StatusKey] || STATUS_CONFIG.pending;
            const StatusIcon = statusInfo.icon;
            const items = order.items || order.orderItems || [];

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
              >
                <Link href={`/profile/orders/${order.id}`}>
                  <div className="bg-white rounded-2xl border border-[#E5E2DD] p-5 hover:border-[#C7A27C]/50 hover:shadow-sm transition-all cursor-pointer">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="font-semibold text-[#111111]">Order #{order.id}</p>
                        <p className="text-xs text-[#9B9B9B] mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    {/* Items thumbnails + total */}
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        {items.slice(0, 4).map((item: any, i: number) => {
                          const image = item.productImage || item.variant?.product?.media?.[0]?.url;
                          const name = item.productName || item.variant?.product?.name || '';
                          return (
                            <div key={i} className="w-11 h-11 rounded-lg bg-[#F6F3EE] overflow-hidden shrink-0 border border-[#E5E2DD]">
                              {image ? (
                                <img src={image} alt={name} className="object-cover w-full h-full" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-[#C8C8C8]" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {items.length > 4 && (
                          <div className="w-11 h-11 rounded-lg bg-[#F6F3EE] border border-[#E5E2DD] flex items-center justify-center text-xs font-medium text-[#9B9B9B]">
                            +{items.length - 4}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-bold text-[#111111]">₹{parseFloat(order.total).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-[#9B9B9B]">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#D4D0CA] shrink-0" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium border border-[#E5E2DD] rounded-full hover:border-[#C7A27C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-sm text-[#9B9B9B]">Page {page} of {pagination.totalPages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium border border-[#E5E2DD] rounded-full hover:border-[#C7A27C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
