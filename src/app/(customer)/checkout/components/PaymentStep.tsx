'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Wallet, ArrowLeft } from 'lucide-react';
import type { PaymentMethod } from '../hooks/useCheckout';

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  onBack: () => void;
}

export function PaymentStep({ paymentMethod, setPaymentMethod, onBack }: PaymentStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          aria-label="Back to shipping"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-blue-700" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Payment Method</h2>
          <p className="text-sm text-muted-foreground">Choose how you want to pay</p>
        </div>
      </div>

      <div className="grid gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            paymentMethod === 'online' ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-blue-300'
          }`}
          onClick={() => setPaymentMethod('online')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              paymentMethod === 'online' ? 'bg-blue-100' : 'bg-muted'
            }`}>
              <CreditCard className={`h-6 w-6 ${paymentMethod === 'online' ? 'text-blue-700' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Pay Online</span>
                {paymentMethod === 'online' && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Selected</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Credit/Debit Card, UPI, Net Banking via Razorpay</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            paymentMethod === 'cod' ? 'ring-2 ring-green-500 border-green-500' : 'hover:border-green-300'
          }`}
          onClick={() => setPaymentMethod('cod')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              paymentMethod === 'cod' ? 'bg-green-100' : 'bg-muted'
            }`}>
              <Wallet className={`h-6 w-6 ${paymentMethod === 'cod' ? 'text-green-700' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Cash on Delivery</span>
                {paymentMethod === 'cod' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Selected</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Pay when your order is delivered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Secure Checkout:</strong> Your payment information is encrypted and secure. We never store your card details.
        </p>
      </div>
    </div>
  );
}
