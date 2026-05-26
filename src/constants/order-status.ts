import { Clock, Package, Truck, CheckCircle, XCircle, LucideIcon } from 'lucide-react';

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  icon: LucideIcon;
}

export const ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: Package,
  },
  shipped: {
    label: 'Shipped',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    icon: XCircle,
  },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_CONFIG;
