'use client';

import { useMemo, useState } from 'react';
import { useGetOrdersQuery } from '@/services/api/ordersApi';
import {
  Package,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Search,
  SlidersHorizontal,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/redux/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type StatusKey = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_CONFIG: Record<
  StatusKey,
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ComponentType<{ className?: string }>;
    step: number;
  }
> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-800',
    bg: 'bg-amber-50 border-amber-200/80',
    icon: Clock,
    step: 0,
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-800',
    bg: 'bg-blue-50 border-blue-200/80',
    icon: Package,
    step: 1,
  },
  shipped: {
    label: 'Shipped',
    color: 'text-indigo-800',
    bg: 'bg-indigo-50 border-indigo-200/80',
    icon: Truck,
    step: 2,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50 border-emerald-200/80',
    icon: CheckCircle,
    step: 3,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-800',
    bg: 'bg-red-50 border-red-200/80',
    icon: XCircle,
    step: -1,
  },
};

const ORDER_STEPS: StatusKey[] = ['pending', 'processing', 'shipped', 'delivered'];

const FILTER_TABS: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: '', label: 'All', icon: SlidersHorizontal },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'processing', label: 'Processing', icon: Package },
  { value: 'shipped', label: 'Shipped', icon: Truck },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
];

const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Payment pending', className: 'bg-amber-50 text-amber-800 border-amber-200/80' },
  failed: { label: 'Payment failed', className: 'bg-red-50 text-red-800 border-red-200/80' },
  refunded: { label: 'Refunded', className: 'bg-muted text-muted-foreground border-border' },
};

interface OrderItem {
  productImage?: string;
  productName?: string;
  variant?: { product?: { media?: { url?: string }[]; name?: string } };
}

interface Order {
  id: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt: string;
  total: string;
  items?: OrderItem[];
  orderItems?: OrderItem[];
}

interface OrdersResponse {
  data?: Order[];
  pagination?: { total?: number; totalPages?: number; page?: number };
}

function getOrderItems(order: Order): OrderItem[] {
  return order.items || order.orderItems || [];
}

function formatOrderDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function OrderProgress({ status }: { status: string }) {
  const key = status as StatusKey;
  const config = STATUS_CONFIG[key];
  if (!config || config.step < 0) return null;

  const currentStep = config.step;

  return (
    <div className="mt-4 pt-4 border-t border-border/80">
      <div className="flex items-center justify-between gap-1">
        {ORDER_STEPS.map((step, i) => {
          const stepConfig = STATUS_CONFIG[step];
          const StepIcon = stepConfig.icon;
          const isComplete = i <= currentStep;
          const isCurrent = i === currentStep;

          return (
            <div key={step} className="flex flex-1 items-center min-w-0">
              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                    isComplete
                      ? isCurrent
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground/50 border-border'
                  }`}
                >
                  <StepIcon className="h-3 w-3" />
                </div>
                <span
                  className={`text-[9px] font-medium truncate w-full text-center hidden sm:block ${
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {stepConfig.label}
                </span>
              </div>
              {i < ORDER_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-0.5 rounded-full mb-5 sm:mb-6 ${
                    i < currentStep ? 'bg-primary/40' : 'bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, index }: { order: Order; index: number }) {
  const statusKey = (order.status in STATUS_CONFIG ? order.status : 'pending') as StatusKey;
  const statusInfo = STATUS_CONFIG[statusKey];
  const StatusIcon = statusInfo.icon;
  const items = getOrderItems(order);
  const itemCount = items.length;
  const primaryItem = items[0];
  const primaryImage =
    primaryItem?.productImage || primaryItem?.variant?.product?.media?.[0]?.url;
  const primaryName =
    primaryItem?.productName || primaryItem?.variant?.product?.name || 'Order items';

  const paymentBadge =
    order.paymentStatus && order.paymentStatus !== 'paid'
      ? PAYMENT_BADGE[order.paymentStatus]
      : null;

  const showProgress = statusKey !== 'cancelled' && statusKey !== 'delivered';

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link href={`/profile/orders/${order.id}`} className="block group">
        <article className="relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-accent/40 hover:shadow-md">
          {/* Status accent */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 ${
              statusKey === 'delivered'
                ? 'bg-emerald-500'
                : statusKey === 'cancelled'
                  ? 'bg-red-400'
                  : statusKey === 'shipped'
                    ? 'bg-indigo-500'
                    : statusKey === 'processing'
                      ? 'bg-blue-500'
                      : 'bg-amber-400'
            }`}
          />

          <div className="p-5 md:p-6 pl-6">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Thumbnail stack */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden border border-border/80">
                    {primaryImage ? (
                      <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  {itemCount > 1 && (
                    <span className="absolute -bottom-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      +{itemCount - 1}
                    </span>
                  )}
                </div>
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-foreground">Order #{order.id}</h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusInfo.bg} ${statusInfo.color}`}
                  >
                    <StatusIcon className="h-2.5 w-2.5" />
                    {statusInfo.label}
                  </span>
                  {paymentBadge && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${paymentBadge.className}`}
                    >
                      <CreditCard className="h-2.5 w-2.5" />
                      {paymentBadge.label}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-1">
                  {primaryName}
                  {itemCount > 1 && (
                    <span className="text-muted-foreground/80">
                      {' '}
                      · +{itemCount - 1} more item{itemCount - 1 !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  Placed {formatOrderDate(order.createdAt)}
                  {order.paymentMethod && (
                    <span className="capitalize"> · {order.paymentMethod.replace(/_/g, ' ')}</span>
                  )}
                </p>

                {/* Thumbnail strip for multi-item */}
                {itemCount > 1 && (
                  <div className="flex gap-1.5 mt-3">
                    {items.slice(0, 5).map((item, i) => {
                      const image = item.productImage || item.variant?.product?.media?.[0]?.url;
                      return (
                        <div
                          key={i}
                          className="w-9 h-9 rounded-lg bg-muted overflow-hidden border border-border/80 shrink-0"
                        >
                          {image ? (
                            <img src={image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-3 w-3 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {itemCount > 5 && (
                      <div className="w-9 h-9 rounded-lg bg-muted border border-border/80 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                        +{itemCount - 5}
                      </div>
                    )}
                  </div>
                )}

                {showProgress && <OrderProgress status={order.status} />}
              </div>

              {/* Total + CTA */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:text-right shrink-0 sm:pl-2">
                <div>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    ₹{parseFloat(order.total).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent opacity-80 group-hover:opacity-100 group-hover:gap-1.5 transition-all">
                  {showProgress ? 'Track order' : 'View details'}
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.li>
  );
}

export default function ProfileOrdersPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: ordersResponse, isLoading, isFetching } = useGetOrdersQuery(
    { status: statusFilter || undefined, page, limit: 8 },
    { skip: !isAuthenticated }
  );

  const { data: summaryResponse } = useGetOrdersQuery(
    { limit: 100, page: 1 },
    { skip: !isAuthenticated }
  );

  const orders = (ordersResponse as OrdersResponse | undefined)?.data || [];
  const pagination = (ordersResponse as OrdersResponse | undefined)?.pagination;
  const totalOrders = pagination?.total ?? orders.length;
  const totalPages = pagination?.totalPages ?? 1;

  const summaryOrders = (summaryResponse as OrdersResponse | undefined)?.data || [];
  const summaryTotal =
    (summaryResponse as OrdersResponse | undefined)?.pagination?.total ?? summaryOrders.length;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      '': summaryTotal,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of summaryOrders) {
      if (o.status in counts) counts[o.status]++;
    }
    return counts;
  }, [summaryOrders, summaryTotal]);

  const inProgressCount =
    (statusCounts.pending ?? 0) + (statusCounts.processing ?? 0) + (statusCounts.shipped ?? 0);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.trim().toLowerCase();
    return orders.filter(
      (o) =>
        String(o.id).includes(q) ||
        getOrderItems(o).some((item) =>
          (item.productName || item.variant?.product?.name || '').toLowerCase().includes(q)
        )
    );
  }, [orders, searchQuery]);

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    setSearchQuery('');
  };

  const summaryCards = [
    {
      label: 'Total orders',
      value: summaryTotal,
      hint: summaryOrders.length >= 100 ? 'Counts from recent orders' : 'All time',
      filter: '' as string | null,
      clickable: true,
    },
    {
      label: 'In progress',
      value: inProgressCount,
      hint: 'Pending · processing · shipped',
      filter: null,
      clickable: false,
    },
    {
      label: 'Delivered',
      value: statusCounts.delivered ?? 0,
      hint: 'Completed',
      filter: 'delivered',
      clickable: true,
    },
    {
      label: 'Cancelled',
      value: statusCounts.cancelled ?? 0,
      hint: 'Not fulfilled',
      filter: 'cancelled',
      clickable: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-1">Orders</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">My orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalOrders} order{totalOrders !== 1 ? 's' : ''}
            {statusFilter
              ? ` · showing ${STATUS_CONFIG[statusFilter as StatusKey]?.label ?? statusFilter}`
              : ''}
          </p>
        </div>
        <Link href="/products" className="shrink-0 self-start sm:self-auto">
          <Button size="sm" className="rounded-full">
            <ShoppingBag className="h-3.5 w-3.5" />
            Continue shopping
          </Button>
        </Link>
      </header>

      {/* Summary cards */}
      <section aria-label="Order summary" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card, i) => {
          const isSelected = card.filter !== null && statusFilter === card.filter;
          const Wrapper = card.clickable ? 'button' : 'div';
          return (
          <Wrapper
            key={card.label}
            type={card.clickable ? 'button' : undefined}
            onClick={
              card.clickable && card.filter !== null
                ? () => handleFilterChange(card.filter!)
                : undefined
            }
            className={`text-left rounded-2xl border p-4 transition-all bg-card border-border ${
              card.clickable ? 'hover:border-accent/40 hover:shadow-sm cursor-pointer' : ''
            } ${isSelected ? 'ring-2 ring-accent/30 border-accent/40' : ''}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <p className="text-2xl font-bold tabular-nums text-foreground">{card.value}</p>
              <p className="text-sm font-medium text-foreground mt-1">{card.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.hint}</p>
            </motion.div>
          </Wrapper>
        );
        })}
      </section>

      {/* Toolbar: search + filters */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by order # or product name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-full bg-card"
            aria-label="Search orders"
          />
        </div>

        <div className="relative -mx-1 px-1">
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
            role="tablist"
            aria-label="Filter orders by status"
          >
            {FILTER_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = statusFilter === tab.value;
              const count = tab.value === '' ? totalOrders : statusCounts[tab.value];

              return (
                <button
                  key={tab.value || 'all'}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleFilterChange(tab.value)}
                  className={`inline-flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:border-accent/40 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {typeof count === 'number' && count > 0 && tab.value !== '' && (
                    <span
                      className={`ml-0.5 min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                        isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders list */}
      <section aria-label="Order list" aria-busy={isLoading || isFetching}>
        {isLoading ? (
          <ul className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="h-36 rounded-2xl bg-muted/50 animate-pulse border border-border/50" />
            ))}
          </ul>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-border bg-card px-6 py-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              {searchQuery ? (
                <Search className="h-7 w-7 text-muted-foreground/50" />
              ) : (
                <Package className="h-7 w-7 text-muted-foreground/50" />
              )}
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              {searchQuery
                ? 'No matching orders'
                : statusFilter
                  ? `No ${STATUS_CONFIG[statusFilter as StatusKey]?.label?.toLowerCase() ?? statusFilter} orders`
                  : 'No orders yet'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search term or clear filters.'
                : statusFilter
                  ? 'Orders with this status will appear here when available.'
                  : 'When you place an order, it will show up here with tracking and details.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {(searchQuery || statusFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setSearchQuery('');
                    handleFilterChange('');
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear filters
                </Button>
              )}
              {!statusFilter && !searchQuery && (
                <Link href="/products">
                  <Button size="sm" className="rounded-full">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Browse products
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        ) : (
          <>
            {isFetching && !isLoading && (
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Updating…
              </p>
            )}
            <ul className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order, idx) => (
                  <OrderCard key={order.id} order={order} index={idx} />
                ))}
              </AnimatePresence>
            </ul>

            {/* Pagination */}
            {!searchQuery && totalPages > 1 && (
              <nav
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                aria-label="Orders pagination"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full min-w-[7rem]"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                        aria-current={page === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full min-w-[7rem]"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </nav>
            )}

            {searchQuery && filteredOrders.length > 0 && (
              <p className="text-center text-xs text-muted-foreground pt-2">
                Showing {filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''} on this
                page · search is limited to loaded orders
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
