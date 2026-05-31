'use client';

import { useState, useMemo } from 'react';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/services/api/ordersApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search, Eye, Loader2, Package, Clock, Truck, CheckCircle,
  XCircle, CreditCard, Banknote, AlertTriangle, RefreshCw,
  TrendingUp, ShoppingBag, CircleDollarSign,
} from 'lucide-react';
import Link from 'next/link';

// ─── types ───────────────────────────────────────────────────────────────────
interface Order {
  id: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total?: string;
  createdAt?: string;
  user?: { name?: string; email?: string };
  items?: unknown[];
}

// ─── config ──────────────────────────────────────────────────────────────────
const ORDER_STATUS: Record<string, { label: string; color: string; bg: string; dot: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:    { label: 'Pending',    color: 'text-amber-700',  bg: 'bg-amber-50',   dot: 'bg-amber-400',  icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-700',   bg: 'bg-blue-50',    dot: 'bg-blue-400',   icon: Package },
  shipped:    { label: 'Shipped',    color: 'text-violet-700', bg: 'bg-violet-50',  dot: 'bg-violet-400', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-50',   dot: 'bg-green-400',  icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-50',     dot: 'bg-red-400',    icon: XCircle },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Unpaid',    color: 'text-amber-700',  bg: 'bg-amber-50 border border-amber-200' },
  paid:     { label: 'Paid',      color: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  failed:   { label: 'Failed',    color: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  refunded: { label: 'Refunded',  color: 'text-slate-600',  bg: 'bg-slate-50 border border-slate-200' },
};

// Is this order in an action-required state? (online, unpaid, not cancelled)
function isPaymentUrgent(order: Order) {
  return (
    order.paymentMethod === 'online' &&
    order.paymentStatus === 'pending' &&
    order.status !== 'cancelled'
  );
}

function hoursAgo(dateStr?: string) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / (1000 * 60 * 60));
  if (h < 1) return 'less than 1 hr ago';
  return `${h}h ago`;
}

function hoursUntilExpiry(dateStr?: string) {
  if (!dateStr) return null;
  const expiry = new Date(dateStr).getTime() + 24 * 60 * 60 * 1000;
  const remaining = expiry - Date.now();
  if (remaining <= 0) return 'Expired';
  const h = Math.floor(remaining / (1000 * 60 * 60));
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  if (h === 0) return `${m}m left`;
  return `${h}h ${m}m left`;
}

// ─── component ───────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const { data: ordersResponse, isLoading } = useGetOrdersQuery({
    status: statusFilter || undefined,
    paymentStatus: paymentFilter || undefined,
    page,
    limit: 20,
    isAdmin: true,
  });
  const [updateStatus] = useUpdateOrderStatusMutation();

  interface OrdersResponse {
    data?: Order[];
    pagination?: { total?: number; totalPages?: number; page?: number };
  }
  const allOrders: Order[] = (ordersResponse as OrdersResponse | undefined)?.data || [];
  const pagination = (ordersResponse as OrdersResponse | undefined)?.pagination;

  // Client-side search + method filter (server handles status/payment filters)
  const orders = useMemo(() => {
    let result = allOrders;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          String(o.id).includes(q) ||
          o.user?.name?.toLowerCase().includes(q) ||
          o.user?.email?.toLowerCase().includes(q),
      );
    }
    if (methodFilter) {
      result = result.filter((o) => o.paymentMethod === methodFilter);
    }
    return result;
  }, [allOrders, search, methodFilter]);

  // Stats derived from current page data
  const stats = useMemo(() => ({
    total: pagination?.total ?? allOrders.length,
    urgent: allOrders.filter(isPaymentUrgent).length,
    inProgress: allOrders.filter((o) => o.status === 'processing' || o.status === 'shipped').length,
    delivered: allOrders.filter((o) => o.status === 'delivered').length,
  }), [allOrders, pagination]);

  const handleStatusChange = async (orderId: number, status: string) => {
    setUpdatingIds((prev) => new Set(prev).add(orderId));
    try {
      await updateStatus({ id: orderId, status, isAdmin: true }).unwrap();
    } catch {}
    setUpdatingIds((prev) => {
      const n = new Set(prev);
      n.delete(orderId);
      return n;
    });
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPaymentFilter('');
    setMethodFilter('');
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter || paymentFilter || methodFilter;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination?.total !== undefined ? `${pagination.total} total orders` : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Total Orders"
          value={stats.total}
          color="text-foreground"
          bg="bg-muted/40"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Awaiting Payment"
          value={stats.urgent}
          color="text-amber-700"
          bg="bg-amber-50"
          highlight={stats.urgent > 0}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="In Progress"
          value={stats.inProgress}
          color="text-blue-700"
          bg="bg-blue-50"
        />
        <StatCard
          icon={<CircleDollarSign className="h-4 w-4" />}
          label="Delivered"
          value={stats.delivered}
          color="text-green-700"
          bg="bg-green-50"
        />
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by order ID, name, or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9"
            />
          </div>

          {/* Order Status */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 border border-border rounded-md px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="h-9 border border-border rounded-md px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Payment</option>
            <option value="pending">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Payment Method */}
          <select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
            className="h-9 border border-border rounded-md px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Methods</option>
            <option value="online">Online</option>
            <option value="cod">COD</option>
          </select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 gap-1.5 text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <Package className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="font-medium text-muted-foreground">No orders found</p>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="text-xs text-primary underline mt-1">Clear filters</button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items / Total</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => {
                    const urgent = isPaymentUrgent(order);
                    const statusCfg = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
                    const StatusIcon = statusCfg.icon;
                    const payCfg = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.pending;
                    const isUpdating = updatingIds.has(order.id);
                    const timeLeft = urgent ? hoursUntilExpiry(order.createdAt) : null;

                    return (
                      <tr
                        key={order.id}
                        className={`group hover:bg-muted/20 transition-colors ${urgent ? 'border-l-2 border-l-amber-400' : ''}`}
                      >
                        {/* Order ID + date */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {urgent && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                            <div>
                              <p className="font-semibold text-foreground">#{order.id}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {order.createdAt
                                  ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : '—'}
                              </p>
                              {urgent && timeLeft && (
                                <p className="text-xs text-amber-600 font-medium mt-0.5">{timeLeft}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-foreground truncate max-w-[140px]">{order.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">{order.user?.email || '—'}</p>
                        </td>

                        {/* Items / Total */}
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-foreground">
                            ₹{parseFloat(order.total ?? '0').toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(order.items as unknown[])?.length ?? '—'} item(s)
                          </p>
                        </td>

                        {/* Order Status — inline editable */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusCfg.label}
                            </div>
                            {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                          </div>
                          {/* Inline status update */}
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={isUpdating || order.status === 'cancelled' || order.status === 'delivered'}
                            className="mt-1.5 h-7 border border-border rounded px-1.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Payment */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            {order.paymentMethod === 'online'
                              ? <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              : <Banknote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                            <span className="text-xs text-muted-foreground">
                              {order.paymentMethod === 'online' ? 'Razorpay' : 'COD'}
                            </span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${payCfg.bg} ${payCfg.color}`}>
                            {payCfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <Link href={`/admin/orders/${order.id}`}>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (pagination.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {pagination.totalPages} · {pagination.total} orders
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= (pagination.totalPages ?? 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, color, bg, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${bg} ${highlight ? 'border-amber-300 ring-1 ring-amber-200' : 'border-border'}`}>
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
