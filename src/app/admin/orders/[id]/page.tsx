'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetOrderByIdAdminQuery,
  useUpdateOrderStatusMutation,
  useUpdatePaymentStatusMutation,
  useProcessReturnMutation,
} from '@/services/api/ordersApi';
import { useGetPaymentByOrderIdQuery, useRefundPaymentMutation } from '@/services/api/paymentsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Package, Clock, Truck, CheckCircle, XCircle,
  MapPin, CreditCard, Banknote, User, Mail, Calendar,
  Hash, ImageOff, Loader2, AlertCircle, Copy, ChevronRight,
  AlertTriangle, ShieldCheck, RotateCcw, RefreshCw,
  CheckCircle2, ArrowLeftCircle,
} from 'lucide-react';
import Link from 'next/link';
import { ORDER_STATUS_CONFIG, ORDER_PROGRESS_STEPS } from '@/constants/order-status';

// ─── motion variants ──────────────────────────────────────────────────────────
const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } };

const PAYMENT_STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: 'Unpaid',   color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/40',  border: 'border-amber-200 dark:border-amber-900' },
  paid:     { label: 'Paid',     color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950/40',  border: 'border-green-200 dark:border-green-900' },
  failed:   { label: 'Failed',   color: 'text-red-700 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-950/40',    border: 'border-red-200 dark:border-red-900' },
  refunded: { label: 'Refunded', color: 'text-slate-600 dark:text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800/40',  border: 'border-slate-200 dark:border-slate-700' },
};

const PAYMENT_ATTEMPT_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  created:    { label: 'Initiated',  color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/40',  icon: Clock },
  failed:     { label: 'Failed',     color: 'text-red-700 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-950/40',    icon: XCircle },
  captured:   { label: 'Captured',   color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950/40',  icon: ShieldCheck },
  authorized: { label: 'Authorized', color: 'text-blue-700 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/40',   icon: ShieldCheck },
  refunded:   { label: 'Refunded',   color: 'text-slate-600 dark:text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800/40',  icon: RotateCcw },
};

// Allowed next statuses per current (admin)
const VALID_NEXT: Record<string, string[]> = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['shipped', 'cancelled'],
  shipped:          ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
  return_requested: ['returned', 'delivered'],
  returned:         [],
};

function fmt(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function hoursUntilExpiry(dateStr?: string) {
  if (!dateStr) return null;
  const expiry = new Date(dateStr).getTime() + 24 * 60 * 60 * 1000;
  const remaining = expiry - Date.now();
  if (remaining <= 0) return null;
  const h = Math.floor(remaining / (1000 * 60 * 60));
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

function methodLabel(method?: string) {
  const map: Record<string, string> = { card: 'Card', upi: 'UPI', netbanking: 'Net Banking', wallet: 'Wallet', emi: 'EMI', cod: 'Cash on Delivery' };
  return method ? (map[method] ?? method) : '—';
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-1.5 p-1 rounded hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
      title="Copy to clipboard"
      aria-label={copied ? 'Copied to clipboard' : `Copy ${text} to clipboard`}
    >
      <AnimatePresence mode="wait">
        {copied
          ? <motion.span key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-green-600 text-[10px] font-semibold">Copied</motion.span>
          : <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Copy className="h-3 w-3 text-muted-foreground" aria-hidden="true" /></motion.span>}
      </AnimatePresence>
    </button>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const orderId = parseInt(id as string);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [pendingStatus, setPendingStatus] = useState('');

  const { data: orderResponse, isLoading, error } = useGetOrderByIdAdminQuery(orderId);
  const { data: paymentResponse } = useGetPaymentByOrderIdQuery(orderId);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();
  const [refundPayment] = useRefundPaymentMutation();
  const [processReturn] = useProcessReturnMutation();

  interface Addr { label?: string; street?: string; addressLine1?: string; city?: string; state?: string; pincode?: string; zipCode?: string; country?: string; }
  interface OrderItem { id?: number; productImage?: string; productName?: string; price?: string; quantity?: number; size?: string; variant?: { product?: { slug?: string; name?: string } } }
  interface OrderData {
    id?: number; status?: string; paymentStatus?: string; paymentMethod?: string;
    total?: string; subtotal?: string; discount?: string; shipping?: string; tax?: string;
    createdAt?: string; updatedAt?: string; shippedAt?: string; deliveredAt?: string; returnRequestedAt?: string;
    trackingNumber?: string; cancellationReason?: string;
    user?: { name?: string; email?: string };
    address?: Addr; shippingAddress?: Addr;
    items?: OrderItem[]; orderItems?: OrderItem[];
    coupon?: { code?: string };
  }
  interface Payment {
    id?: number; status?: string; amount?: string | number;
    razorpayOrderId?: string; razorpayPaymentId?: string;
    method?: string; currency?: string; createdAt?: string; updatedAt?: string;
  }

  const order: OrderData = (orderResponse as { data?: OrderData } | undefined)?.data ?? (orderResponse as OrderData) ?? {};
  const payment: Payment | null = (paymentResponse as { data?: Payment } | undefined)?.data ?? (paymentResponse as Payment) ?? null;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === order?.status) return;
    setUpdatingStatus(true);
    try {
      await updateOrderStatus({
        id: orderId, status: newStatus, isAdmin: true,
        trackingNumber: newStatus === 'shipped' ? trackingInput || undefined : undefined,
      }).unwrap();
      setTrackingInput('');
      setPendingStatus('');
    } catch {}
    finally { setUpdatingStatus(false); }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (newStatus === order?.paymentStatus) return;
    setUpdatingPayment(true);
    try { await updatePaymentStatus({ id: orderId, paymentStatus: newStatus, isAdmin: true }).unwrap(); } catch {}
    finally { setUpdatingPayment(false); }
  };

  const handleRefund = async () => {
    if (!confirm('Issue a full refund for this order? This cannot be undone.')) return;
    setRefunding(true);
    try { await refundPayment({ orderId }).unwrap(); } catch {}
    finally { setRefunding(false); }
  };

  const handleProcessReturn = async (approve: boolean) => {
    if (!confirm(approve ? 'Approve this return? A refund will be initiated.' : 'Reject this return request?')) return;
    setProcessingReturn(true);
    try { await processReturn({ id: orderId, approve }).unwrap(); } catch {}
    finally { setProcessingReturn(false); }
  };

  if (isLoading) return <OrderDetailSkeleton />;

  if (error || !order?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Order not found</h2>
        <p className="text-muted-foreground mb-6 max-w-sm text-sm">This order doesn&apos;t exist or you don&apos;t have permission to view it.</p>
        <Link href="/admin/orders"><Button className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Orders</Button></Link>
      </div>
    );
  }

  const statusCfg = ORDER_STATUS_CONFIG[order.status!] ?? ORDER_STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const payCfg = PAYMENT_STATUS_CFG[order.paymentStatus!] ?? PAYMENT_STATUS_CFG.pending;

  // Progress tracker index
  const progressIdx = ORDER_PROGRESS_STEPS.indexOf(order.status as typeof ORDER_PROGRESS_STEPS[number]);
  const isProgressStatus = progressIdx >= 0;

  const addr: Addr = order.address ?? order.shippingAddress ?? {};
  const items: OrderItem[] = order.items ?? order.orderItems ?? [];
  const customer = order.user ?? {};
  const subtotal = items.reduce((s, i) => s + parseFloat(i.price ?? '0') * (i.quantity ?? 0), 0);

  const isOnline = order.paymentMethod === 'online';
  const isUrgent = isOnline && order.paymentStatus === 'pending' && order.status !== 'cancelled';
  const timeLeft = isUrgent ? hoursUntilExpiry(order.createdAt) : null;
  const payAttemptCfg = payment?.status ? (PAYMENT_ATTEMPT_CFG[payment.status] ?? PAYMENT_ATTEMPT_CFG.created) : null;
  const PayAttemptIcon = payAttemptCfg?.icon;

  const nextStatuses = VALID_NEXT[order.status ?? 'pending'] ?? [];
  const isReturnRequested = order.status === 'return_requested';
  const showShippingInput = (pendingStatus === 'shipped') || (nextStatuses.includes('shipped') && !pendingStatus);

  return (
    <motion.div initial="hidden" animate="visible" variants={container} className="space-y-5">

      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/orders" aria-label="Back to all orders">
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold tracking-tight truncate">Order #{order.id}</h1>
              <CopyButton text={`#${order.id}`} />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
              Placed {fmt(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:shrink-0" role="status" aria-label="Order status">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${payCfg.bg} ${payCfg.color} ${payCfg.border}`}>
            <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />{payCfg.label}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color}`}>
            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />{statusCfg.label}
          </span>
        </div>
      </motion.div>

      {/* Urgency banner */}
      {isUrgent && (
        <motion.div variants={item} role="alert" className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm dark:bg-amber-950/30 dark:border-amber-900">
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/50 shrink-0">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Awaiting customer payment</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
              This online order has not been paid.
              {timeLeft ? <> Auto-cancels in <strong className="font-semibold">{timeLeft}</strong>.</> : ' It may auto-cancel soon.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Return request banner */}
      {isReturnRequested && (
        <motion.div variants={item} role="alert" className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm dark:bg-yellow-950/30 dark:border-yellow-900">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-yellow-100 dark:bg-yellow-950/50 shrink-0">
              <RotateCcw className="h-4.5 w-4.5 text-yellow-600" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">Return requested</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5 leading-relaxed">
                Customer requested a return on {fmt(order.returnRequestedAt)}.
                {order.cancellationReason && <> Reason: <span className="italic">&ldquo;{order.cancellationReason}&rdquo;</span></>}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 sm:pl-2">
            <Button size="sm" disabled={processingReturn} onClick={() => handleProcessReturn(true)}
              className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none">
              {processingReturn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Approve
            </Button>
            <Button size="sm" variant="outline" disabled={processingReturn} onClick={() => handleProcessReturn(false)}
              className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 flex-1 sm:flex-none">
              <XCircle className="h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        </motion.div>
      )}

      {/* Progress tracker */}
      {isProgressStatus && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-5 sm:p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">Fulfillment Progress</p>
              <div className="flex items-start justify-between relative" role="list" aria-label="Order fulfillment progress">
                <div className="absolute inset-x-0 top-4 h-0.5 bg-muted rounded-full" aria-hidden="true" />
                <motion.div
                  className="absolute left-0 top-4 h-0.5 bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: progressIdx >= 0 ? `${(progressIdx / (ORDER_PROGRESS_STEPS.length - 1)) * 100}%` : '0%' }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden="true"
                />
                {ORDER_PROGRESS_STEPS.map((step, idx) => {
                  const cfg = ORDER_STATUS_CONFIG[step];
                  const Icon = cfg.icon;
                  const done = progressIdx >= idx;
                  const current = progressIdx === idx;
                  return (
                    <div key={step} role="listitem" aria-current={current ? 'step' : undefined}
                      className="flex flex-col items-center gap-2 z-10 relative flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        done
                          ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30'
                          : 'border-muted-foreground/20 bg-background text-muted-foreground'
                      } ${current ? 'ring-4 ring-primary/15' : ''}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className={`text-[10px] font-medium hidden sm:block text-center leading-tight max-w-[72px] transition-colors ${done ? 'text-primary' : 'text-muted-foreground'}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Body grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* LEFT: items + summary */}
        <div className="lg:col-span-2 space-y-5">

          {/* Order items */}
          <motion.div variants={item}>
            <Card className="overflow-hidden">
              <CardHeader className="py-3 px-5 bg-muted/30 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Order Items <span className="text-muted-foreground font-normal">({items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                      <Package className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No items found for this order</p>
                  </div>
                ) : items.map((it, idx) => (
                  <motion.div key={it.id ?? idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                    className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 hover:bg-muted/20 transition-colors group">
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border">
                      {it.productImage
                        ? <img src={it.productImage} alt={it.productName ?? 'Product image'} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                        : <ImageOff className="h-5 w-5 text-muted-foreground/40" aria-hidden="true" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${it.variant?.product?.slug ?? '#'}`} target="_blank" className="inline-block max-w-full">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{it.productName ?? it.variant?.product?.name}</p>
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-muted rounded text-[11px] font-medium text-muted-foreground">Qty: {it.quantity}</span>
                        {it.size && <span className="px-2 py-0.5 bg-muted rounded text-[11px] font-medium text-muted-foreground">Size: {it.size}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm tabular-nums">₹{(parseFloat(it.price ?? '0') * (it.quantity ?? 0)).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">₹{parseFloat(it.price ?? '0').toLocaleString('en-IN')} each</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Order summary */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="py-3 px-5 bg-muted/30 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Hash className="h-4 w-4 text-primary" />Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-sm tabular-nums">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  <span className="font-medium">₹{parseFloat(order.subtotal ?? String(subtotal)).toLocaleString('en-IN')}</span>
                </div>
                {parseFloat(order.discount ?? '0') > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-2">
                      {order.coupon?.code && <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300 rounded text-xs font-medium">{order.coupon.code}</span>}
                      Coupon discount
                    </span>
                    <span className="font-medium">–₹{parseFloat(order.discount!).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  {parseFloat(order.shipping ?? '0') === 0
                    ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/40 dark:border-green-900 h-5 text-[11px]">Free</Badge>
                    : <span className="font-medium">₹{parseFloat(order.shipping!).toLocaleString('en-IN')}</span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">₹{parseFloat(order.tax ?? '0').toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-baseline">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">₹{parseFloat(order.total ?? '0').toLocaleString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Customer + Address — side by side */}
          <motion.div variants={item} className="grid sm:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="py-3 px-5 bg-muted/30 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" />Customer</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <span className="text-base font-bold text-primary">{customer.name?.charAt(0).toUpperCase() ?? '?'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{customer.name ?? 'Unknown customer'}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{customer.email ?? '—'}</span>
                    </div>
                  </div>
                </div>
                <Link href={`/admin/users?search=${customer.email ?? ''}`} className="block">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-xs group">
                    View Profile <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-5 bg-muted/30 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-1.5 text-sm">
                {(addr.street || addr.addressLine1) ? (
                  <>
                    {addr.label && <Badge variant="secondary" className="mb-1 capitalize text-xs">{addr.label}</Badge>}
                    <p className="font-medium leading-snug">{addr.street ?? addr.addressLine1}</p>
                    <p className="text-muted-foreground leading-snug">{[addr.city, addr.state].filter(Boolean).join(', ')}{(addr.pincode ?? addr.zipCode) ? ` – ${addr.pincode ?? addr.zipCode}` : ''}</p>
                    {addr.country && <p className="text-muted-foreground leading-snug">{addr.country}</p>}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground py-1">No shipping address on file for this order.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment activity (mobile) */}
          <motion.div variants={item} className="lg:hidden">
            <PaymentActivityCard order={order} payment={payment} payAttemptCfg={payAttemptCfg} PayAttemptIcon={PayAttemptIcon} isOnline={isOnline} refunding={refunding} onRefund={handleRefund} />
          </motion.div>
        </div>

        {/* RIGHT: sidebar */}
        <div className="space-y-5">

          {/* Order management */}
          <motion.div variants={item}>
            <Card className="border-primary/10">
              <CardHeader className="py-3 px-5 bg-primary/5 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary" />Order Management</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">

                {/* Current status — at-a-glance */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">Current status</p>
                    <span className={`inline-flex items-center gap-1.5 mt-1 text-sm font-semibold ${statusCfg.color}`}>
                      <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} aria-hidden="true" />
                      {statusCfg.label}
                    </span>
                  </div>
                  <StatusIcon className={`h-7 w-7 opacity-20 ${statusCfg.color}`} aria-hidden="true" />
                </div>

                {/* Fulfillment controls */}
                {nextStatuses.length > 0 ? (
                  <div className="space-y-3.5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Update fulfillment</p>

                    {/* Tracking number input when shipping */}
                    {nextStatuses.includes('shipped') && (
                      <div className="space-y-1.5">
                        <label htmlFor="tracking-input" className="text-xs font-medium text-muted-foreground">Tracking Number (optional)</label>
                        <input
                          id="tracking-input"
                          type="text"
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          placeholder="e.g. DELHIVERY1234567"
                          className="w-full h-9 border border-border rounded-md px-3 text-sm bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
                        />
                      </div>
                    )}

                    {/* Status select */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Move to status</label>
                      <Select value={pendingStatus || order.status} onValueChange={setPendingStatus} disabled={updatingStatus}>
                        <SelectTrigger className="h-9 text-sm" aria-label="Select next order status">
                          <SelectValue />
                          {updatingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin ml-2 text-muted-foreground" />}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={order.status!}>
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${ORDER_STATUS_CONFIG[order.status!]?.dot ?? 'bg-gray-400'}`} />
                              {ORDER_STATUS_CONFIG[order.status!]?.label ?? order.status} <span className="text-muted-foreground">(current)</span>
                            </span>
                          </SelectItem>
                          {nextStatuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${ORDER_STATUS_CONFIG[s]?.dot ?? 'bg-gray-400'}`} />
                                {ORDER_STATUS_CONFIG[s]?.label ?? s}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="w-full h-9 text-sm font-medium"
                      onClick={() => handleStatusChange(pendingStatus || order.status!)}
                      disabled={updatingStatus || !pendingStatus || pendingStatus === order.status}
                    >
                      {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {updatingStatus ? 'Updating…' : 'Update Status'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30 border border-dashed">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This order is in a terminal state (<span className="font-medium text-foreground">{ORDER_STATUS_CONFIG[order.status!]?.label ?? order.status}</span>).
                      No further status changes are available.
                    </p>
                  </div>
                )}

                {/* Tracking number display */}
                {order.trackingNumber && (
                  <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border">
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">Tracking number</p>
                      <p className="text-sm font-mono font-medium truncate">{order.trackingNumber}</p>
                    </div>
                    <CopyButton text={order.trackingNumber} />
                  </div>
                )}

                <div className="border-t pt-4 space-y-3.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Payment</p>

                  {/* Payment status select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Payment Status</label>
                    <Select value={order.paymentStatus} onValueChange={handlePaymentStatusChange} disabled={updatingPayment}>
                      <SelectTrigger className="h-9 text-sm" aria-label="Select payment status">
                        <SelectValue />
                        {updatingPayment && <Loader2 className="h-3.5 w-3.5 animate-spin ml-2 text-muted-foreground" />}
                      </SelectTrigger>
                      <SelectContent>
                        {['pending', 'paid', 'failed', 'refunded'].map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className="flex items-center gap-2 capitalize">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s === 'pending' ? '#f59e0b' : s === 'paid' ? '#22c55e' : s === 'failed' ? '#ef4444' : '#94a3b8' }} />
                              {PAYMENT_STATUS_CFG[s]?.label ?? s}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Refund button */}
                  {payment?.status === 'captured' && order.paymentStatus !== 'refunded' && (
                    <button onClick={handleRefund} disabled={refunding}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border border-red-200 dark:border-red-900 text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1">
                      {refunding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      {refunding ? 'Processing refund…' : 'Issue Full Refund'}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment activity — desktop */}
          <motion.div variants={item} className="hidden lg:block">
            <PaymentActivityCard order={order} payment={payment} payAttemptCfg={payAttemptCfg} PayAttemptIcon={PayAttemptIcon} isOnline={isOnline} refunding={refunding} onRefund={handleRefund} />
          </motion.div>

          {/* Timeline */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="py-3 px-5 bg-muted/30 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pb-1.5">
                <ol className="relative border-l-2 border-border/70 space-y-5 ml-2">
                  <TimelineEvent icon={<Package className="h-3.5 w-3.5" />} label="Order placed" date={order.createdAt} color="bg-primary" />
                  {payment?.createdAt && isOnline && (
                    <TimelineEvent icon={<CreditCard className="h-3.5 w-3.5" />} label="Payment session created" date={payment.createdAt} color="bg-amber-400" />
                  )}
                  {payment?.status === 'captured' && payment.updatedAt && (
                    <TimelineEvent icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Payment captured" date={payment.updatedAt} color="bg-green-500" />
                  )}
                  {order.shippedAt && (
                    <TimelineEvent icon={<Truck className="h-3.5 w-3.5" />} label={`Shipped${order.trackingNumber ? ` · ${order.trackingNumber}` : ''}`} date={order.shippedAt} color="bg-violet-400" />
                  )}
                  {order.deliveredAt && (
                    <TimelineEvent icon={<CheckCircle className="h-3.5 w-3.5" />} label="Delivered" date={order.deliveredAt} color="bg-green-500" />
                  )}
                  {order.returnRequestedAt && (
                    <TimelineEvent icon={<RotateCcw className="h-3.5 w-3.5" />} label="Return requested" date={order.returnRequestedAt} color="bg-yellow-400" />
                  )}
                  {payment?.status === 'refunded' && payment.updatedAt && (
                    <TimelineEvent icon={<RotateCcw className="h-3.5 w-3.5" />} label="Payment refunded" date={payment.updatedAt} color="bg-slate-400" />
                  )}
                  {order.status === 'cancelled' && order.updatedAt && (
                    <TimelineEvent icon={<XCircle className="h-3.5 w-3.5" />} label={`Cancelled${order.cancellationReason ? ` · ${order.cancellationReason}` : ''}`} date={order.updatedAt} color="bg-red-400" />
                  )}
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Payment Activity Card ─────────────────────────────────────────────────────
function PaymentActivityCard({ order, payment, payAttemptCfg, PayAttemptIcon, isOnline, refunding, onRefund }: {
  order: { paymentMethod?: string; paymentStatus?: string; status?: string; createdAt?: string; id?: number };
  payment: { id?: number; status?: string; amount?: string | number; razorpayOrderId?: string; razorpayPaymentId?: string; method?: string; currency?: string; createdAt?: string; updatedAt?: string } | null;
  payAttemptCfg: { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> } | null;
  PayAttemptIcon: React.ComponentType<{ className?: string }> | undefined;
  isOnline: boolean;
  refunding: boolean;
  onRefund: () => void;
}) {
  const isUrgent = isOnline && order.paymentStatus === 'pending' && order.status !== 'cancelled';
  const timeLeft = isUrgent ? hoursUntilExpiry(order.createdAt) : null;

  return (
    <Card className={isUrgent ? 'border-amber-200 dark:border-amber-900' : ''}>
      <CardHeader className={`py-3 px-5 border-b ${isUrgent ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-muted/30'}`}>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {isOnline ? <CreditCard className={`h-4 w-4 ${isUrgent ? 'text-amber-600' : 'text-primary'}`} /> : <Banknote className="h-4 w-4 text-primary" />}
          Payment Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {!isOnline && (
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-background border shrink-0">
              <Banknote className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium text-sm">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground">Collect payment on delivery</p>
            </div>
          </div>
        )}
        {isOnline && !payment && (
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />No payment session started yet
          </div>
        )}
        {isOnline && payment && (
          <>
            {payAttemptCfg && PayAttemptIcon && (
              <div className={`flex items-center gap-3 p-3 rounded-lg border border-transparent ${payAttemptCfg.bg}`}>
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-background/60 shrink-0">
                  <PayAttemptIcon className={`h-4.5 w-4.5 ${payAttemptCfg.color}`} aria-hidden="true" />
                </span>
                <div>
                  <p className={`font-semibold text-sm ${payAttemptCfg.color}`}>{payAttemptCfg.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.status === 'captured' ? 'Payment successfully received' : payment.status === 'failed' ? 'Last attempt failed — customer can retry' : payment.status === 'created' ? 'Session open, awaiting customer' : payment.status === 'refunded' ? 'Amount returned to customer' : ''}
                  </p>
                </div>
              </div>
            )}
            {isUrgent && timeLeft && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Auto-cancels in <strong className="font-semibold">{timeLeft}</strong> if unpaid
              </div>
            )}
            <div className="space-y-2.5 text-sm pt-1">
              <DetailRow label="Amount"><span className="font-semibold tabular-nums">₹{parseFloat(String(payment.amount ?? 0)).toLocaleString('en-IN')}</span></DetailRow>
              {payment.razorpayOrderId && (
                <DetailRow label="Razorpay Order">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[150px]" title={payment.razorpayOrderId}>{payment.razorpayOrderId}</span>
                  <CopyButton text={payment.razorpayOrderId} />
                </DetailRow>
              )}
              {payment.razorpayPaymentId && (
                <DetailRow label="Payment ID">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[150px]" title={payment.razorpayPaymentId}>{payment.razorpayPaymentId}</span>
                  <CopyButton text={payment.razorpayPaymentId} />
                </DetailRow>
              )}
              {payment.method && <DetailRow label="Method"><span className="capitalize font-medium">{methodLabel(payment.method)}</span></DetailRow>}
              {payment.createdAt && <DetailRow label="Initiated"><span className="text-muted-foreground">{fmt(payment.createdAt)}</span></DetailRow>}
              {payment.status === 'captured' && payment.updatedAt && <DetailRow label="Captured"><span className="text-green-700 font-medium">{fmt(payment.updatedAt)}</span></DetailRow>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1 min-w-0">{children}</div>
    </div>
  );
}

function TimelineEvent({ icon, label, date, color }: { icon: React.ReactNode; label: string; date?: string; color: string }) {
  return (
    <li className="ml-5 relative pb-0.5">
      <span className={`absolute left-[-1.69rem] flex items-center justify-center w-6 h-6 rounded-full text-white ring-4 ring-background ${color}`} aria-hidden="true">{icon}</span>
      <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{fmt(date)}</p>
    </li>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading order details">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-36 rounded bg-muted animate-pulse" />
            <div className="h-3 w-28 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="hidden sm:flex gap-2">
          <div className="h-7 w-20 rounded-full bg-muted animate-pulse" />
          <div className="h-7 w-24 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
      <div className="h-28 rounded-xl bg-muted animate-pulse" />
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
          <div className="h-44 rounded-xl bg-muted animate-pulse" />
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="h-44 rounded-xl bg-muted animate-pulse" />
            <div className="h-44 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
        <div className="space-y-5">
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
          <div className="h-56 rounded-xl bg-muted animate-pulse" />
          <div className="h-44 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
