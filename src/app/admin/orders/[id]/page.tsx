'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetOrderByIdAdminQuery,
  useUpdateOrderStatusMutation,
  useUpdatePaymentStatusMutation,
} from '@/services/api/ordersApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  MapPin,
  CreditCard,
  User,
  Mail,
  Calendar,
  Hash,
  ImageOff,
  Loader2,
  AlertCircle,
  Copy,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: Package,
  },
  shipped: {
    label: 'Shipped',
    color: 'text-indigo-700 dark:text-indigo-300',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: XCircle,
  },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  paid: { label: 'Paid', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'outline' },
};

const ORDER_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const orderId = parseInt(id as string);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: orderResponse, isLoading, error } = useGetOrderByIdAdminQuery(orderId);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();

  const order = (orderResponse as any)?.data || orderResponse;

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(`#${order.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === order?.status) return;
    setUpdatingStatus(true);
    try {
      await updateOrderStatus({ id: orderId, status: newStatus, isAdmin: true }).unwrap();
    } catch {
      // Error handled by RTK Query
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (newStatus === order?.paymentStatus) return;
    setUpdatingPayment(true);
    try {
      await updatePaymentStatus({ id: orderId, paymentStatus: newStatus, isAdmin: true }).unwrap();
    } catch {
      // Error handled by RTK Query
    } finally {
      setUpdatingPayment(false);
    }
  };

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Order not found</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <Link href="/admin/orders">
          <Button size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </motion.div>
    );
  }

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;
  const paymentInfo = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.pending;
  const currentStep = ORDER_STEPS.indexOf(order.status);
  const shippingAddr = order.address || order.shippingAddress || {};
  const items = order.items || order.orderItems || [];
  const subtotal = items.reduce((s: number, i: any) => s + parseFloat(i.price) * i.quantity, 0);
  const customer = order.user || {};

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="icon" className="h-10 w-10 hover:bg-muted/80 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">Order #{order.id}</h1>
              <button onClick={handleCopyOrderId} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Copy order ID">
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="text-green-600 text-xs font-medium">Copied!</motion.span>
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </AnimatePresence>
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={paymentInfo.variant} className="px-3 py-1.5 text-sm gap-1.5 h-9">
            <CreditCard className="h-3.5 w-3.5" />
            {paymentInfo.label}
          </Badge>
          <motion.div whileHover={{ scale: 1.02 }} className={`flex items-center gap-2 px-3 py-1.5 rounded-full h-9 ${statusInfo.bgColor} ${statusInfo.color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{statusInfo.label}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Progress */}
      {order.status !== 'cancelled' && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-4 h-1 bg-muted/60 rounded-full z-0" />
                <motion.div className="absolute left-0 top-4 h-1 bg-gradient-to-r from-primary to-primary/80 rounded-full z-0"
                  initial={{ width: 0 }}
                  animate={{ width: currentStep >= 0 ? `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%` : '0%' }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
                {ORDER_STEPS.map((step, index) => {
                  const info = STATUS_CONFIG[step];
                  const Icon = info.icon;
                  const done = currentStep >= index;
                  return (
                    <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.15 }}
                      className="flex flex-col items-center gap-2 z-10 shrink-0">
                      <motion.div whileHover={{ scale: 1.1 }} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${done ? 'bg-primary border-primary text-primary-foreground shadow-primary/25' : 'border-muted-foreground/20 bg-background text-muted-foreground'}`}>
                        <Icon className="h-5 w-5" />
                      </motion.div>
                      <span className={`text-xs font-medium hidden sm:block ${done ? 'text-primary' : 'text-muted-foreground'}`}>{info.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Order Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {items.map((item: any, index: number) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                    className="py-4 px-6 flex items-center gap-4 border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0 flex items-center justify-center border">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="object-cover w-full h-full" />
                      ) : (
                        <ImageOff className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.variant?.product?.slug || '#'}`} target="_blank" className="group">
                        <p className="font-medium group-hover:text-primary text-sm truncate transition-colors">{item.productName || item.variant?.product?.name}</p>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-muted rounded text-xs">Qty: {item.quantity}</span>
                        {item.size && <span className="px-2 py-0.5 bg-muted rounded text-xs">Size: {item.size}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">${parseFloat(item.price).toFixed(2)} each</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                  <span className="font-medium">${parseFloat(order.subtotal || subtotal).toFixed(2)}</span>
                </div>
                {parseFloat(order.discount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-green-100 rounded text-xs font-medium">{order.coupon?.code}</span>
                      Discount
                    </span>
                    <span className="font-medium">-${parseFloat(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Free</Badge>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="font-bold text-2xl text-primary">${parseFloat(order.total).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Management */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-primary/10 shadow-sm">
              <CardHeader className="pb-3 bg-primary/5">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Order Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-2">
                  {ORDER_STEPS.map((step) => {
                    const isActive = order.status === step;
                    const Icon = STATUS_CONFIG[step].icon;
                    return (
                      <Button key={step} variant={isActive ? 'default' : 'outline'} size="sm"
                        disabled={updatingStatus || order.status === 'cancelled' || order.status === 'delivered'}
                        onClick={() => handleStatusChange(step)} className={`text-xs capitalize ${isActive ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {step}
                      </Button>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Order Status</label>
                  <Select value={order.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                      {updatingStatus && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STEPS.map((step) => (
                        <SelectItem key={step} value={step}>
                          <span className="flex items-center gap-2 capitalize">
                            <span className={`w-2 h-2 rounded-full ${step === 'pending' ? 'bg-yellow-500' : step === 'processing' ? 'bg-blue-500' : step === 'shipped' ? 'bg-indigo-500' : 'bg-green-500'}`} />
                            {step}
                          </span>
                        </SelectItem>
                      ))}
                      <SelectItem value="cancelled" className="text-red-600">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" />Cancelled</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                  <Select value={order.paymentStatus} onValueChange={handlePaymentStatusChange} disabled={updatingPayment}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                      {updatingPayment && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    </SelectTrigger>
                    <SelectContent>
                      {['pending', 'paid', 'failed', 'refunded'].map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className="flex items-center gap-2 capitalize">
                            <span className={`w-2 h-2 rounded-full ${s === 'pending' ? 'bg-yellow-500' : s === 'paid' ? 'bg-green-500' : s === 'failed' ? 'bg-red-500' : 'bg-gray-500'}`} />
                            {s}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      {order.paymentMethod === 'online' ? 'Online (Razorpay)' : 'Cash on Delivery'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Customer */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <span className="text-lg font-bold text-primary">{customer.name?.charAt(0).toUpperCase() || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{customer.name || 'Unknown'}</p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{customer.email || 'No email'}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <Link href={`/admin/users?search=${customer.email}`}>
                    <Button variant="outline" size="sm" className="w-full gap-2 hover:bg-primary/5">
                      View Customer Profile <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Address */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {shippingAddr.label && <Badge variant="secondary" className="mb-3 capitalize">{shippingAddr.label}</Badge>}
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{shippingAddr.street || shippingAddr.addressLine1}</p>
                  <p className="text-muted-foreground">{shippingAddr.city}, {shippingAddr.state} {shippingAddr.pincode || shippingAddr.zipCode}</p>
                  <p className="text-muted-foreground">{shippingAddr.country}</p>
                  {shippingAddr.phone && <p className="text-muted-foreground pt-2 flex items-center gap-1.5"><span className="text-xs bg-muted px-2 py-0.5 rounded">Phone</span>{shippingAddr.phone}</p>}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Timeline */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Order Placed</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                {order.updatedAt !== order.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Last Updated</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}
