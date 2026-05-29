'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, MapPin, Package, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { PaymentMethod } from '../hooks/useCheckout';

interface CartItem {
  id: number;
  product?: {
    name?: string;
    price?: string;
    media?: { url?: string }[];
  };
  variant?: {
    size?: string;
  };
  quantity: number;
}

interface ReviewStepProps {
  onBack: () => void;
  onPlaceOrder: () => void;
  isProcessing: boolean;
  cartItems: CartItem[];
  selectedAddress: {
    label: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  } | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  coupon: { code?: string } | null;
}

export function ReviewStep({
  onBack,
  onPlaceOrder,
  isProcessing,
  cartItems,
  selectedAddress,
  paymentMethod,
  subtotal,
  shipping,
  discount,
  tax,
  total,
  coupon,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          aria-label="Back to payment"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-700" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Review Order</h2>
          <p className="text-sm text-muted-foreground">Confirm your order details</p>
        </div>
      </div>

      {/* Cart Items */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Order Items ({cartItems.length})
          </h3>
          <div className="divide-y">
            {(cartItems as CartItem[]).map((item) => (
              <div key={item.id} className="py-3 flex gap-3">
                <div className="w-16 h-16 rounded-md bg-muted shrink-0">
                  {item.product?.media?.[0]?.url ? (
                    <img
                      src={item.product.media[0].url}
                      alt={item.product.name || ''}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Size: {item.variant?.size} • Qty: {item.quantity}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    ₹{(parseFloat(item.product?.price || '0') * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      {selectedAddress && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4" />
              Shipping to
            </h3>
            <div className="text-sm">
              <p className="font-medium capitalize">{selectedAddress.label}</p>
              <p className="text-muted-foreground">{selectedAddress.street}</p>
              <p className="text-muted-foreground">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}</p>
              <p className="text-muted-foreground">{selectedAddress.country}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Payment Method</h3>
          <p className="text-sm text-muted-foreground">
            {paymentMethod === 'online' ? 'Credit/Debit Card, UPI, or Net Banking (Razorpay)' : 'Cash on Delivery'}
          </p>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-medium">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Discount {coupon?.code ? `(${coupon.code})` : ''}
                </span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Place Order Button */}
      <Button
        onClick={onPlaceOrder}
        disabled={isProcessing}
        className="w-full h-14 text-lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>Place Order • ₹{total.toFixed(2)}</>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By placing this order, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
      </p>
    </div>
  );
}
