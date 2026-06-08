'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useGetOrderByIdQuery } from '@/services/api/ordersApi';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle, Clock, Package, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

export default function OrderPlacedPage() {
  const { orderId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const payment = searchParams.get('payment');
  const isSuccess = searchParams.get('success') === 'true';
  const hasRedirected = useRef(false);

  const { data: orderResponse, isLoading, error } = useGetOrderByIdQuery(orderId as string);
  const order = (orderResponse as any)?.data || orderResponse;

  const isPaymentSuccess = isSuccess && payment !== 'failed';
  const isPaymentFailed = payment === 'failed';
  const isPaymentPending = payment === 'pending';
  const isCOD = isSuccess && !payment;

  useEffect(() => {
    if (isPaymentFailed && !hasRedirected.current) {
      hasRedirected.current = true;
      const timer = setTimeout(() => {
        router.push(`/profile/orders/${orderId}`);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isPaymentFailed, orderId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-mono-terracotta" />
      </div>
    );
  }

  if (error || (!isLoading && !order)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Could not load order details.</p>
        <Link href="/profile/orders">
          <Button variant="outline">View My Orders</Button>
        </Link>
      </div>
    );
  }

  const shippingAddress = order?.address;
  const items = order?.items || [];
  const totalAmount = order?.total ? parseFloat(order.total) : 0;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">

        {/* Failed State */}
        {isPaymentFailed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
            </motion.div>

            <div>
              <h1 className="text-2xl font-bold text-mono-charcoal mb-2">Payment Failed</h1>
              <p className="text-muted-foreground text-sm">
                Your payment could not be processed. Your order #{orderId} has been saved.
              </p>
              <p className="text-muted-foreground text-xs mt-2">
                Redirecting to order details in 5 seconds...
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/profile/orders/${orderId}?payment=failed`}>
                <Button className="h-11 px-6 bg-mono-charcoal hover:bg-mono-charcoal/90 gap-2">
                  <Package className="h-4 w-4 shrink-0" />
                  <span>View Order & Retry Payment</span>
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Pending State */}
        {isPaymentPending && !isPaymentFailed && !isPaymentSuccess && !isCOD && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="w-24 h-24 rounded-full bg-yellow-50 flex items-center justify-center">
                <Clock className="h-12 w-12 text-yellow-500" />
              </div>
            </motion.div>

            <div>
              <h1 className="text-2xl font-bold text-mono-charcoal mb-2">Payment Pending</h1>
              <p className="text-muted-foreground text-sm">
                Your order #{orderId} has been placed but payment is not yet complete.
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                If you completed the payment, it will be reflected shortly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/profile/orders">
                <Button variant="outline" className="h-11 px-6 gap-2">
                  <Package className="h-4 w-4 shrink-0" />
                  <span>My Orders</span>
                </Button>
              </Link>
              <Link href={`/profile/orders/${orderId}`}>
                <Button className="h-11 px-6 bg-mono-charcoal hover:bg-mono-charcoal/90 gap-2">
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  <span>View Order Details</span>
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Success State — COD or Online Payment */}
        {(isPaymentSuccess || isCOD) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Icon + Header */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle className="h-14 w-14 text-green-500" />
                  </div>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: Math.cos((i / 6) * Math.PI * 2) * 48, y: Math.sin((i / 6) * Math.PI * 2) * 48 }}
                      transition={{ delay: 0.4 + i * 0.05, duration: 0.6 }}
                      className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-green-400"
                      style={{ marginTop: -4, marginLeft: -4 }}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-mono-terracotta mb-1">Thank you!</p>
                <h1 className="text-3xl font-bold text-mono-charcoal mb-2">Order Placed</h1>
                <p className="text-muted-foreground text-sm">
                  {isCOD
                    ? "Your order has been placed. We'll confirm it shortly — pay when it arrives."
                    : 'Your payment was successful and your order is confirmed.'}
                </p>
              </motion.div>
            </div>

            {/* Order Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Order meta header */}
              <div className="bg-muted/40 px-5 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Order</p>
                  <p className="text-lg font-bold text-mono-charcoal">#{orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total</p>
                  <p className="text-lg font-bold text-mono-charcoal">₹{totalAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Items */}
              {items.length > 0 && (
                <div className="px-5 py-4 border-b border-border/50 space-y-3">
                  {items.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/40">
                          {item.productImage
                            ? <Image src={item.productImage} alt={item.productName} fill sizes="40px" className="object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground/40" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}{item.size ? ` · Size: ${item.size}` : ''}</p>
                        </div>
                        <p className="text-sm font-semibold shrink-0">
                          ₹{(parseFloat(item.price || 0) * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">+{items.length - 3} more items</p>
                  )}
                </div>
              )}

              {/* Price breakdown */}
              {order?.subtotal != null && (
                <div className="px-5 py-4 border-b border-border/50 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{parseFloat(order.subtotal).toFixed(2)}</span>
                  </div>
                  {parseFloat(order.discount || '0') > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>−₹{parseFloat(order.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{parseFloat(order.shipping || '0') === 0 ? 'Free' : `₹${parseFloat(order.shipping).toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>₹{parseFloat(order.tax || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1.5 border-t border-border/40 mt-1.5">
                    <span>Total</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Address + Payment row */}
              <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Deliver to</p>
                  {shippingAddress ? (
                    <>
                      <p className="font-medium capitalize text-mono-charcoal">{shippingAddress.label}</p>
                      <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">{shippingAddress.street}, {shippingAddress.city}</p>
                      <p className="text-muted-foreground text-xs">{shippingAddress.state} {shippingAddress.pincode}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-xs">Address unavailable</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Payment</p>
                  <p className="font-medium text-mono-charcoal">
                    {isCOD ? 'Cash on Delivery' : 'Online Payment'}
                  </p>
                  <p className={`text-xs font-medium mt-0.5 ${isCOD ? 'text-amber-600' : 'text-green-600'}`}>
                    {isCOD ? 'Pay on delivery' : 'Paid'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link href="/profile/orders" className="flex-1">
                <Button variant="outline" className="w-full h-11 gap-2">
                  <Package className="h-4 w-4 shrink-0" />
                  <span>My Orders</span>
                </Button>
              </Link>
              <Link href="/products" className="flex-1">
                <Button className="w-full h-11 bg-mono-charcoal hover:bg-mono-charcoal/90 gap-2">
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">Continue Shopping</span>
                </Button>
              </Link>
            </motion.div>

            {/* View full details link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center text-xs text-muted-foreground"
            >
              <Link href={`/profile/orders/${orderId}`} className="underline underline-offset-2 hover:text-foreground">
                View full order details
              </Link>
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
