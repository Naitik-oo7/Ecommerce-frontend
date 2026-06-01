'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { useGetCartQuery, cartApi } from '@/services/api/cartApi';
import { useGetAddressesQuery, useCreateAddressMutation } from '@/services/api/addressesApi';
import { useCreateOrderMutation } from '@/services/api/ordersApi';
import { useCreatePaymentMutation, useVerifyPaymentMutation } from '@/services/api/paymentsApi';
import { extractCart } from '@/lib/api-utils';

export type PaymentMethod = 'online' | 'cod';

export interface NewAddressForm {
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface AppliedCoupon {
  id?: number;
  code?: string;
  type?: string;
  value?: number;
  discount?: number;
}

export interface FreeShippingInfo {
  threshold: number;
  eligible: boolean;
  remaining: number;
}

// Authoritative cart shape returned by the backend (cart.service).
// All money is computed server-side — the storefront must NOT recompute it.
interface CartShape {
  items?: unknown[];
  totalQuantity?: number;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total?: number;
  appliedCoupon?: AppliedCoupon | null;
  freeShipping?: FreeShippingInfo;
}

export function useCheckout() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [isProcessing, setIsProcessing] = useState(false);

  const [newAddrForm, setNewAddrForm] = useState<NewAddressForm>({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const { data: cartResponse } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: addressesResponse } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });
  const [createOrder, { isLoading: isPlacingOrder }] = useCreateOrderMutation();
  const [createPayment, { isLoading: isCreatingPayment }] = useCreatePaymentMutation();
  const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifyPaymentMutation();
  const [createAddress] = useCreateAddressMutation();

  const cart = (extractCart(cartResponse) as CartShape) ?? {};
  const cartItems = cart.items ?? [];
  const addresses = (addressesResponse as unknown[]) || [];

  // Money breakdown — read straight from the authoritative cart response.
  const subtotal = cart.subtotal ?? 0;
  const discount = cart.discount ?? 0;
  const shipping = cart.shipping ?? 0;
  const tax = cart.tax ?? 0;
  const total = cart.total ?? 0;
  const coupon = cart.appliedCoupon ?? null;
  const freeShipping = cart.freeShipping ?? null;

  const isProcessingOrder = isPlacingOrder || isCreatingPayment || isVerifyingPayment || isProcessing;

  const hasSavedAddresses = addresses.length > 0;
  const showNewForm = !hasSavedAddresses || useNewAddress;
  const newFormValid = !!(newAddrForm.label && newAddrForm.street && newAddrForm.city && newAddrForm.state && newAddrForm.pincode && newAddrForm.country);
  const canPlaceOrder = showNewForm ? newFormValid : !!selectedAddressId;

  interface PaymentData {
    key?: string;
    razorpayOrder?: {
      amount?: number;
      currency?: string;
      id?: string;
    };
  }

  interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }

  const handleRazorpayPayment = async (orderId: number, paymentData: PaymentData) => {
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        let elapsed = 0;
        const interval = setInterval(() => {
          elapsed += 200;
          if (window.Razorpay) {
            clearInterval(interval);
            resolve();
          } else if (elapsed >= 5000) {
            clearInterval(interval);
            reject(new Error('Razorpay SDK failed to load'));
          }
        }, 200);
      }).catch(() => {
        setOrderError('Payment system failed to load. Please refresh and try again.');
        setIsProcessing(false);
        return;
      });
    }
    if (!window.Razorpay) return;

    const options = {
      key: paymentData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: paymentData.razorpayOrder?.amount,
      currency: paymentData.razorpayOrder?.currency || 'INR',
      name: 'MONO',
      description: `Order #${orderId}`,
      order_id: paymentData.razorpayOrder?.id,
      handler: async (response: RazorpayResponse) => {
        try {
          await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }).unwrap();
          router.push(`/order-placed/${orderId}?success=true&payment=success`);
        } catch (err) {
          const errorWithData = err as { data?: { message?: string } };
          setOrderError(errorWithData?.data?.message || 'Payment verification failed. Your payment may have been captured — please check your orders.');
          setIsProcessing(false);
          router.push(`/profile/orders/${orderId}?payment=failed`);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: { color: '#C7A27C' },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          router.push(`/profile/orders/${orderId}?payment=pending`);
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handlePlaceOrder = async () => {
    setOrderError('');
    setIsProcessing(true);
    try {
      let addressId = selectedAddressId;

      if (showNewForm) {
        const res = await createAddress(newAddrForm).unwrap();
        const resWithData = res as { data?: { id?: number }; id?: number };
        addressId = resWithData?.data?.id ?? resWithData?.id ?? null;
      }

      if (!addressId) {
        setOrderError('Please select or enter a shipping address.');
        setIsProcessing(false);
        return;
      }

      const order = await createOrder({
        addressId,
        paymentMethod,
        ...(coupon?.id ? { couponId: coupon.id } : {}),
      }).unwrap();
      const orderWithData = order as { data?: { id?: number }; id?: number };
      const orderId = orderWithData?.data?.id ?? orderWithData?.id;

      if (!orderId) {
        setOrderError('Failed to create order. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Cart is cleared server-side at order creation — invalidate the client cache now
      dispatch(cartApi.util.invalidateTags(['Cart']));

      if (paymentMethod === 'cod') {
        router.push(`/order-placed/${orderId}?success=true`);
      } else {
        const payment = await createPayment({ orderId }).unwrap();
        await handleRazorpayPayment(orderId, payment);
      }
    } catch (err) {
      const errorWithData = err as { data?: { message?: string } };
      setOrderError(errorWithData?.data?.message || 'Failed to place order.');
      setIsProcessing(false);
    }
  };

  interface Address {
    id: number;
  }

  const selectedAddress = addresses.find((a) => (a as Address).id === selectedAddressId);

  return {
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
    freeShipping,
    hasSavedAddresses,
    showNewForm,
    canPlaceOrder,
    handlePlaceOrder,
    selectedAddress,
    isAuthenticated,
    user,
  };
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
