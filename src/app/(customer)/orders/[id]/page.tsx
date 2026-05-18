'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useGetOrderByIdQuery, useCancelOrderMutation } from '@/services/api/ordersApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, CheckCircle, Clock, Truck, XCircle, MapPin, CreditCard, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Package },
  shipped:    { label: 'Shipped',    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-800' },
  paid:       { label: 'Paid',       color: 'bg-green-100 text-green-800' },
  failed:     { label: 'Failed',     color: 'bg-red-100 text-red-800' },
  refunded:   { label: 'Refunded',   color: 'bg-gray-100 text-gray-800' },
};

const ORDER_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isSuccess = searchParams.get('success') === 'true';
  const [cancelling, setCancelling] = useState(false);

  const { data: orderResponse, isLoading, error } = useGetOrderByIdQuery(id as string);
  const [cancelOrder] = useCancelOrderMutation();

  const order = (orderResponse as any)?.data || orderResponse;

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await cancelOrder(id as string).unwrap();
    } catch {}
    setCancelling(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Card key={i} className="h-32 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Order not found</h2>
        <Link href="/orders"><Button>View All Orders</Button></Link>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;
  const paymentInfo = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.pending;
  const currentStep = ORDER_STEPS.indexOf(order.status);
  const canCancel = ['pending', 'processing'].includes(order.status);

  const shippingAddr = order.address || order.shippingAddress || {};
  const items = order.items || order.orderItems || [];
  const subtotal = items.reduce((s: number, i: any) => s + parseFloat(i.price) * i.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      {isSuccess && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">Order Placed Successfully!</p>
            <p className="text-sm text-green-700 dark:text-green-400">Thank you for your purchase. We'll process your order shortly.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id}</h1>
          <p className="text-muted-foreground text-sm">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color}`}>
            <StatusIcon className="h-4 w-4" />
            {statusInfo.label}
          </span>
          {canCancel && (
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          )}
        </div>
      </div>

      {order.status !== 'cancelled' && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-4 h-0.5 bg-muted -z-0" />
              <div className="absolute left-0 top-4 h-0.5 bg-primary transition-all -z-0"
                style={{ width: currentStep >= 0 ? `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%` : '0%' }}
              />
              {ORDER_STEPS.map((step, index) => {
                const info = STATUS_CONFIG[step];
                const Icon = info.icon;
                const done = currentStep >= index;
                const current = currentStep === index;
                return (
                  <div key={step} className="flex flex-col items-center gap-2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      done ? 'bg-primary border-primary text-primary-foreground' :
                      current ? 'border-primary text-primary' : 'border-muted bg-background text-muted-foreground'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${done ? 'text-primary' : 'text-muted-foreground'}`}>
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-0.5">
            {shippingAddr.label && <p className="font-medium capitalize">{shippingAddr.label}</p>}
            <p className="text-muted-foreground">{shippingAddr.street || shippingAddr.addressLine1}</p>
            <p className="text-muted-foreground">{shippingAddr.city}, {shippingAddr.state} {shippingAddr.pincode || shippingAddr.zipCode}</p>
            <p className="text-muted-foreground">{shippingAddr.country}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="capitalize">{order.paymentMethod || 'Cash on Delivery'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${paymentInfo.color}`}>
                {paymentInfo.label}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {items.map((item: any) => (
            <div key={item.id} className="py-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {item.product?.images?.[0] && (
                  <img src={item.product.images[0]} alt={item.product.name || item.productName} className="object-cover w-full h-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product?.slug}`}>
                  <p className="font-medium hover:text-primary text-sm truncate">{item.product?.name || item.productName}</p>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">${parseFloat(item.price).toFixed(2)} each</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${parseFloat(order.subtotal || subtotal).toFixed(2)}</span>
          </div>
          {parseFloat(order.discount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-${parseFloat(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-3 border-t">
            <span>Total</span>
            <span>${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
