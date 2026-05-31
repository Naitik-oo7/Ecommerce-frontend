'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useGetOrderByIdQuery, useCancelOrderMutation } from '@/services/api/ordersApi';
import { useCreatePaymentMutation, useVerifyPaymentMutation } from '@/services/api/paymentsApi';
import { ArrowLeft, Package, CheckCircle, Clock, Truck, XCircle, MapPin, CreditCard, AlertCircle, ImageOff, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

declare global {
  interface Window {
    Razorpay: new (options: unknown) => { open: () => void };
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200',  dot: 'bg-yellow-400', icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-400',   icon: Package },
  shipped:    { label: 'Shipped',    color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-400', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   dot: 'bg-green-400',  icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       dot: 'bg-red-400',    icon: XCircle },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending',  color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  paid:     { label: 'Paid',     color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  failed:   { label: 'Failed',   color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  refunded: { label: 'Refunded', color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
};

const ORDER_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function ProfileOrderDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isSuccess = searchParams.get('success') === 'true';
  const paymentParam = searchParams.get('payment');
  const [cancelling, setCancelling] = useState(false);
  const [retryState, setRetryState] = useState<'idle' | 'loading' | 'processing'>('idle');
  const [retryBanner, setRetryBanner] = useState<'success' | 'failed' | 'pending' | null>(null);

  const { data: orderResponse, isLoading, error, refetch } = useGetOrderByIdQuery(id as string);
  const [cancelOrder] = useCancelOrderMutation();
  const [createPayment] = useCreatePaymentMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  interface OrderResponse {
    data?: {
      id?: number;
      status?: string;
      paymentStatus?: string;
      paymentMethod?: string;
      createdAt?: string;
      total?: string;
      subtotal?: string;
      discount?: string;
      address?: {
        label?: string;
        street?: string;
        addressLine1?: string;
        city?: string;
        state?: string;
        pincode?: string;
        zipCode?: string;
        country?: string;
      };
      shippingAddress?: unknown;
      items?: { id?: number; productImage?: string; productName?: string; variant?: { product?: { slug?: string; name?: string } }; quantity?: number; size?: string; price?: string }[];
      orderItems?: unknown[];
    };
  }

  const order = (orderResponse as OrderResponse | undefined)?.data || orderResponse;

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try { await cancelOrder(id as string).unwrap(); } catch {}
    setCancelling(false);
  };

  const handleRetryPayment = async () => {
    setRetryState('loading');
    setRetryBanner(null);
    try {
      const paymentData = await createPayment({ orderId: Number(id) }).unwrap();

      // Ensure Razorpay SDK is loaded
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
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
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
        theme: { color: '#C4A484' },
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
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#C7A27C]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-[#F6F3EE] flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-[#C7A27C]" />
        </div>
        <h2 className="text-xl font-bold text-[#111111] mb-4">Order not found</h2>
        <Link href="/profile/orders">
          <button className="px-5 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-full hover:bg-[#333] transition-colors">
            View All Orders
          </button>
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;
  const paymentInfo = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.pending;
  const currentStep = ORDER_STEPS.indexOf(order.status);
  const canCancel = order.status === 'pending';
  const canRetryPayment =
    order.paymentMethod === 'online' &&
    order.paymentStatus === 'pending' &&
    order.status === 'pending';
  const shippingAddr = order.address || order.shippingAddress || {};
  const items = order.items || order.orderItems || [];
  interface OrderItem {
    price?: string;
    quantity?: number;
  }

  const subtotal = items.reduce((s: number, i: unknown) => s + parseFloat((i as OrderItem).price || '0') * ((i as OrderItem).quantity || 0), 0);

  return (
    <div className="space-y-5">
      {/* Back nav */}
      <Link href="/profile/orders" className="inline-flex items-center gap-2 text-sm text-[#9B9B9B] hover:text-[#111111] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      {/* Banners — from navigation params */}
      {isSuccess && !retryBanner && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800 text-sm">Order Placed Successfully!</p>
            <p className="text-xs text-green-700 mt-0.5">Thank you for your purchase. We&apos;ll process your order shortly.</p>
          </div>
        </div>
      )}
      {paymentParam === 'pending' && !isSuccess && !retryBanner && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 text-sm">Payment Not Completed</p>
            <p className="text-xs text-yellow-700 mt-0.5">You closed the payment window. Use the button below to complete your payment.</p>
          </div>
        </div>
      )}
      {paymentParam === 'failed' && !retryBanner && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Payment Failed</p>
            <p className="text-xs text-red-700 mt-0.5">Your payment could not be processed. Use the button below to try again.</p>
          </div>
        </div>
      )}

      {/* Banners — from inline retry */}
      {retryBanner === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800 text-sm">Payment Successful!</p>
            <p className="text-xs text-green-700 mt-0.5">Your order has been confirmed and is now being processed.</p>
          </div>
        </div>
      )}
      {retryBanner === 'failed' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Payment Failed</p>
            <p className="text-xs text-red-700 mt-0.5">Your payment could not be processed. Please try again or use a different payment method.</p>
          </div>
        </div>
      )}
      {retryBanner === 'pending' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 text-sm">Payment Not Completed</p>
            <p className="text-xs text-yellow-700 mt-0.5">You closed the payment window. Your order is saved — complete payment anytime before it expires.</p>
          </div>
        </div>
      )}

      {/* Retry Payment CTA — shown when order is unpaid online order */}
      {canRetryPayment && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Payment Pending</p>
              <p className="text-xs text-amber-700 mt-0.5">
                This order will be automatically cancelled if payment is not completed within 24 hours of placing it.
              </p>
            </div>
          </div>
          <button
            onClick={handleRetryPayment}
            disabled={retryState !== 'idle'}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-full hover:bg-[#333] transition-colors disabled:opacity-60 shrink-0"
          >
            {retryState === 'loading' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>
            ) : retryState === 'processing' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> Complete Payment</>
            )}
          </button>
        </div>
      )}

      {/* Order header */}
      <div className="bg-white rounded-2xl border border-[#E5E2DD] p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C7A27C] block mb-1">Order</span>
            <h1 className="text-xl font-bold text-[#111111]">#{order.id}</h1>
            <p className="text-sm text-[#9B9B9B] mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </span>
            {canCancel && !canRetryPayment && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-2xl border border-[#E5E2DD] p-6">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C7A27C] mb-5">Order Progress</p>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-[#E5E2DD] z-0" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-[#C7A27C] transition-all z-0"
              style={{ width: currentStep >= 0 ? `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%` : '0%' }}
            />
            {ORDER_STEPS.map((step, index) => {
              const info = STATUS_CONFIG[step];
              const Icon = info.icon;
              const done = currentStep >= index;
              const isCurrent = currentStep === index;
              return (
                <div key={step} className="flex flex-col items-center gap-2 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    done ? 'bg-[#C7A27C] border-[#C7A27C] text-white'
                    : isCurrent ? 'border-[#C7A27C] text-[#C7A27C] bg-white'
                    : 'border-[#E5E2DD] bg-white text-[#C8C8C8]'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${done ? 'text-[#C7A27C]' : 'text-[#C8C8C8]'}`}>
                    {info.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Address + Payment */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E5E2DD] p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#F6F3EE] flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-[#C7A27C]" />
            </div>
            <p className="font-semibold text-sm text-[#111111]">Shipping Address</p>
          </div>
          <div className="text-sm text-[#6B6B6B] space-y-0.5 pl-10">
            {shippingAddr.label && <p className="font-medium text-[#111111] capitalize">{shippingAddr.label}</p>}
            <p>{shippingAddr.street || shippingAddr.addressLine1}</p>
            <p>{shippingAddr.city}, {shippingAddr.state} – {shippingAddr.pincode || shippingAddr.zipCode}</p>
            <p>{shippingAddr.country}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E2DD] p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#F6F3EE] flex items-center justify-center shrink-0">
              <CreditCard className="h-4 w-4 text-[#C7A27C]" />
            </div>
            <p className="font-semibold text-sm text-[#111111]">Payment</p>
          </div>
          <div className="pl-10 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[#9B9B9B]">Method</span>
              <span className="font-medium text-[#111111]">
                {order.paymentMethod === 'online' ? 'Razorpay (Online)' : 'Cash on Delivery'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9B9B9B]">Status</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${paymentInfo.bg} ${paymentInfo.color}`}>
                {paymentInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl border border-[#E5E2DD] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EDE8]">
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C7A27C] block mb-0.5">Items</span>
          <h3 className="text-base font-semibold text-[#111111]">Order Items ({items.length})</h3>
        </div>
        <div className="divide-y divide-[#F0EDE8]">
          {items.map((item: { id?: number; productImage?: string; productName?: string; variant?: { product?: { slug?: string; name?: string } }; quantity?: number; size?: string; price?: string }) => (
            <div key={item.id} className="flex items-center gap-4 px-6 py-4">
              <div className="w-16 h-16 rounded-xl bg-[#F6F3EE] overflow-hidden shrink-0 flex items-center justify-center border border-[#E5E2DD]">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="object-cover w-full h-full" />
                ) : (
                  <ImageOff className="h-6 w-6 text-[#C8C8C8]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.variant?.product?.slug || '#'}`}>
                  <p className="font-medium text-sm text-[#111111] hover:text-[#C7A27C] transition-colors truncate">
                    {item.productName || item.variant?.product?.name}
                  </p>
                </Link>
                <p className="text-xs text-[#9B9B9B] mt-0.5">
                  Qty: {item.quantity}{item.size ? ` · Size: ${item.size}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-[#111111]">₹{(parseFloat(item.price || '0') * (item.quantity || 0)).toLocaleString('en-IN')}</p>
                <p className="text-xs text-[#9B9B9B]">₹{parseFloat(item.price || '0').toLocaleString('en-IN')} each</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-[#E5E2DD] p-6">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C7A27C] mb-4">Summary</p>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#9B9B9B]">Subtotal</span>
            <span className="text-[#111111]">₹{parseFloat(order.subtotal || String(subtotal)).toLocaleString('en-IN')}</span>
          </div>
          {parseFloat(order.discount || '0') > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>–₹{parseFloat(order.discount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-3 border-t border-[#F0EDE8]">
            <span className="text-[#111111]">Total</span>
            <span className="text-[#111111]">₹{parseFloat(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
