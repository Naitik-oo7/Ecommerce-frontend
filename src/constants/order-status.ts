import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowLeftCircle,
  LucideIcon,
} from 'lucide-react';

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  dot: string;
  icon: LucideIcon;
  step: number; // -1 = terminal/off-track, >=0 = progress position
}

export const ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900',
    dot: 'bg-amber-400',
    icon: Clock,
    step: 0,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-sky-700 dark:text-sky-400',
    bg: 'bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900',
    dot: 'bg-sky-400',
    icon: CheckCircle2,
    step: 1,
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900',
    dot: 'bg-blue-400',
    icon: Package,
    step: 2,
  },
  shipped: {
    label: 'Shipped',
    color: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-900',
    dot: 'bg-violet-400',
    icon: Truck,
    step: 3,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900',
    dot: 'bg-orange-400',
    icon: MapPin,
    step: 4,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-900',
    dot: 'bg-green-400',
    icon: CheckCircle,
    step: 5,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900',
    dot: 'bg-red-400',
    icon: XCircle,
    step: -1,
  },
  return_requested: {
    label: 'Return Requested',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-900',
    dot: 'bg-yellow-400',
    icon: RotateCcw,
    step: -1,
  },
  returned: {
    label: 'Returned',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700',
    dot: 'bg-slate-400',
    icon: ArrowLeftCircle,
    step: -1,
  },
} as const;

// The main forward progress steps (shown in progress tracker)
export const ORDER_PROGRESS_STEPS = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const;

export type OrderStatus = keyof typeof ORDER_STATUS_CONFIG;
