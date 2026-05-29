'use client';

import Script from 'next/script';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAppSelector } from '@/lib/redux/hooks';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCheckout } from './hooks/useCheckout';
import { StepIndicator } from './components/StepIndicator';
import { ShippingStep } from './components/ShippingStep';
import { PaymentStep } from './components/PaymentStep';
import { ReviewStep } from './components/ReviewStep';
import type { CartItem } from '@/types/order';

interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: unknown): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const {
    step,
    setStep,
    selectedAddressId,
    setSelectedAddressId,
    useNewAddress,
    setUseNewAddress,
    orderError,
    setOrderError,
    paymentMethod,
    setPaymentMethod,
    isProcessingOrder,
    newAddrForm,
    setNewAddrForm,
    cartItems,
    addresses,
    subtotal,
    shipping,
    discount,
    tax,
    total,
    coupon,
    hasSavedAddresses,
    showNewForm,
    canContinue,
    handlePlaceOrder,
    selectedAddress,
  } = useCheckout();

  if (!isAuthenticated) {
    return (
      <div className="container-mono py-16">
        <Card className="max-w-md mx-auto text-center p-12">
          <h2 className="text-2xl font-semibold mb-4">Sign in to checkout</h2>
          <p className="text-muted-foreground mb-8">Please log in to continue with your purchase</p>
          <Link href="/login">
            <Button className="w-full" size="lg">Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container-mono py-16">
        <Card className="max-w-md mx-auto text-center p-12">
          <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Add some items to your cart before checkout</p>
          <Link href="/products">
            <Button className="w-full" size="lg">Browse Products</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      
      <div className="container-mono py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/cart">
            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Flow */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Checkout</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Step Indicator */}
                <StepIndicator step={step} />

                {/* Error Message */}
                {orderError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {orderError}
                  </div>
                )}

                {/* Step Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {step === 1 && (
                      <ShippingStep
                        addresses={addresses as Address[]}
                        selectedAddressId={selectedAddressId}
                        setSelectedAddressId={setSelectedAddressId}
                        showNewForm={showNewForm}
                        setUseNewAddress={setUseNewAddress}
                        newAddrForm={newAddrForm}
                        setNewAddrForm={setNewAddrForm}
                      />
                    )}

                    {step === 2 && (
                      <PaymentStep
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                        onBack={() => setStep(1)}
                      />
                    )}

                    {step === 3 && (
                      <ReviewStep
                        onBack={() => setStep(2)}
                        onPlaceOrder={handlePlaceOrder}
                        isProcessing={isProcessingOrder}
                        cartItems={cartItems as CartItem[]}
                        selectedAddress={selectedAddress as { label: string; street: string; city: string; state: string; pincode: string; country: string } | null}
                        paymentMethod={paymentMethod}
                        subtotal={subtotal}
                        shipping={shipping}
                        discount={discount}
                        tax={tax}
                        total={total}
                        coupon={(coupon ?? null) as { code?: string } | null}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Continue Button (for steps 1 & 2) */}
                {step < 3 && (
                  <div className="mt-8 flex justify-end">
                    <Button
                      onClick={() => setStep(step + 1)}
                      disabled={step === 1 && !canContinue}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      Continue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
