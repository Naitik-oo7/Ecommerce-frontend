'use client';

import Script from 'next/script';
import Link from 'next/link';
import { ArrowLeft, MapPin, CreditCard, Package, ShieldCheck, Loader2, Truck, AlertCircle } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthLoading } from '@/components/auth/RequireAuth';
import { formatCurrency } from '@/lib/currency';
import { useCheckout } from './hooks/useCheckout';
import { ShippingStep } from './components/ShippingStep';
import { PaymentStep } from './components/PaymentStep';
import { OrderItemsReview } from './components/OrderItemsReview';

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

// A numbered section block in the left column.
function Section({
  step,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-[#E5E2DD] p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-11 h-11 rounded-xl bg-[#F6F3EE] flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-[#C7A27C]" />
          <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#111111] text-white text-[11px] font-semibold flex items-center justify-center">
            {step}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#111111]">{title}</h2>
          <p className="text-sm text-[#9B9B9B]">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function GuardCard({ title, body, cta, href }: { title: string; body: string; cta: string; href: string }) {
  return (
    <div className="container-mono py-16">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#E5E2DD] text-center p-10">
        <div className="w-14 h-14 rounded-2xl bg-[#F6F3EE] flex items-center justify-center mx-auto mb-5">
          <Package className="h-7 w-7 text-[#C7A27C]" />
        </div>
        <h2 className="text-xl font-semibold text-[#111111] mb-2">{title}</h2>
        <p className="text-sm text-[#9B9B9B] mb-7">{body}</p>
        <Link href={href}>
          <button className="w-full px-5 py-3 bg-[#111111] text-white text-sm font-medium rounded-full hover:bg-[#333] transition-colors">
            {cta}
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { ready, isAuthenticated } = useAuthGuard();
  const {
    selectedAddressId,
    setSelectedAddressId,
    setUseNewAddress,
    orderError,
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
    freeShipping,
    showNewForm,
    canPlaceOrder,
    handlePlaceOrder,
  } = useCheckout();

  if (!ready) return <AuthLoading />;

  if (!isAuthenticated) {
    return (
      <GuardCard
        title="Sign in to checkout"
        body="Please log in to continue with your purchase."
        cta="Login"
        href="/login"
      />
    );
  }

  if (cartItems.length === 0) {
    return (
      <GuardCard
        title="Your cart is empty"
        body="Add some items to your cart before checkout."
        cta="Browse Products"
        href="/products"
      />
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="container-mono py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C7A27C] block mb-1">Secure Checkout</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Complete your order</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Left: form sections */}
          <div className="lg:col-span-2 space-y-5">
            {orderError && (
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{orderError}</span>
              </div>
            )}

            <Section step={1} icon={MapPin} title="Shipping Address" subtitle="Where should we deliver your order?">
              <ShippingStep
                addresses={addresses as Address[]}
                selectedAddressId={selectedAddressId}
                setSelectedAddressId={setSelectedAddressId}
                showNewForm={showNewForm}
                setUseNewAddress={setUseNewAddress}
                newAddrForm={newAddrForm}
                setNewAddrForm={setNewAddrForm}
              />
            </Section>

            <Section step={2} icon={CreditCard} title="Payment Method" subtitle="Choose how you'd like to pay">
              <PaymentStep paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
            </Section>

            <Section step={3} icon={Package} title="Review Items" subtitle={`${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in your order`}>
              <OrderItemsReview cartItems={cartItems as Parameters<typeof OrderItemsReview>[0]['cartItems']} />
            </Section>
          </div>

          {/* Right: sticky order summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E5E2DD] p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-[#111111] mb-4">Order Summary</h2>

                {/* Free shipping progress */}
                {freeShipping && !freeShipping.eligible && freeShipping.remaining > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-[#F6F3EE] text-sm text-[#6B6B6B] flex items-start gap-2">
                    <Truck className="h-4 w-4 text-[#C7A27C] shrink-0 mt-0.5" />
                    <span>
                      Add <strong className="text-[#111111]">{formatCurrency(freeShipping.remaining)}</strong> more to unlock free shipping.
                    </span>
                  </div>
                )}

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Subtotal</span>
                    <span className="text-[#111111]">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#2F855A]">
                      <span>Discount{coupon?.code ? ` (${coupon.code})` : ''}</span>
                      <span>−{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Shipping</span>
                    <span className={shipping === 0 ? 'text-[#2F855A] font-medium' : 'text-[#111111]'}>
                      {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Tax</span>
                    <span className="text-[#111111]">{formatCurrency(tax)}</span>
                  </div>
                  <div className="border-t border-[#E5E2DD] pt-3 mt-1 flex justify-between items-baseline">
                    <span className="font-semibold text-[#111111]">Total</span>
                    <span className="text-xl font-bold text-[#111111]">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessingOrder || !canPlaceOrder}
                  className="mt-5 w-full h-12 rounded-full bg-[#111111] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingOrder ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'cod' ? 'Place Order' : 'Pay'} • {formatCurrency(total)}
                    </>
                  )}
                </button>

                {!canPlaceOrder && (
                  <p className="mt-2.5 text-xs text-[#9B9B9B] text-center">
                    {showNewForm ? 'Fill in your delivery address to continue.' : 'Select a delivery address to continue.'}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#9B9B9B]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#C7A27C]" />
                  Encrypted &amp; secure — we never store card details.
                </div>
              </div>

              <p className="text-xs text-[#9B9B9B] text-center px-2">
                By placing this order, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-[#111111]">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="underline hover:text-[#111111]">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
