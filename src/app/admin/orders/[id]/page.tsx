'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetOrderByIdAdminQuery,
  useUpdateOrderStatusMutation,
  useUpdatePaymentStatusMutation,
} from '@/services/api/ordersApi';
import { useGetPaymentByOrderIdQuery } from '@/services/api/paymentsApi';
import { useRefundPaymentMutation } from '@/services/api/paymentsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Package, Clock, Truck, CheckCircle, XCircle,
  MapPin, CreditCard, Banknote, User, Mail, Calendar,
  Hash, ImageOff, Loader2, AlertCircle, Copy, ChevronRight,
  AlertTriangle, ShieldCheck, RotateCcw, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

// ─── motion variants ──────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

// ─── config ──────────────────────────────────────────────────────────────────
const ORDER_STEPS = ['pending', 'processing', 'shipped', 'delivered'] as const;

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; ring: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:    { label: 'Pending',    color: 'text-amber-700',  bg: 'bg-amber-50',  ring: 'ring-amber-200',  icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-700',   bg: 'bg-blue-50',   ring: 'ring-blue-200',   icon: Package },
  shipped:    { label: 'Shipped',    color: 'text-violet-700', bg: 'bg-violet-50', ring: 'ring-violet-200', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-50',  ring: 'ring-green-200',  icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-50',    ring: 'ring-red-200',    icon: XCircle },
};

const PAYMENT_STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: 'Unpaid',    color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  paid:     { label: 'Paid',      color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  failed:   { label: 'Failed',    color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  refunded: { label: 'Refunded',  color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-200' },
};

const PAYMENT_ATTEMPT_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  created:    { label: 'Initiated',  color: 'text-amber-700',  bg: 'bg-amber-50',  icon: Clock },
  failed:     { label: 'Failed',     color: 'text-red-700',    bg: 'bg-red-50',    icon: XCircle },
  captured:   { label: 'Captured',   color: 'text-green-700',  bg: 'bg-green-50',  icon: ShieldCheck },
  authorized: { label: 'Authorized', color: 'text-blue-700',   bg: 'bg-blue-50',   icon: ShieldCheck },
  refunded:   { label: 'Refunded',   color: 'text-slate-600',  bg: 'bg-slate-50',  icon: RotateCcw },
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-1.5 p-1 rounded hover:bg-muted transition-colors"
      title="Copy"
    >
      <AnimatePresence mode="wait">
        {copied
          ? <motion.span key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-green-600 text-[10px] font-semibold">Copied</motion.span>
          : <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Copy className="h-3 w-3 text-muted-foreground" /></motion.span>}
      </AnimatePresence>
    </button>
  );
}

function fmt(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
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
  if (!method) return '—';
  const map: Record<string, string> = {
    card: 'Card', upi: 'UPI', netbanking: 'Net Banking',
    wallet: 'Wallet', emi: 'EMI', cod: 'Cash on Delivery',
  };
  return map[method] ?? method;
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const orderId = parseInt(id as string);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const { data: orderResponse, isLoading, error } = useGetOrderByIdAdminQuery(orderId);
  const { data: paymentResponse } = useGetPaymentByOrderIdQuery(orderId);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();
  const [refundPayment] = useRefundPaymentMutation();

  interface Addr { label?: string; street?: string; addressLine1?: string; city?: string; state?: string; pincode?: string; zipCode?: string; country?: string; phone?: string; }
  interface OrderItem { id?: number; productImage?: string; productName?: string; price?: string; quantity?: number; size?: string; variant?: { product?: { slug?: string; name?: string } } }
  interface OrderData {
    id?: number; status?: string; paymentStatus?: string; paymentMethod?: string;
    total?: string; subtotal?: string; discount?: string; shipping?: string; tax?: string; createdAt?: string; updatedAt?: string;
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
    try { await updateOrderStatus({ id: orderId, status: newStatus, isAdmin: true }).unwrap(); } catch {} finally { setUpdatingStatus(false); }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (newStatus === order?.paymentStatus) return;
    setUpdatingPayment(true);
    try { await updatePaymentStatus({ id: orderId, paymentStatus: newStatus, isAdmin: true }).unwrap(); } catch {} finally { setUpdatingPayment(false); }
  };

  const handleRefund = async () => {
    if (!confirm('Issue a full refund for this order? This cannot be undone.')) return;
    setRefunding(true);
    try { await refundPayment({ orderId }).unwrap(); } catch {} finally { setRefunding(false); }
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

  const statusCfg = STATUS_CFG[order.status!] ?? STATUS_CFG.pending;
  const StatusIcon = statusCfg.icon;
  const payCfg = PAYMENT_STATUS_CFG[order.paymentStatus!] ?? PAYMENT_STATUS_CFG.pending;
  const currentStep = ORDER_STEPS.indexOf(order.status as typeof ORDER_STEPS[number]);
  const addr: Addr = order.address ?? order.shippingAddress ?? {};
  const items: OrderItem[] = order.items ?? order.orderItems ?? [];
  const customer = order.user ?? {};
  const subtotal = items.reduce((s, i) => s + parseFloat(i.price ?? '0') * (i.quantity ?? 0), 0);

  const isOnline = order.paymentMethod === 'online';
  const isUrgent = isOnline && order.paymentStatus === 'pending' && order.status !== 'cancelled';
  const timeLeft = isUrgent ? hoursUntilExpiry(order.createdAt) : null;
  const payAttemptCfg = payment?.status ? (PAYMENT_ATTEMPT_CFG[payment.status] ?? PAYMENT_ATTEMPT_CFG.created) : null;
  const PayAttemptIcon = payAttemptCfg?.icon;

  return (
    <motion.div initial="hidden" animate="visible" variants={container} className="space-y-5">

      {/* ── Header ── */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Order #{order.id}</h1>
              <CopyButton text={`#${order.id}`} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Placed {fmt(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Payment status chip */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${payCfg.bg} ${payCfg.color} ${payCfg.border}`}>
            <CreditCard className="h-3.5 w-3.5" />
            {payCfg.label}
          </span>
          {/* Order status chip */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusCfg.label}
          </span>
        </div>
      </motion.div>

      {/* ── Urgency banner ── */}
      {isUrgent && (
        <motion.div variants={item} className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">Awaiting customer payment</p>
            <p className="text-xs text-amber-700 mt-0.5">
              This online order has not been paid.
              {timeLeft ? ` Auto-cancels in ${timeLeft}.` : ' It may auto-cancel soon.'}
              {' '}The customer can retry payment from their order detail page.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Progress tracker ── */}
      {order.status !== 'cancelled' && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">Fulfillment Progress</p>
              <div className="flex items-center justify-between relative">
                <div className="absolute inset-x-0 top-4 h-0.5 bg-muted rounded-full" />
                <motion.div
                  className="absolute left-0 top-4 h-0.5 bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: currentStep >= 0 ? `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%` : '0%' }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
                {ORDER_STEPS.map((step, idx) => {
                  const cfg = STATUS_CFG[step];
                  const Icon = cfg.icon;
                  const done = currentStep >= idx;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 z-10 relative">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/20 bg-background text-muted-foreground'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-[11px] font-medium hidden sm:block ${done ? 'text-primary' : 'text-muted-foreground'}`}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Body grid ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── LEFT: items + summary ── */}
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
                {items.map((it, idx) => (
                  <motion.div
                    key={it.id ?? idx}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border">
                      {it.productImage
                        ? <img src={it.productImage} alt={it.productName} className="object-cover w-full h-full" />
                        : <ImageOff className="h-5 w-5 text-muted-foreground/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${it.variant?.product?.slug ?? '#'}`} target="_blank">
                        <p className="font-medium text-sm hover:text-primary transition-colors truncate">{it.productName ?? it.variant?.product?.name}</p>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-muted rounded text-xs">Qty: {it.quantity}</span>
                        {it.size && <span className="px-2 py-0.5 bg-muted rounded text-xs">Size: {it.size}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">₹{(parseFloat(it.price ?? '0') * (it.quantity ?? 0)).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-muted-foreground">₹{parseFloat(it.price ?? '0').toLocaleString('en-IN')} each</p>
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
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                  <span>₹{parseFloat(order.subtotal ?? String(subtotal)).toLocaleString('en-IN')}</span>
                </div>
                {parseFloat(order.discount ?? '0') > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-2">
                      {order.coupon?.code && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">{order.coupon.code}</span>}
                      Coupon discount
                    </span>
                    <span>–₹{parseFloat(order.discount!).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  {parseFloat(order.shipping ?? '0') === 0 ? (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 h-5 text-[11px]">Free</Badge>
                  ) : (
                    <span>₹{parseFloat(order.shipping!).toLocaleString('en-IN')}</span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{parseFloat(order.tax ?? '0').toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-baseline">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">₹{parseFloat(order.total ?? '0').toLocaleString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment activity — full detail (shown under items on mobile, sidebar on desktop is repeated) */}
          <motion.div variants={item} className="lg:hidden">
            <PaymentActivityCard
              order={order}
              payment={payment}
              payAttemptCfg={payAttemptCfg}
              PayAttemptIcon={PayAttemptIcon}
              isOnline={isOnline}
              refunding={refunding}
              onRefund={handleRefund}
            />
          </motion.div>
        </div>

        {/* ── RIGHT: sidebar ── */}
        <div className="space-y-5">

          {/* Order management */}
          <motion.div variants={item}>
            <Card className="border-primary/10">
              <CardHeader className="py-3 px-5 bg-primary/5 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Order Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Quick status buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {ORDER_STEPS.map((step) => {
                    const isActive = order.status === step;
                    const Icon = STATUS_CFG[step].icon;
                    return (
                      <button
                        key={step}
                        onClick={() => handleStatusChange(step)}
                        disabled={updatingStatus || order.status === 'cancelled' || order.status === 'delivered'}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed capitalize
                          ${isActive ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background border-border hover:bg-muted'}`}
                      >
                        <Icon className="h-3 w-3 shrink-0" />{step}
                      </button>
                    );
                  })}
                </div>

                {/* Order status select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Order Status</label>
                  <Select value={order.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                      {updatingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin ml-2 text-muted-foreground" />}
                    </SelectTrigger>
                    <SelectContent>
                      {[...ORDER_STEPS, 'cancelled'].map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className="flex items-center gap-2 capitalize">
                            <span className="w-2 h-2 rounded-full" style={{
                              backgroundColor: s === 'pending' ? '#f59e0b' : s === 'processing' ? '#3b82f6' : s === 'shipped' ? '#8b5cf6' : s === 'delivered' ? '#22c55e' : '#ef4444'
                            }} />
                            {s}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment status select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Payment Status</label>
                  <Select value={order.paymentStatus} onValueChange={handlePaymentStatusChange} disabled={updatingPayment}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                      {updatingPayment && <Loader2 className="h-3.5 w-3.5 animate-spin ml-2 text-muted-foreground" />}
                    </SelectTrigger>
                    <SelectContent>
                      {['pending', 'paid', 'failed', 'refunded'].map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className="flex items-center gap-2 capitalize">
                            <span className={`w-2 h-2 rounded-full`} style={{
                              backgroundColor: s === 'pending' ? '#f59e0b' : s === 'paid' ? '#22c55e' : s === 'failed' ? '#ef4444' : '#94a3b8'
                            }} />
                            {s}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Refund button */}
                {payment?.status === 'captured' && order.paymentStatus !== 'refunded' && (
                  <button
                    onClick={handleRefund}
                    disabled={refunding}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors disabled:opacity-50"
                  >
                    {refunding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    {refunding ? 'Processing refund…' : 'Issue Full Refund'}
                  </button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment activity — desktop */}
          <motion.div variants={item} className="hidden lg:block">
            <PaymentActivityCard
              order={order}
              payment={payment}
              payAttemptCfg={payAttemptCfg}
              PayAttemptIcon={PayAttemptIcon}
              isOnline={isOnline}
              refunding={refunding}
              onRefund={handleRefund}
            />
          </motion.div>

          {/* Customer */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="py-3 px-5 bg-muted/30 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <span className="text-base font-bold text-primary">{customer.name?.charAt(0).toUpperCase() ?? '?'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{customer.name ?? 'Unknown'}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{customer.email ?? '—'}</span>
                    </div>
                  </div>
                </div>
                <Link href={`/admin/users?search=${customer.email}`}>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-xs">
                    View Profile <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Address */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="py-3 px-5 bg-muted/30 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-1 text-sm">
                {addr.label && <Badge variant="secondary" className="mb-2 capitalize text-xs">{addr.label}</Badge>}
                <p className="font-medium">{addr.street ?? addr.addressLine1 ?? '—'}</p>
                <p className="text-muted-foreground">{addr.city}, {addr.state} – {addr.pincode ?? addr.zipCode}</p>
                <p className="text-muted-foreground">{addr.country}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Timeline */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="py-3 px-5 bg-muted/30 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <ol className="relative border-l border-border space-y-5 ml-2">
                  <TimelineEvent
                    icon={<Package className="h-3.5 w-3.5" />}
                    label="Order placed"
                    date={order.createdAt}
                    color="bg-primary"
                  />
                  {payment?.createdAt && isOnline && (
                    <TimelineEvent
                      icon={<CreditCard className="h-3.5 w-3.5" />}
                      label="Payment session created"
                      date={payment.createdAt}
                      color="bg-amber-400"
                    />
                  )}
                  {payment?.status === 'captured' && payment.updatedAt && (
                    <TimelineEvent
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                      label="Payment captured"
                      date={payment.updatedAt}
                      color="bg-green-500"
                    />
                  )}
                  {payment?.status === 'refunded' && payment.updatedAt && (
                    <TimelineEvent
                      icon={<RotateCcw className="h-3.5 w-3.5" />}
                      label="Payment refunded"
                      date={payment.updatedAt}
                      color="bg-slate-400"
                    />
                  )}
                  {order.status === 'cancelled' && order.updatedAt && (
                    <TimelineEvent
                      icon={<XCircle className="h-3.5 w-3.5" />}
                      label="Order cancelled"
                      date={order.updatedAt}
                      color="bg-red-400"
                    />
                  )}
                  {order.updatedAt && order.updatedAt !== order.createdAt && order.status !== 'cancelled' && (
                    <TimelineEvent
                      icon={<RefreshCw className="h-3.5 w-3.5" />}
                      label={`Status → ${order.status}`}
                      date={order.updatedAt}
                      color="bg-blue-400"
                    />
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

// ─── Payment Activity Card ────────────────────────────────────────────────────
function PaymentActivityCard({
  order, payment, payAttemptCfg, PayAttemptIcon, isOnline, refunding, onRefund,
}: {
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
    <Card className={isUrgent ? 'border-amber-200' : ''}>
      <CardHeader className={`py-3 px-5 border-b ${isUrgent ? 'bg-amber-50' : 'bg-muted/30'}`}>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {isOnline
            ? <CreditCard className={`h-4 w-4 ${isUrgent ? 'text-amber-600' : 'text-primary'}`} />
            : <Banknote className="h-4 w-4 text-primary" />}
          Payment Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">

        {/* COD */}
        {!isOnline && (
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <Banknote className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium text-sm">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground">Collect payment on delivery</p>
            </div>
          </div>
        )}

        {/* Online — no payment row yet */}
        {isOnline && !payment && (
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            No payment session started yet
          </div>
        )}

        {/* Online — payment row exists */}
        {isOnline && payment && (
          <>
            {/* Attempt status */}
            {payAttemptCfg && PayAttemptIcon && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${payAttemptCfg.bg}`}>
                <PayAttemptIcon className={`h-5 w-5 shrink-0 ${payAttemptCfg.color}`} />
                <div>
                  <p className={`font-semibold text-sm ${payAttemptCfg.color}`}>{payAttemptCfg.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.status === 'captured' ? 'Payment successfully received' :
                     payment.status === 'failed' ? 'Last attempt failed — customer can retry' :
                     payment.status === 'created' ? 'Session open, awaiting customer action' :
                     payment.status === 'refunded' ? 'Amount returned to customer' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Expiry warning */}
            {isUrgent && timeLeft && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Order auto-cancels in <strong>{timeLeft}</strong> if unpaid
              </div>
            )}

            {/* Details grid */}
            <div className="space-y-2.5 text-sm">
              <DetailRow label="Amount">
                <span className="font-semibold">₹{parseFloat(String(payment.amount ?? 0)).toLocaleString('en-IN')}</span>
              </DetailRow>

              {payment.razorpayOrderId && (
                <DetailRow label="Razorpay Order">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[150px]" title={payment.razorpayOrderId}>
                    {payment.razorpayOrderId}
                  </span>
                  <CopyButton text={payment.razorpayOrderId} />
                </DetailRow>
              )}

              {payment.razorpayPaymentId && (
                <DetailRow label="Payment ID">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[150px]" title={payment.razorpayPaymentId}>
                    {payment.razorpayPaymentId}
                  </span>
                  <CopyButton text={payment.razorpayPaymentId} />
                </DetailRow>
              )}

              {payment.method && (
                <DetailRow label="Method">
                  <span className="capitalize font-medium">{methodLabel(payment.method)}</span>
                </DetailRow>
              )}

              {payment.createdAt && (
                <DetailRow label="Initiated">
                  <span className="text-muted-foreground">{fmt(payment.createdAt)}</span>
                </DetailRow>
              )}

              {payment.status === 'captured' && payment.updatedAt && (
                <DetailRow label="Captured">
                  <span className="text-green-700 font-medium">{fmt(payment.updatedAt)}</span>
                </DetailRow>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────
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
    <li className="ml-5 relative">
      <span className={`absolute -left-[1.65rem] flex items-center justify-center w-6 h-6 rounded-full text-white ${color}`}>
        {icon}
      </span>
      <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{fmt(date)}</p>
    </li>
  );
}

// ─── skeleton ────────────────────────────────────────────────────────────────
function OrderDetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-muted animate-pulse" />
          <div className="h-3 w-28 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="h-20 rounded-xl bg-muted animate-pulse" />
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="h-72 rounded-xl bg-muted animate-pulse" />
          <div className="h-40 rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="space-y-5">
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
          <div className="h-52 rounded-xl bg-muted animate-pulse" />
          <div className="h-40 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
