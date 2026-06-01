'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useGetOrderByIdQuery, useCancelOrderMutation } from '@/services/api/ordersApi';
import { useCreatePaymentMutation, useVerifyPaymentMutation } from '@/services/api/paymentsApi';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  MapPin,
  CreditCard,
  AlertCircle,
  ImageOff,
  Loader2,
  RefreshCw,
  ChevronRight,
  Receipt,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    Razorpay: new (options: unknown) => { open: () => void };
  }
}

type StatusKey = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }>; step: number }
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

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200/80' },
  paid: { label: 'Paid', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200/80' },
  failed: { label: 'Failed', color: 'text-red-800', bg: 'bg-red-50 border-red-200/80' },
  refunded: { label: 'Refunded', color: 'text-muted-foreground', bg: 'bg-muted border-border' },
};

const ORDER_STEPS: StatusKey[] = ['pending', 'processing', 'shipped', 'delivered'];

interface Address {
  label?: string;
  street?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  zipCode?: string;
  country?: string;
}

interface OrderItem {
  id?: number;
  productImage?: string;
  productName?: string;
  variant?: { product?: { slug?: string; name?: string } };
  quantity?: number;
  size?: string;
  price?: string;
}

interface Order {
  id?: number;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt?: string;
  total?: string;
  subtotal?: string;
  discount?: string;
  shipping?: string;
  tax?: string;
  address?: Address;
  shippingAddress?: Address;
  items?: OrderItem[];
  orderItems?: OrderItem[];
}

function formatINR(value: string | number) {
  return `₹${parseFloat(String(value || 0)).toLocaleString('en-IN')}`;
}

function formatOrderDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function AlertBanner({
  variant,
  title,
  description,
}: {
  variant: 'success' | 'warning' | 'error';
  title: string;
  description: string;
}) {
  const styles = {
    success: {
      wrap: 'bg-emerald-50 border-emerald-200/80',
      icon: 'text-emerald-600',
      title: 'text-emerald-900',
      desc: 'text-emerald-800/90',
      Icon: CheckCircle,
    },
    warning: {
      wrap: 'bg-amber-50 border-amber-200/80',
      icon: 'text-amber-600',
      title: 'text-amber-900',
      desc: 'text-amber-800/90',
      Icon: AlertCircle,
    },
    error: {
      wrap: 'bg-red-50 border-red-200/80',
      icon: 'text-red-600',
      title: 'text-red-900',
      desc: 'text-red-800/90',
      Icon: XCircle,
    },
  }[variant];
  const Icon = styles.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 rounded-2xl border p-4 md:p-5 ${styles.wrap}`}
      role="alert"
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${styles.icon}`} />
      <div>
        <p className={`font-semibold text-sm ${styles.title}`}>{title}</p>
        <p className={`text-xs mt-0.5 ${styles.desc}`}>{description}</p>
      </div>
    </motion.div>
  );
}

function OrderProgressTracker({ status }: { status: string }) {
  const key = (status in STATUS_CONFIG ? status : 'pending') as StatusKey;
  const config = STATUS_CONFIG[key];
  if (config.step < 0) return null;

  const currentStep = config.step;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 md:p-6">
      <h2 className="text-sm font-semibold text-foreground mb-5">Delivery progress</h2>
      <div className="relative">
        <div className="absolute left-4 right-4 top-3.5 h-0.5 bg-border hidden sm:block" />
        <div
          className="absolute left-4 top-3.5 h-0.5 bg-primary/50 transition-all hidden sm:block"
          style={{
            width:
              currentStep >= 0
                ? `calc(${(currentStep / (ORDER_STEPS.length - 1)) * 100}% - 2rem)`
                : '0%',
          }}
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2">
          {ORDER_STEPS.map((step, index) => {
            const stepConfig = STATUS_CONFIG[step];
            const StepIcon = stepConfig.icon;
            const isComplete = index <= currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={step} className="flex sm:flex-col items-center gap-3 sm:gap-2 sm:text-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors z-10 ${
                    isComplete
                      ? isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground/50'
                  }`}
                >
                  <StepIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 sm:w-full">
                  <p
                    className={`text-xs font-semibold ${isCurrent ? 'text-foreground' : isComplete ? 'text-foreground/80' : 'text-muted-foreground'}`}
                  >
                    {stepConfig.label}
                  </p>
                  {isCurrent && (
                    <p className="text-[10px] text-accent mt-0.5 hidden sm:block">Current step</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="h-32 rounded-2xl bg-muted/60" />
      <div className="h-24 rounded-2xl bg-muted/60" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 rounded-2xl bg-muted/60" />
          <div className="h-32 rounded-2xl bg-muted/60" />
        </div>
        <div className="h-64 rounded-2xl bg-muted/60" />
      </div>
    </div>
  );
}

export default function ProfileOrderDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const paymentParam = searchParams.get('payment');
  const [cancelling, setCancelling] = useState(false);
  const [retryState, setRetryState] = useState<'idle' | 'loading' | 'processing'>('idle');
  const [retryBanner, setRetryBanner] = useState<'success' | 'failed' | 'pending' | null>(null);

  const { data: orderResponse, isLoading, error, refetch } = useGetOrderByIdQuery(id as string);
  const [cancelOrder] = useCancelOrderMutation();
  const [createPayment] = useCreatePaymentMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const order = ((orderResponse as { data?: Order } | undefined)?.data ||
    orderResponse) as Order | undefined;

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await cancelOrder(id as string).unwrap();
      refetch();
    } catch {
      /* user sees unchanged state */
    }
    setCancelling(false);
  };

  const handleRetryPayment = async () => {
    setRetryState('loading');
    setRetryBanner(null);
    try {
      const paymentData = await createPayment({ orderId: Number(id) }).unwrap();

      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
          document.body.appendChild(script);
        });
      }

      setRetryState('processing');

      const rzp = new window.Razorpay({
        key: paymentData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: paymentData.razorpayOrder?.amount,
        currency: paymentData.razorpayOrder?.currency || 'INR',
        name: 'MONO',
        description: `Order #${id}`,
        order_id: paymentData.razorpayOrder?.id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }).unwrap();
            setRetryState('idle');
            setRetryBanner('success');
            refetch();
          } catch {
            setRetryState('idle');
            setRetryBanner('failed');
          }
        },
        theme: { color: '#C7A27C' },
        modal: {
          ondismiss: () => {
            setRetryState('idle');
            setRetryBanner('pending');
          },
        },
      });

      rzp.open();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      console.error('Retry payment error:', e?.data?.message || err);
      setRetryState('idle');
      setRetryBanner('failed');
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !order?.id) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Package className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Order not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This order may have been removed or you don&apos;t have access to view it.
        </p>
        <Link href="/profile/orders">
          <Button className="rounded-full">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to orders
          </Button>
        </Link>
      </div>
    );
  }

  const orderStatus = order.status || 'pending';
  const statusKey = (orderStatus in STATUS_CONFIG ? orderStatus : 'pending') as StatusKey;
  const statusInfo = STATUS_CONFIG[statusKey];
  const StatusIcon = statusInfo.icon;
  const paymentInfo =
    PAYMENT_STATUS_CONFIG[order.paymentStatus || 'pending'] || PAYMENT_STATUS_CONFIG.pending;
  const canCancel = order.status === 'pending';
  const canRetryPayment =
    order.paymentMethod === 'online' &&
    order.paymentStatus === 'pending' &&
    order.status === 'pending';

  const shippingAddr: Address = order.address || order.shippingAddress || {};
  const items: OrderItem[] = order.items || order.orderItems || [];
  const computedSubtotal = items.reduce(
    (s, i) => s + parseFloat(i.price || '0') * (i.quantity || 0),
    0
  );

  const showNavBanner =
    (isSuccess && !retryBanner) ||
    (paymentParam === 'pending' && !isSuccess && !retryBanner) ||
    (paymentParam === 'failed' && !retryBanner) ||
    retryBanner !== null;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Back navigation */}
      <Link
        href="/profile/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to orders
      </Link>

      {/* Status alerts */}
      {showNavBanner && (
        <div className="space-y-3">
          {isSuccess && !retryBanner && (
            <AlertBanner
              variant="success"
              title="Order placed successfully"
              description="Thank you for your purchase. We'll process your order shortly."
            />
          )}
          {paymentParam === 'pending' && !isSuccess && !retryBanner && (
            <AlertBanner
              variant="warning"
              title="Payment not completed"
              description="You closed the payment window. Use the button below to complete your payment."
            />
          )}
          {paymentParam === 'failed' && !retryBanner && (
            <AlertBanner
              variant="error"
              title="Payment failed"
              description="Your payment could not be processed. Try again using the button below."
            />
          )}
          {retryBanner === 'success' && (
            <AlertBanner
              variant="success"
              title="Payment successful"
              description="Your order is confirmed and is now being processed."
            />
          )}
          {retryBanner === 'failed' && (
            <AlertBanner
              variant="error"
              title="Payment failed"
              description="Please try again or use a different payment method."
            />
          )}
          {retryBanner === 'pending' && (
            <AlertBanner
              variant="warning"
              title="Payment not completed"
              description="Your order is saved — complete payment before it expires."
            />
          )}
        </div>
      )}

      {/* Payment action */}
      {canRetryPayment && (
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-card to-card p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <CreditCard className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Complete your payment</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  This order is reserved for 24 hours. Pay now to confirm — unpaid orders are
                  cancelled automatically.
                </p>
              </div>
            </div>
            <Button
              onClick={handleRetryPayment}
              disabled={retryState !== 'idle'}
              className="rounded-full shrink-0 w-full sm:w-auto"
            >
              {retryState === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </>
              ) : retryState === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Pay {formatINR(order.total || 0)}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Order hero header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card"
      >
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
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-1">
                Order details
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Order #{order.id}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {order.createdAt ? formatOrderDate(order.createdAt) : ''}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${statusInfo.bg} ${statusInfo.color}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusInfo.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${paymentInfo.bg} ${paymentInfo.color}`}
                >
                  <CreditCard className="h-3 w-3" />
                  {paymentInfo.label}
                </span>
                {order.paymentMethod && (
                  <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded-md bg-muted">
                    {order.paymentMethod === 'online' ? 'Online payment' : 'Cash on delivery'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-end gap-3 shrink-0">
              <div className="lg:text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Order total</p>
                <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
                  {formatINR(order.total || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </p>
              </div>
              {canCancel && !canRetryPayment && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {cancelling ? 'Cancelling…' : 'Cancel order'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress or cancelled state */}
      {statusKey === 'cancelled' ? (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/50 p-5 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">This order was cancelled</p>
            <p className="text-xs text-red-800/80 mt-0.5">
              If you have questions, contact support or place a new order.
            </p>
            <Link href="/products" className="inline-block mt-3">
              <Button size="sm" variant="outline" className="rounded-full bg-card">
                <ShoppingBag className="h-3.5 w-3.5" />
                Shop again
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <OrderProgressTracker status={order.status || 'pending'} />
      )}

      {/* Main layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 md:px-6 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                Items ({items.length})
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Products in this order</p>
            </div>
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const slug = item.variant?.product?.slug;
                const lineTotal = parseFloat(item.price || '0') * (item.quantity || 0);
                const content = (
                  <div className="flex items-center gap-4 px-5 py-4 md:px-6 hover:bg-muted/30 transition-colors">
                    <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/80 flex items-center justify-center">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageOff className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground line-clamp-2">
                        {item.productName || item.variant?.product?.name || 'Product'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Qty {item.quantity}
                        {item.size ? ` · Size ${item.size}` : ''}
                        {item.price ? ` · ${formatINR(item.price)} each` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-foreground tabular-nums">
                        {formatINR(lineTotal)}
                      </p>
                      {slug && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-accent mt-1">
                          View
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );

                return (
                  <li key={item.id}>
                    {slug ? (
                      <Link href={`/products/${slug}`} className="block group">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Shipping & payment */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Shipping address</h2>
              </div>
              <address className="text-sm text-muted-foreground not-italic space-y-0.5 leading-relaxed">
                {shippingAddr.label && (
                  <p className="font-medium text-foreground capitalize">{shippingAddr.label}</p>
                )}
                {(shippingAddr.street || shippingAddr.addressLine1) && (
                  <p>{shippingAddr.street || shippingAddr.addressLine1}</p>
                )}
                {(shippingAddr.city || shippingAddr.state) && (
                  <p>
                    {[shippingAddr.city, shippingAddr.state].filter(Boolean).join(', ')}
                    {(shippingAddr.pincode || shippingAddr.zipCode) &&
                      ` – ${shippingAddr.pincode || shippingAddr.zipCode}`}
                  </p>
                )}
                {shippingAddr.country && <p>{shippingAddr.country}</p>}
                {!shippingAddr.street &&
                  !shippingAddr.addressLine1 &&
                  !shippingAddr.city && (
                    <p className="text-muted-foreground/80">Address details unavailable</p>
                  )}
              </address>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                  <CreditCard className="h-4 w-4 text-accent" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Payment</h2>
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd className="font-medium text-foreground text-right">
                    {order.paymentMethod === 'online' ? 'Razorpay (Online)' : 'Cash on delivery'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 items-center">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold border ${paymentInfo.bg} ${paymentInfo.color}`}
                    >
                      {paymentInfo.label}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4 pt-2 border-t border-border">
                  <dt className="text-muted-foreground">Amount paid</dt>
                  <dd className="font-bold text-foreground tabular-nums">
                    {formatINR(order.total || 0)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Sidebar summary */}
        <aside className="space-y-4">
          <div className="lg:sticky lg:top-6 bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Receipt className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Order summary</h2>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatINR(order.subtotal || computedSubtotal)}
                </span>
              </div>
              {parseFloat(order.discount || '0') > 0 && (
                <div className="flex justify-between gap-4 text-emerald-700">
                  <span>Discount</span>
                  <span className="font-medium tabular-nums">−{formatINR(order.discount!)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-foreground">
                  {parseFloat(order.shipping || '0') === 0
                    ? 'Free'
                    : formatINR(order.shipping!)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatINR(order.tax || 0)}
                </span>
              </div>
              <div className="flex justify-between gap-4 pt-3 border-t border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground tabular-nums">
                  {formatINR(order.total || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-5">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Need help?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reference order #{order.id} when contacting support about delivery or returns.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent mt-2 hover:underline"
                >
                  Contact support
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
