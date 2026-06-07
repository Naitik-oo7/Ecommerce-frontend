'use client';

import { useState, useMemo, useEffect } from 'react';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/services/api/ordersApi';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search, Eye, Loader2, Package, CreditCard, Banknote, AlertTriangle, RefreshCw,
  TrendingUp, ShoppingBag, CircleDollarSign,
  X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_CONFIG } from '@/constants/order-status';

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

const PAYMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Unpaid',    color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900' },
  paid:     { label: 'Paid',      color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 border border-green-200 dark:bg-green-950/40 dark:border-green-900' },
  failed:   { label: 'Failed',    color: 'text-red-700 dark:text-red-400',    bg: 'bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900' },
  refunded: { label: 'Refunded',  color: 'text-slate-600 dark:text-slate-400',  bg: 'bg-slate-50 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-700' },
};

// Allowed next statuses from current for inline quick-change
const QUICK_NEXT: Record<string, string[]> = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['shipped', 'cancelled'],
  shipped:          ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
  return_requested: [],
  returned:         [],
};

function isPaymentUrgent(order: Order) {
  return order.paymentMethod === 'online' && order.paymentStatus === 'pending' && order.status !== 'cancelled';
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
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [actionError, setActionError] = useState('');

  const search = useDebounce(searchInput.trim(), 400);

  // Reset to page 1 whenever the (debounced) search term changes
  useEffect(() => { setPage(1); }, [search]);

  const { data: ordersResponse, isLoading, isFetching } = useGetOrdersQuery({
    status: statusFilter || undefined,
    paymentStatus: paymentFilter || undefined,
    search: search || undefined,
    paymentMethod: methodFilter || undefined,
    page,
    limit: 20,
    isAdmin: true,
  });
  const [updateStatus] = useUpdateOrderStatusMutation();

  interface OrdersResponse {
    data?: Order[];
    pagination?: { total?: number; totalPages?: number; page?: number };
  }
  const orders: Order[] = (ordersResponse as OrdersResponse | undefined)?.data || [];
  const pagination = (ordersResponse as OrdersResponse | undefined)?.pagination;

  const stats = useMemo(() => ({
    total: pagination?.total ?? orders.length,
    urgent: orders.filter(isPaymentUrgent).length,
    inProgress: orders.filter((o) => ['confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  }), [orders, pagination]);

  const handleStatusChange = async (orderId: number, status: string) => {
    setActionError('');
    setUpdatingIds((prev) => new Set(prev).add(orderId));
    try {
      await updateStatus({ id: orderId, status, isAdmin: true }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingIds((prev) => { const n = new Set(prev); n.delete(orderId); return n; });
    }
  };

  const resetFilters = () => {
    setSearchInput(''); setStatusFilter(''); setPaymentFilter(''); setMethodFilter(''); setPage(1);
  };
  const hasActiveFilters = searchInput || statusFilter || paymentFilter || methodFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination?.total !== undefined ? `${pagination.total} total orders` : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => { setStatusFilter(''); setPage(1); }} className={cn('rounded-xl border p-4 text-left transition-all hover:shadow-sm bg-muted/40', !statusFilter ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border')}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Orders</span><ShoppingBag className="h-4 w-4 text-foreground" /></div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </button>
        <button onClick={() => { setPaymentFilter('pending'); setMethodFilter('online'); setPage(1); }} className={cn('rounded-xl border p-4 text-left transition-all hover:shadow-sm bg-amber-50 dark:bg-amber-950/40', stats.urgent > 0 ? 'border-amber-300 ring-1 ring-amber-200 dark:border-amber-700' : 'border-border')}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Awaiting Payment</span><AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" /></div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.urgent}</p>
        </button>
        <button onClick={() => { setStatusFilter('processing'); setPage(1); }} className={cn('rounded-xl border p-4 text-left transition-all hover:shadow-sm bg-blue-50 dark:bg-blue-950/40', statusFilter === 'processing' ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border')}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In Progress</span><TrendingUp className="h-4 w-4 text-blue-700 dark:text-blue-400" /></div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.inProgress}</p>
        </button>
        <button onClick={() => { setStatusFilter('delivered'); setPage(1); }} className={cn('rounded-xl border p-4 text-left transition-all hover:shadow-sm bg-green-50 dark:bg-green-950/40', statusFilter === 'delivered' ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border')}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Delivered</span><CircleDollarSign className="h-4 w-4 text-green-700 dark:text-green-400" /></div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.delivered}</p>
        </button>
      </div>

      {/* Error banner */}
      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {actionError}
          </div>
          <button onClick={() => setActionError('')} className="text-destructive/60 hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filters + Table */}
      <Card>
      <div className="p-4 border-b space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by order ID, name, email, or tracking number…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-8 h-9"
            />
            {isFetching && search && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 border border-border rounded-md px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="return_requested">Return Requested</option>
            <option value="returned">Returned</option>
          </select>

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

      <CardContent className="p-0">
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <Package className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="font-medium text-muted-foreground">No orders found</p>
              {hasActiveFilters && <button onClick={resetFilters} className="text-xs text-primary underline mt-1">Clear filters</button>}
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
                    const statusCfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
                    const StatusIcon = statusCfg.icon;
                    const payCfg = PAYMENT_STATUS[order.paymentStatus] ?? PAYMENT_STATUS.pending;
                    const isUpdating = updatingIds.has(order.id);
                    const timeLeft = urgent ? hoursUntilExpiry(order.createdAt) : null;
                    const nextStatuses = QUICK_NEXT[order.status] ?? [];
                    const isTerminal = nextStatuses.length === 0;

                    return (
                      <tr key={order.id} className={`group hover:bg-muted/20 transition-colors ${urgent ? 'border-l-2 border-l-amber-400' : ''}`}>
                        {/* Order ID + date */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {urgent && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                            <div>
                              <p className="font-semibold text-foreground">#{order.id}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                              </p>
                              {urgent && timeLeft && <p className="text-xs text-amber-600 font-medium mt-0.5">{timeLeft}</p>}
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
                          <p className="font-semibold text-foreground">₹{parseFloat(order.total ?? '0').toLocaleString('en-IN')}</p>
                          <p className="text-xs text-muted-foreground">{(order.items as unknown[])?.length ?? '—'} item(s)</p>
                        </td>

                        {/* Order Status */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.bg} ${statusCfg.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusCfg.label}
                            </div>
                            {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                          </div>
                          {!isTerminal && (
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              disabled={isUpdating}
                              className="mt-1.5 h-7 border border-border rounded px-1.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <option value={order.status}>{statusCfg.label} (current)</option>
                              {nextStatuses.map((s) => (
                                <option key={s} value={s}>{ORDER_STATUS_CONFIG[s]?.label ?? s}</option>
                              ))}
                            </select>
                          )}
                          {isTerminal && <p className="text-[10px] text-muted-foreground mt-1">No further actions</p>}
                        </td>

                        {/* Payment */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            {order.paymentMethod === 'online'
                              ? <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              : <Banknote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                            <span className="text-xs text-muted-foreground">{order.paymentMethod === 'online' ? 'Razorpay' : 'COD'}</span>
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page <span className="font-medium text-foreground">{page}</span> of{' '}
                  <span className="font-medium text-foreground">{pagination.totalPages}</span>
                  <span className="ml-2 text-xs">({pagination.total} total)</span>
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, pagination.totalPages ?? 0) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min((pagination.totalPages ?? 0) - 4, page - 2)) + i;
                    return pageNum <= (pagination.totalPages ?? 0) ? (
                      <Button key={pageNum} variant={pageNum === page ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(pageNum)}>
                        {pageNum}
                      </Button>
                    ) : null;
                  })}
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => p + 1)} disabled={page >= (pagination.totalPages ?? 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </CardContent>
      </Card>
    </div>
  );
}

