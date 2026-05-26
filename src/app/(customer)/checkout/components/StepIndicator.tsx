'use client';

import { Truck, CreditCard, CheckCircle } from 'lucide-react';

interface StepIndicatorProps {
  step: number;
}

const steps = [
  { label: 'Shipping', icon: Truck },
  { label: 'Payment', icon: CreditCard },
  { label: 'Review', icon: CheckCircle },
];

export function StepIndicator({ step }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-4">
        {steps.map((s, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          const Icon = s.icon;
          
          return (
            <div key={s.label} className="flex items-center">
              <div className={`flex flex-col items-center ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-amber-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs mt-1 font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-2 transition-colors ${
                    step > stepNum ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
