'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  useProcessReturnMutation,
} from '@/services/api/ordersApi';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search, Eye, Loader2, Package, CreditCard, Banknote, AlertTriangle, RefreshCw,
  X, ChevronLeft, ChevronRight, Download, Check, Truck, Copy,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_CONFIG, ORDER_PROGRESS_STEPS } from '@/constants/order-status';

// ─── types ───────────────────────────────────────────────────────────────────
interface OrderItem {
  productName?: string;
  productImage?: string;
  quantity?: number;
  price?: string;
}

interface Order {
  id: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total?: string;
  createdAt?: string;
  trackingNumber?: string;
  cancellationReason?: string;
  user?: { name?: string; email?: string; phone?: string };
  items?: OrderItem[];
}

// ─── constants ───────────────────────────────────────────────────────────────
const PAYMENT_STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:  { label: 'Unpaid',   color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900',   dot: 'bg-amber-400' },
  paid:     { label: 'Paid',     color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 border border-green-200 dark:bg-green-950/40 dark:border-green-900',   dot: 'bg-green-500' },
  failed:   { label: 'Failed',   color: 'text-red-700 dark:text-red-400',      bg: 'bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900',           dot: 'bg-red-500' },
  refunded: { label: 'Refunded', color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900',       dot: 'bg-blue-400' },
};

// Valid next statuses for inline quick actions
const QUICK_NEXT: Record<string, string[]> = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['shipped', 'cancelled'],
  shipped:          ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
  return_requested: [], // handled via processReturn
  returned:         [],
};

// Human-readable action labels for each transition
const ACTION_LABELS: Record<string, string> = {
  confirmed:        'Confirm',
  processing:       'Mark Processing',
  shipped:          'Ship',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Mark Delivered',
  cancelled:        'Cancel',
};

// Lifecycle order for the status strip
const STATUS_STRIP_ORDER = [
  'pending', 'confirmed', 'processing', 'shipped',
  'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned',
];

// Date filter chips
type DateChip = 'today' | 'yesterday' | 'last7' | 'last30';

function getDateRange(chip: DateChip): { startDate: string; endDate: string } {
  // Send ISO timestamps so the backend's `new Date(startDate)` and `new Date(endDate)`
  // land exactly at local-day boundaries (Op.gte / Op.lte in UTC).
  const startOfDay = (d: Date) => {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  };
  const endOfDay = (d: Date) => {
    const r = new Date(d);
    r.setHours(23, 59, 59, 999);
    return r;
  };
  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };

  const now = new Date();

  let start: Date;
  let end: Date;

  if (chip === 'today') {
    start = startOfDay(now);
    end = endOfDay(now);
  } else if (chip === 'yesterday') {
    const yesterday = addDays(now, -1);
    start = startOfDay(yesterday);
    end = endOfDay(yesterday);
  } else if (chip === 'last7') {
    start = startOfDay(addDays(now, -6));
    end = endOfDay(now);
  } else {
    start = startOfDay(addDays(now, -29));
    end = endOfDay(now);
  }

  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

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

function exportOrdersCSV(orders: Order[]) {
  const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Phone', 'Amount', 'Status', 'Payment Status', 'Payment Method', 'Tracking'];
  const rows = orders.map((o) => [
    `#${o.id}`,
    o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    o.user?.name ?? '',
    o.user?.email ?? '',
    o.user?.phone ?? '',
    `₹${parseFloat(o.total ?? '0').toLocaleString('en-IN')}`,
    ORDER_STATUS_CONFIG[o.status]?.label ?? o.status,
    PAYMENT_STATUS[o.paymentStatus]?.label ?? o.paymentStatus,
    o.paymentMethod === 'online' ? 'Razorpay' : 'COD',
    o.trackingNumber ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── component ───────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateChip, setDateChip] = useState<DateChip | ''>('');
  const [page, setPage] = useState(1);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [actionError, setActionError] = useState('');
  // expandedAction: tracks which row has an inline input expanded ('ship' or 'cancel')
  const [expandedAction, setExpandedAction] = useState<{ orderId: number; action: 'ship' | 'cancel'; value: string } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const search = useDebounce(searchInput.trim(), 400);

  useEffect(() => { setPage(1); }, [search]);

  const dateRange = useMemo(() => dateChip ? getDateRange(dateChip) : {}, [dateChip]);

  const { data: ordersResponse, isLoading, isFetching } = useGetOrdersQuery({
    status: statusFilter || undefined,
    paymentStatus: paymentFilter || undefined,
    search: search || undefined,
    paymentMethod: methodFilter || undefined,
    page,
    limit: 20,
    isAdmin: true,
    ...dateRange,
  });
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [processReturn] = useProcessReturnMutation();

  interface OrdersResponse {
    data?: Order[];
    pagination?: { total?: number; totalPages?: number; page?: number };
  }
  const orders: Order[] = (ordersResponse as OrdersResponse | undefined)?.data || [];
  const pagination = (ordersResponse as OrdersResponse | undefined)?.pagination;

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    }
    return { total: pagination?.total ?? orders.length, byStatus };
  }, [orders, pagination]);

  // Priority alert counts
  const alerts = useMemo(() => ({
    needConfirmation: orders.filter((o) => o.status === 'pending').length,
    returnRequests: orders.filter((o) => o.status === 'return_requested').length,
    unpaidOnline: orders.filter((o) => isPaymentUrgent(o)).length,
  }), [orders]);

  const handleStatusChange = useCallback(async (orderId: number, status: string, opts?: { trackingNumber?: string; cancellationReason?: string }) => {
    setActionError('');
    setUpdatingIds((prev) => new Set(prev).add(orderId));
    try {
      await updateStatus({ id: orderId, status, isAdmin: true, ...opts }).unwrap();
      setExpandedAction(null);
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingIds((prev) => { const n = new Set(prev); n.delete(orderId); return n; });
    }
  }, [updateStatus]);

  const handleProcessReturn = useCallback(async (orderId: number, approve: boolean) => {
    setActionError('');
    setUpdatingIds((prev) => new Set(prev).add(orderId));
    try {
      await processReturn({ id: orderId, approve }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to process return');
    } finally {
      setUpdatingIds((prev) => { const n = new Set(prev); n.delete(orderId); return n; });
    }
  }, [processReturn]);

  const resetFilters = () => {
    setSearchInput(''); setStatusFilter(''); setPaymentFilter(''); setMethodFilter(''); setDateChip(''); setPage(1);
  };
  const hasActiveFilters = searchInput || statusFilter || paymentFilter || methodFilter || dateChip;

  const copyTracking = (id: number, tracking: string) => {
    navigator.clipboard.writeText(tracking);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination?.total !== undefined ? `${pagination.total} total orders` : 'Loading…'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportOrdersCSV(orders)}
          disabled={orders.length === 0}
          className="gap-1.5 h-9"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Priority Alerts */}
      {(alerts.needConfirmation > 0 || alerts.returnRequests > 0 || alerts.unpaidOnline > 0) && (
        <div className="flex flex-wrap gap-2">
          {alerts.needConfirmation > 0 && (
            <button
              onClick={() => { setStatusFilter('pending'); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              {alerts.needConfirmation} order{alerts.needConfirmation > 1 ? 's' : ''} need confirmation
            </button>
          )}
          {alerts.returnRequests > 0 && (
            <button
              onClick={() => { setStatusFilter('return_requested'); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              {alerts.returnRequests} return request{alerts.returnRequests > 1 ? 's' : ''} pending
            </button>
          )}
          {alerts.unpaidOnline > 0 && (
            <button
              onClick={() => { setPaymentFilter('pending'); setMethodFilter('online'); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              {alerts.unpaidOnline} unpaid online order{alerts.unpaidOnline > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Status Filter Tabs */}
      <Card className="px-3 sm:px-6 py-4">
        <div className="flex items-start gap-x-2 gap-y-4 overflow-x-auto flex-nowrap scrollbar-none sm:flex-wrap sm:justify-between">
          {/* All tab */}
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className="group flex flex-col items-center gap-1.5 px-2 min-w-16 shrink-0"
          >
            <span className={cn('text-2xl font-bold tabular-nums leading-none transition-colors', !statusFilter ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground')}>
              {stats.total}
            </span>
            <span className={cn('text-xs font-medium whitespace-nowrap transition-colors', !statusFilter ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>
              All
            </span>
            <span className={cn('h-1 w-full rounded-full transition-colors', !statusFilter ? 'bg-foreground' : 'bg-muted-foreground/20 group-hover:bg-foreground/40')} />
          </button>

          {STATUS_STRIP_ORDER.map((key) => {
            const cfg = ORDER_STATUS_CONFIG[key];
            if (!cfg) return null;
            const count = stats.byStatus[key] ?? 0;
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => { setStatusFilter(isActive ? '' : key); setPage(1); }}
                className="group flex flex-col items-center gap-1.5 px-2 min-w-16 shrink-0"
              >
                <span className={cn('text-2xl font-bold tabular-nums leading-none transition-colors', isActive ? cfg.color : 'text-foreground/80 group-hover:text-foreground')}>
                  {count}
                </span>
                <span className={cn('text-xs font-medium whitespace-nowrap transition-colors', isActive ? cfg.color : 'text-muted-foreground group-hover:text-foreground')}>
                  {cfg.label}
                </span>
                <span className={cn('h-1 w-full rounded-full transition-opacity', cfg.dot, isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100')} />
              </button>
            );
          })}
        </div>
      </Card>

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
        <div className="p-4 border-b space-y-2.5">
          {/* Search + dropdowns */}
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by order ID, name, email, or tracking…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8 h-9"
              />
              {isFetching && search && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
              className="h-9 border border-border rounded-md px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Payment</option>
              <option value="pending">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
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

          {/* Date filter chips */}
          <div className="flex gap-1.5 flex-wrap">
            {(['today', 'yesterday', 'last7', 'last30'] as DateChip[]).map((chip) => {
              const labels: Record<DateChip, string> = { today: 'Today', yesterday: 'Yesterday', last7: 'Last 7 Days', last30: 'Last 30 Days' };
              const isActive = dateChip === chip;
              return (
                <button
                  key={chip}
                  onClick={() => { setDateChip(isActive ? '' : chip); setPage(1); }}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  {labels[chip]}
                </button>
              );
            })}
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
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tracking</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
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
                        const isReturnOrder = order.status === 'return_requested';
                        const firstItem = order.items?.[0];
                        const isExpanded = expandedAction?.orderId === order.id;
                        const currentStep = statusCfg.step;

                        return (
                          <>
                            <tr
                              key={order.id}
                              className={`group hover:bg-muted/20 transition-colors ${urgent ? 'border-l-2 border-l-amber-400' : ''}`}
                            >
                              {/* Order ID */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  {urgent && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                  <div>
                                    <p className="font-semibold text-foreground">#{order.id}</p>
                                    {urgent && timeLeft && <p className="text-xs text-amber-600 font-medium mt-0.5">{timeLeft}</p>}
                                  </div>
                                </div>
                              </td>

                              {/* Date */}
                              <td className="px-4 py-3.5">
                                <p className="text-sm text-foreground whitespace-nowrap">
                                  {order.createdAt
                                    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : '—'}
                                </p>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                  {order.createdAt
                                    ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                    : ''}
                                </p>
                              </td>

                              {/* Customer */}
                              <td className="px-4 py-3.5">
                                <p className="font-medium text-foreground truncate max-w-35">{order.user?.name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-35">{order.user?.email || '—'}</p>
                                {order.user?.phone && (
                                  <p className="text-xs text-muted-foreground truncate max-w-35">{order.user.phone}</p>
                                )}
                              </td>

                              {/* Amount + product thumbnail */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  {firstItem?.productImage ? (
                                    <div className="relative h-8 w-8 rounded overflow-hidden border border-border shrink-0 bg-muted">
                                      <Image
                                        src={firstItem.productImage}
                                        alt={firstItem.productName ?? 'Product'}
                                        fill
                                        className="object-cover"
                                        sizes="32px"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-8 w-8 rounded border border-border bg-muted shrink-0 flex items-center justify-center">
                                      <Package className="h-3.5 w-3.5 text-muted-foreground/50" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-foreground">₹{parseFloat(order.total ?? '0').toLocaleString('en-IN')}</p>
                                    {firstItem?.productName && (
                                      <p className="text-xs text-muted-foreground truncate max-w-25">{firstItem.productName}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">{order.items?.length ?? '—'} item(s)</p>
                                  </div>
                                </div>
                              </td>

                              {/* Payment */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  {order.paymentMethod === 'online'
                                    ? <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    : <Banknote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                  <span className="text-xs text-muted-foreground">{order.paymentMethod === 'online' ? 'Razorpay' : 'COD'}</span>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${payCfg.bg} ${payCfg.color}`}>
                                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', payCfg.dot)} />
                                  {payCfg.label}
                                </span>
                              </td>

                              {/* Status + progress dots */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.bg} ${statusCfg.color}`}>
                                    <StatusIcon className="h-3 w-3" />
                                    {statusCfg.label}
                                  </div>
                                </div>
                                {/* Mini progress dots — only for forward-track statuses */}
                                {currentStep >= 0 && (
                                  <div className="flex items-center gap-0.5 mt-0.5">
                                    {ORDER_PROGRESS_STEPS.map((step, i) => (
                                      <span
                                        key={step}
                                        className={cn(
                                          'h-1 w-1 rounded-full',
                                          i <= currentStep ? statusCfg.dot : 'bg-muted-foreground/20',
                                        )}
                                      />
                                    ))}
                                  </div>
                                )}
                                {currentStep === -1 && order.status !== 'return_requested' && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">Terminal</p>
                                )}
                              </td>

                              {/* Tracking */}
                              <td className="px-4 py-3.5">
                                {order.trackingNumber ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-mono text-foreground">{order.trackingNumber}</span>
                                    <button
                                      onClick={() => copyTracking(order.id, order.trackingNumber!)}
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                      title="Copy tracking number"
                                    >
                                      {copiedId === order.id
                                        ? <Check className="h-3 w-3 text-green-500" />
                                        : <Copy className="h-3 w-3" />}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground/60">—</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5 justify-end flex-wrap">
                                  <Link href={`/admin/orders/${order.id}`}>
                                    <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                                      <Eye className="h-3.5 w-3.5" /> View
                                    </button>
                                  </Link>

                                  {/* Return request actions */}
                                  {isReturnOrder && (
                                    <>
                                      <button
                                        onClick={() => handleProcessReturn(order.id, true)}
                                        disabled={isUpdating}
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30 transition-colors disabled:opacity-40"
                                      >
                                        <Check className="h-3.5 w-3.5" /> Approve
                                      </button>
                                      <button
                                        onClick={() => handleProcessReturn(order.id, false)}
                                        disabled={isUpdating}
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
                                      >
                                        <X className="h-3.5 w-3.5" /> Reject
                                      </button>
                                    </>
                                  )}

                                  {/* Forward transition buttons */}
                                  {!isReturnOrder && nextStatuses.map((nextStatus) => {
                                    const isShip = nextStatus === 'shipped';
                                    const isCancel = nextStatus === 'cancelled';
                                    const isExpanding = isExpanded && (
                                      (isShip && expandedAction?.action === 'ship') ||
                                      (isCancel && expandedAction?.action === 'cancel')
                                    );
                                    return (
                                      <button
                                        key={nextStatus}
                                        disabled={isUpdating}
                                        onClick={() => {
                                          if (isShip || isCancel) {
                                            if (isExpanding) {
                                              setExpandedAction(null);
                                            } else {
                                              setExpandedAction({ orderId: order.id, action: isShip ? 'ship' : 'cancel', value: '' });
                                            }
                                          } else {
                                            handleStatusChange(order.id, nextStatus);
                                          }
                                        }}
                                        className={cn(
                                          'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40',
                                          isCancel
                                            ? 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30'
                                            : 'border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950/30',
                                        )}
                                      >
                                        {isShip && <Truck className="h-3.5 w-3.5" />}
                                        {ACTION_LABELS[nextStatus] ?? nextStatus}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>

                            {/* Inline expansion row for Ship / Cancel */}
                            {isExpanded && (
                              <tr key={`${order.id}-expand`} className="bg-muted/30 border-b border-border">
                                <td colSpan={8} className="px-4 py-3">
                                  <div className="flex items-center gap-2 max-w-lg">
                                    {expandedAction!.action === 'ship' ? (
                                      <>
                                        <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <Input
                                          placeholder="Tracking number (optional)"
                                          value={expandedAction!.value}
                                          onChange={(e) => setExpandedAction((prev) => prev ? { ...prev, value: e.target.value } : prev)}
                                          className="h-8 text-sm flex-1"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleStatusChange(order.id, 'shipped', { trackingNumber: expandedAction!.value || undefined });
                                            if (e.key === 'Escape') setExpandedAction(null);
                                          }}
                                        />
                                        <Button
                                          size="sm"
                                          className="h-8 px-3 text-xs"
                                          disabled={isUpdating}
                                          onClick={() => handleStatusChange(order.id, 'shipped', { trackingNumber: expandedAction!.value || undefined })}
                                        >
                                          {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm Ship'}
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <X className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <Input
                                          placeholder="Cancellation reason (optional)"
                                          value={expandedAction!.value}
                                          onChange={(e) => setExpandedAction((prev) => prev ? { ...prev, value: e.target.value } : prev)}
                                          className="h-8 text-sm flex-1"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleStatusChange(order.id, 'cancelled', { cancellationReason: expandedAction!.value || undefined });
                                            if (e.key === 'Escape') setExpandedAction(null);
                                          }}
                                        />
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="h-8 px-3 text-xs"
                                          disabled={isUpdating}
                                          onClick={() => handleStatusChange(order.id, 'cancelled', { cancellationReason: expandedAction!.value || undefined })}
                                        >
                                          {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm Cancel'}
                                        </Button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => setExpandedAction(null)}
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
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
