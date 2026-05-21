'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Truck, CreditCard, CheckCircle, MapPin, Package, Loader2, Wallet,
  ArrowLeft, Shield, Sparkles 
} from 'lucide-react';
import { useGetCartQuery, cartApi } from '@/services/api/cartApi';
import { useGetAddressesQuery, useCreateAddressMutation } from '@/services/api/addressesApi';
import { useCreateOrderMutation } from '@/services/api/ordersApi';
import { useCreatePaymentMutation, useVerifyPaymentMutation } from '@/services/api/paymentsApi';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  staggerContainer, 
  staggerItem
} from '@/lib/animations';

type NewAddressForm = {
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

type PaymentMethod = 'online' | 'cod';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [isProcessing, setIsProcessing] = useState(false);

  const [newAddrForm, setNewAddrForm] = useState<NewAddressForm>({
    label: 'Home', street: '', city: '', state: '', pincode: '', country: 'India',
  });

  const { data: cartResponse } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: addressesResponse } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });
  const [createOrder, { isLoading: isPlacingOrder }] = useCreateOrderMutation();
  const [createPayment, { isLoading: isCreatingPayment }] = useCreatePaymentMutation();
  const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifyPaymentMutation();
  const [createAddress] = useCreateAddressMutation();

  const cartData = (cartResponse as any)?.data || cartResponse;
  const cart = cartData?.cart || cartData;
  const cartItems = cart?.items || [];
  const addresses = (addressesResponse as any) || [];

  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + parseFloat(item.product?.price || 0) * item.quantity,
    0
  );
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const coupon = cart?.appliedCoupon;
  const discount = coupon
    ? coupon.type === 'percentage'
      ? (subtotal * coupon.value) / 100
      : Math.min(coupon.value, subtotal)
    : 0;
  const tax = (subtotal - discount) * 0.1;
  const total = subtotal - discount + shipping + tax;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  const handleRazorpayPayment = async (orderId: number, paymentData: any) => {
    if (!window.Razorpay) {
      setOrderError('Payment system is loading. Please wait a moment and try again.');
      setIsProcessing(false);
      return;
    }

    const options = {
      key: paymentData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: paymentData.razorpayOrder?.amount,
      currency: paymentData.razorpayOrder?.currency || 'INR',
      name: 'MONO',
      description: `Order #${orderId}`,
      order_id: paymentData.razorpayOrder?.id,
      handler: async (response: any) => {
        try {
          await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }).unwrap();
          dispatch(cartApi.util.invalidateTags(['Cart']));
          router.push(`/orders/${orderId}?success=true&payment=success`);
        } catch (err: any) {
          setOrderError(err?.data?.message || 'Payment verification failed. Your payment may have been captured — please check your orders.');
          setIsProcessing(false);
          router.push(`/orders/${orderId}?payment=failed`);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: { color: '#C4A484' },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          router.push(`/orders/${orderId}?payment=pending`);
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handlePlaceOrder = async () => {
    setOrderError('');
    setIsProcessing(true);
    try {
      let addressId = selectedAddressId;

      if (showNewForm) {
        const res = await createAddress(newAddrForm).unwrap();
        addressId = (res as any)?.data?.id || (res as any)?.id;
      }

      if (!addressId) {
        setOrderError('Please select or enter a shipping address.');
        setIsProcessing(false);
        return;
      }

      const order = await createOrder({ addressId, paymentMethod, ...(coupon?.id ? { couponId: coupon.id } : {}) }).unwrap();
      const orderId = (order as any)?.data?.id || (order as any)?.id;
      dispatch(cartApi.util.invalidateTags(['Cart']));

      if (paymentMethod === 'cod') {
        router.push(`/orders/${orderId}?success=true`);
      } else {
        const payment = await createPayment({ orderId }).unwrap();
        const paymentData = (payment as any)?.data || payment;
        await handleRazorpayPayment(orderId, paymentData);
      }
    } catch (err: any) {
      setOrderError(err?.data?.message || 'Failed to place order.');
      setIsProcessing(false);
    }
  };

  const hasSavedAddresses = addresses.length > 0;
  const showNewForm = !hasSavedAddresses || useNewAddress;
  const newFormValid = !!(newAddrForm.label && newAddrForm.street && newAddrForm.city && newAddrForm.state && newAddrForm.pincode && newAddrForm.country);
  const canContinue = showNewForm ? newFormValid : !!selectedAddressId;
  const isProcessingOrder = isPlacingOrder || isCreatingPayment || isVerifyingPayment || isProcessing;

  const steps = [
    { number: 1, label: 'Shipping', icon: Truck },
    { number: 2, label: 'Payment', icon: CreditCard },
    { number: 3, label: 'Review', icon: Package },
  ];

  if (!isAuthenticated || cartItems.length === 0) {
    return null;
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <div className="container-mono py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Link href="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="text-editorial text-3xl md:text-4xl text-mono-charcoal">Checkout</h1>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={s.number} className="flex items-center gap-2">
                  <motion.div className={`flex items-center gap-2 ${step >= s.number ? 'text-mono-charcoal' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all ${
                      step > s.number 
                        ? 'bg-mono-charcoal border-mono-charcoal text-white' :
                        step === s.number 
                          ? 'border-mono-terracotta text-mono-terracotta' 
                          : 'border-muted-foreground/30'
                    }`}>
                      {step > s.number ? <CheckCircle className="h-4 w-4" /> : s.number}
                    </div>
                    <span className="font-medium hidden sm:block text-sm">{s.label}</span>
                  </motion.div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 mx-2 w-8 ${step > s.number ? 'bg-mono-charcoal' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <Card>
                    <CardHeader className="bg-muted/30 border-b">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5 text-mono-terracotta" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {hasSavedAddresses && !useNewAddress && (
                        <div className="space-y-3">
                          {addresses.map((addr: any) => (
                            <label key={addr.id} className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                              selectedAddressId === addr.id 
                                ? 'border-mono-terracotta bg-mono-terracotta/5' 
                                : 'hover:bg-muted/50 border-border/50'
                            }`}>
                              <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1 accent-mono-terracotta" />
                              <div className="text-sm">
                                <p className="font-semibold capitalize">{addr.label} {addr.isDefault && <span className="text-xs text-mono-terracotta">(Default)</span>}</p>
                                <p className="text-muted-foreground">{addr.street}</p>
                                <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.pincode}</p>
                              </div>
                            </label>
                          ))}
                          <button onClick={() => { setUseNewAddress(true); setSelectedAddressId(null); }} className="w-full p-4 border-2 border-dashed rounded-xl text-muted-foreground hover:border-mono-terracotta hover:text-mono-terracotta transition-all">
                            + Add a new address
                          </button>
                        </div>
                      )}

                      {showNewForm && (
                        <div className="space-y-4">
                          {hasSavedAddresses && (
                            <button onClick={() => setUseNewAddress(false)} className="text-sm text-muted-foreground flex items-center gap-1">
                              <ArrowLeft className="h-3 w-3" /> Back to saved addresses
                            </button>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Label *</Label><Input value={newAddrForm.label} onChange={(e) => setNewAddrForm({ ...newAddrForm, label: e.target.value })} placeholder="Home, Work, etc." /></div>
                            <div className="space-y-2"><Label>Street Address *</Label><Input value={newAddrForm.street} onChange={(e) => setNewAddrForm({ ...newAddrForm, street: e.target.value })} placeholder="123 Main St" /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>City *</Label><Input value={newAddrForm.city} onChange={(e) => setNewAddrForm({ ...newAddrForm, city: e.target.value })} placeholder="Mumbai" /></div>
                            <div className="space-y-2"><Label>State *</Label><Input value={newAddrForm.state} onChange={(e) => setNewAddrForm({ ...newAddrForm, state: e.target.value })} placeholder="Maharashtra" /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Pincode *</Label><Input value={newAddrForm.pincode} onChange={(e) => setNewAddrForm({ ...newAddrForm, pincode: e.target.value })} placeholder="400001" /></div>
                            <div className="space-y-2"><Label>Country *</Label><Input value={newAddrForm.country} onChange={(e) => setNewAddrForm({ ...newAddrForm, country: e.target.value })} placeholder="India" /></div>
                          </div>
                        </div>
                      )}

                      <Button className="w-full h-12 bg-mono-charcoal hover:bg-mono-charcoal/90" onClick={() => setStep(2)} disabled={!canContinue} size="lg">
                        Continue to Payment <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <Card>
                    <CardHeader className="bg-muted/30 border-b">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CreditCard className="h-5 w-5 text-mono-terracotta" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <label className={`flex items-start gap-4 p-5 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-mono-terracotta bg-mono-terracotta/5' : 'hover:bg-muted/50 border-border/50'}`}>
                        <input type="radio" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="mt-1 accent-mono-terracotta" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full bg-mono-terracotta/10 flex items-center justify-center"><Wallet className="h-4 w-4 text-mono-terracotta" /></div>
                            <span className="font-semibold">Online Payment (Razorpay)</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Pay securely using UPI, Cards, NetBanking, or Wallets</p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-4 p-5 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-mono-terracotta bg-mono-terracotta/5' : 'hover:bg-muted/50 border-border/50'}`}>
                        <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="mt-1 accent-mono-terracotta" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full bg-mono-cream flex items-center justify-center"><Package className="h-4 w-4 text-mono-charcoal" /></div>
                            <span className="font-semibold">Cash on Delivery</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Pay when your order is delivered</p>
                        </div>
                      </label>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">Back</Button>
                        <Button className="flex-1 h-12 bg-mono-charcoal hover:bg-mono-charcoal/90" onClick={() => setStep(3)} size="lg">
                          Review Order <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <Card>
                    <CardHeader className="bg-muted/30 border-b">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5 text-mono-terracotta" />
                        Review Order
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="label-caps text-mono-stone">Shipping To</span>
                          <button onClick={() => setStep(1)} className="text-xs text-mono-terracotta hover:underline">Edit</button>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-4 text-sm">
                          {!showNewForm && selectedAddressId ? (
                            (() => {
                              const addr = addresses.find((a: any) => a.id === selectedAddressId);
                              return addr ? (
                                <div>
                                  <p className="font-semibold capitalize">{addr.label}</p>
                                  <p className="text-muted-foreground">{addr.street}</p>
                                  <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.pincode}</p>
                                </div>
                              ) : null;
                            })()
                          ) : (
                            <div>
                              <p className="font-semibold capitalize">{newAddrForm.label}</p>
                              <p className="text-muted-foreground">{newAddrForm.street}</p>
                              <p className="text-muted-foreground">{newAddrForm.city}, {newAddrForm.state} {newAddrForm.pincode}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="label-caps text-mono-stone">Items ({cartItems.length})</span>
                        </div>
                        <div className="space-y-3">
                          {cartItems.map((item: any) => {
                            const product = item.product;
                            const primaryImage = product?.primaryImage;
                            return (
                              <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                                <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                                  {primaryImage && <img src={primaryImage} alt={product?.name} className="object-cover w-full h-full" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{product?.name}</p>
                                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} · Size: {item.size}</p>
                                </div>
                                <p className="text-sm font-semibold">${(parseFloat(product?.price || 0) * item.quantity).toFixed(2)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="label-caps text-mono-stone">Payment</span>
                          <button onClick={() => setStep(2)} className="text-xs text-mono-terracotta hover:underline">Edit</button>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === 'online' ? 'bg-mono-terracotta/10' : 'bg-mono-cream'}`}>
                            {paymentMethod === 'online' ? <Wallet className="h-5 w-5 text-mono-terracotta" /> : <Package className="h-5 w-5 text-mono-charcoal" />}
                          </div>
                          <span className="font-medium">{paymentMethod === 'online' ? 'Online Payment (Razorpay)' : 'Cash on Delivery'}</span>
                        </div>
                      </div>

                      {orderError && (
                        <div className="p-4 bg-mono-rose/10 border border-mono-rose/20 rounded-xl text-sm text-mono-rose">
                          {orderError}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12" disabled={isProcessingOrder}>Back</Button>
                        <Button className="flex-1 h-12 bg-mono-charcoal hover:bg-mono-charcoal/90" onClick={handlePlaceOrder} disabled={isProcessingOrder} size="lg">
                          {isProcessingOrder ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : <>Place Order · ${total.toFixed(2)}</>}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div>
                  <span className="label-caps text-mono-terracotta mb-2 block">Summary</span>
                  <h2 className="text-lg font-semibold text-mono-charcoal">Order Total</h2>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({coupon?.code})</span>
                      <span className="font-medium">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                      {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border/50 pt-3 flex justify-between font-bold text-lg">
                    <span className="text-mono-charcoal">Total</span>
                    <span className="text-mono-charcoal">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
                  <div className="text-center"><Shield className="h-4 w-4 mx-auto mb-1 text-mono-terracotta" /><span className="text-[10px] text-muted-foreground">Secure</span></div>
                  <div className="text-center"><Sparkles className="h-4 w-4 mx-auto mb-1 text-mono-terracotta" /><span className="text-[10px] text-muted-foreground">Quality</span></div>
                  <div className="text-center"><Package className="h-4 w-4 mx-auto mb-1 text-mono-terracotta" /><span className="text-[10px] text-muted-foreground">Fast</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
