'use client';

import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { hasLowStock, Variant } from '@/lib/admin-utils';

interface StockBadgeProps {
  stock: number;
  variants: Variant[];
}

export function StockBadge({ stock, variants }: StockBadgeProps) {
  const isLow = hasLowStock(variants);
  
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
        <XCircle className="h-3 w-3" /> Out of stock
      </span>
    );
  }
  
  if (isLow) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-mono-terracotta/10 text-mono-terracotta">
        <AlertTriangle className="h-3 w-3" /> Low ({stock})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-mono-sage/10 text-mono-sage">
      <CheckCircle2 className="h-3 w-3" /> {stock}
    </span>
  );
}

interface StatusToggleProps {
  isActive: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

export function StatusToggle({ isActive, onToggle, isLoading }: StatusToggleProps) {
  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
  
  return (
    <button
      onClick={onToggle}
      title={isActive ? 'Click to deactivate' : 'Click to activate'}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isActive ? 'bg-mono-sage' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          isActive ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

interface StatusLabelProps {
  isActive: boolean;
}

export function StatusLabel({ isActive }: StatusLabelProps) {
  return (
    <span className={`text-xs font-medium ${isActive ? 'text-mono-sage' : 'text-muted-foreground'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
