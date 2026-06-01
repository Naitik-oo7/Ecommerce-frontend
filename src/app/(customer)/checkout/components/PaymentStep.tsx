'use client';

import { CreditCard, Wallet, Check } from 'lucide-react';
import type { PaymentMethod } from '../hooks/useCheckout';

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
}

const OPTIONS: {
  value: PaymentMethod;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'online',
    title: 'Pay Online',
    desc: 'Card, UPI, or Net Banking — secured by Razorpay',
    icon: CreditCard,
  },
  {
    value: 'cod',
    title: 'Cash on Delivery',
    desc: 'Pay in cash when your order arrives',
    icon: Wallet,
  },
];

export function PaymentStep({ paymentMethod, setPaymentMethod }: PaymentStepProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isSelected = paymentMethod === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPaymentMethod(opt.value)}
            className={`text-left rounded-2xl border p-4 transition-all ${
              isSelected
                ? 'border-[#C7A27C] bg-[#C7A27C]/5 ring-1 ring-[#C7A27C]'
                : 'border-[#E5E2DD] bg-white hover:border-[#C7A27C]/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-[#C7A27C] text-white' : 'bg-[#F6F3EE] text-[#C7A27C]'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-[#111111]">{opt.title}</span>
                  {isSelected && <Check className="h-4 w-4 text-[#C7A27C]" />}
                </div>
                <p className="text-sm text-[#9B9B9B]">{opt.desc}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
