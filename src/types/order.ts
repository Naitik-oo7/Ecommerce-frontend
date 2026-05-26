import { OrderStatus } from '@/constants';

export interface Order {
  id: number;
  orderNumber?: string;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  total: number;
  subtotal: number;
  shipping: number;
  discount?: number;
  tax?: number;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  address?: OrderAddress;
  coupon?: OrderCoupon;
}

export interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    slug: string;
    media?: { url: string }[];
    images?: string[];
  };
  variant?: {
    id: number;
    size: string;
    color: string;
  };
  quantity: number;
  price: number;
}

export interface OrderAddress {
  id: number;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderCoupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface Cart {
  id?: number;
  items: CartItem[];
  appliedCoupon?: OrderCoupon;
  subtotal?: number;
  shipping?: number;
  discount?: number;
  tax?: number;
  total?: number;
}

export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: string;
    media?: { url: string }[];
    images?: string[];
  };
  variant: {
    id: number;
    size: string;
    color?: string;
  };
  quantity: number;
}
