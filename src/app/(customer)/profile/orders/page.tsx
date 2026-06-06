'use client';

import { useState } from 'react';
import { useGetOrdersQuery } from '@/services/api/ordersApi';
import { Package, ChevronRight, CreditCard, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/redux/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ORDER_STATUS_CONFIG, ORDER_PROGRESS_STEPS } from '@/constants/order-status';

type ProgressStatusKey = typeof ORDER_PROGRESS_STEPS[number];

const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Payment pending', className: 'bg-amber-50 text-amber-800 border-amber-200/80' },
  failed:  { label: 'Payment failed',  className: 'bg-red-50 text-red-800 border-red-200/80' },
  refunded: { label: 'Refunded',       className: 'bg-muted text-muted-foreground border-border' },
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
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function OrderProgressBar({ status }: { status: string }) {
  const progressIdx = ORDER_PROGRESS_STEPS.indexOf(status as ProgressStatusKey);
  if (progressIdx < 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/80">
      <div className="flex items-center justify-between gap-1">
        {ORDER_PROGRESS_STEPS.map((step, i) => {
          const stepConfig = ORDER_STATUS_CONFIG[step];
          const StepIcon = stepConfig.icon;
          const isComplete = i <= progressIdx;
          const isCurrent = i === progressIdx;

          return (
            <div key={step} className="flex flex-1 items-center min-w-0">
              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                  isComplete
                    ? isCurrent ? 'bg-primary text-primary-foreground border-primary' : 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-muted text-muted-foreground/50 border-border'
                }`}>
                  <StepIcon className="h-3 w-3" />
                </div>
                <span className={`text-[9px] font-medium truncate w-full text-center hidden sm:block ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {stepConfig.label}
                </span>
              </div>
              {i < ORDER_PROGRESS_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-0.5 rounded-full mb-5 sm:mb-6 ${i < progressIdx ? 'bg-primary/40' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, index }: { order: Order; index: number }) {
  const statusCfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const items = getOrderItems(order);
  const itemCount = items.length;
  const primaryItem = items[0];
  const primaryImage = primaryItem?.productImage || primaryItem?.variant?.product?.media?.[0]?.url;
  const primaryName = primaryItem?.productName || primaryItem?.variant?.product?.name || 'Order items';

  const paymentBadge = order.paymentStatus && order.paymentStatus !== 'paid' ? PAYMENT_BADGE[order.paymentStatus] : null;
  const progressIdx = ORDER_PROGRESS_STEPS.indexOf(order.status as ProgressStatusKey);
  const isInProgress = progressIdx >= 0 && order.status !== 'delivered';

  const accentColor =
    order.status === 'delivered' ? 'bg-emerald-500' :
    order.status === 'cancelled' ? 'bg-red-400' :
    order.status === 'shipped' ? 'bg-violet-500' :
    order.status === 'out_for_delivery' ? 'bg-orange-400' :
    order.status === 'processing' ? 'bg-blue-500' :
    order.status === 'confirmed' ? 'bg-sky-500' :
    order.status === 'return_requested' ? 'bg-yellow-400' :
    order.status === 'returned' ? 'bg-slate-400' :
    'bg-amber-400';

  return (
    <motion.li initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.3 }}>
      <Link href={`/profile/orders/${order.id}`} className="block group">
        <article className="relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-accent/40 hover:shadow-md">
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />

          <div className="p-5 md:p-6 pl-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Thumbnail */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden border border-border/80">
                    {primaryImage
                      ? <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground/40" /></div>}
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
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.color}`}>
                    <StatusIcon className="h-2.5 w-2.5" />
                    {statusCfg.label}
                  </span>
                  {paymentBadge && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${paymentBadge.className}`}>
                      <CreditCard className="h-2.5 w-2.5" />
                      {paymentBadge.label}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-1">
                  {primaryName}
                  {itemCount > 1 && <span className="text-muted-foreground/80"> · +{itemCount - 1} more item{itemCount - 1 !== 1 ? 's' : ''}</span>}
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  Placed {formatOrderDate(order.createdAt)}
                  {order.paymentMethod && <span className="capitalize"> · {order.paymentMethod === 'online' ? 'Online payment' : 'Cash on delivery'}</span>}
                </p>

                {itemCount > 1 && (
                  <div className="flex gap-1.5 mt-3">
                    {items.slice(0, 5).map((item, i) => {
                      const image = item.productImage || item.variant?.product?.media?.[0]?.url;
                      return (
                        <div key={i} className="w-9 h-9 rounded-lg bg-muted overflow-hidden border border-border/80 shrink-0">
                          {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="h-3 w-3 text-muted-foreground/40" /></div>}
                        </div>
                      );
                    })}
                    {itemCount > 5 && <div className="w-9 h-9 rounded-lg bg-muted border border-border/80 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">+{itemCount - 5}</div>}
                  </div>
                )}

                {isInProgress && <OrderProgressBar status={order.status} />}
              </div>

              {/* Total + CTA */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:text-right shrink-0 sm:pl-2">
                <div>
                  <p className="text-lg font-bold text-foreground tabular-nums">₹{parseFloat(order.total).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-muted-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent opacity-80 group-hover:opacity-100 group-hover:gap-1.5 transition-all">
                  {isInProgress ? 'Track order' : 'View details'}
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
  const [page, setPage] = useState(1);

  const { data: ordersResponse, isLoading, isFetching } = useGetOrdersQuery(
    { page, limit: 8 },
    { skip: !isAuthenticated }
  );

  const orders = (ordersResponse as OrdersResponse | undefined)?.data || [];
  const pagination = (ordersResponse as OrdersResponse | undefined)?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-1">Orders</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">My orders</h1>
        </div>
        <Link href="/products" className="shrink-0 self-start sm:self-auto">
          <Button size="sm" className="rounded-full"><ShoppingBag className="h-3.5 w-3.5" />Continue shopping</Button>
        </Link>
      </header>

      {/* Orders list */}
      <section aria-label="Order list" aria-busy={isLoading || isFetching}>
        {isLoading ? (
          <ul className="space-y-4">
            {[...Array(4)].map((_, i) => <li key={i} className="h-36 rounded-2xl bg-muted/50 animate-pulse border border-border/50" />)}
          </ul>
        ) : orders.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">No orders yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              When you place an order, it will show up here with tracking and details.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/products"><Button size="sm" className="rounded-full"><ShoppingBag className="h-3.5 w-3.5" />Browse products</Button></Link>
            </div>
          </motion.div>
        ) : (
          <>
            {isFetching && !isLoading && (
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />Updating…
              </p>
            )}
            <ul className="space-y-4">
              <AnimatePresence mode="popLayout">
                {orders.map((order, idx) => <OrderCard key={order.id} order={order} index={idx} />)}
              </AnimatePresence>
            </ul>

            {totalPages > 1 && (
              <nav className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4" aria-label="Orders pagination">
                <Button variant="outline" size="sm" className="rounded-full min-w-28" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <button key={pageNum} type="button" onClick={() => setPage(pageNum)}
                        className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${page === pageNum ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                        aria-current={page === pageNum ? 'page' : undefined}>
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" className="rounded-full min-w-28" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
