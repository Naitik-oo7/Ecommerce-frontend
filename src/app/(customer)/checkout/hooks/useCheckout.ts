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

export function useCheckout() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const [step, setStep] = useState(1);
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

  const cart = extractCart(cartResponse);
  const cartItems = (cart as { items?: unknown[] })?.items || [];
  const addresses = (addressesResponse as unknown[]) || [];

  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + parseFloat(item.product?.price || 0) * item.quantity,
    0
  );
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const coupon = (cart as { appliedCoupon?: { type: string; value: number } })?.appliedCoupon;
  const discount = coupon
    ? coupon.type === 'percentage'
      ? (subtotal * coupon.value) / 100
      : Math.min(coupon.value, subtotal)
    : 0;
  const tax = (subtotal - discount) * 0.1;
  const total = subtotal - discount + shipping + tax;

  const isProcessingOrder = isPlacingOrder || isCreatingPayment || isVerifyingPayment || isProcessing;

  const hasSavedAddresses = addresses.length > 0;
  const showNewForm = !hasSavedAddresses || useNewAddress;
  const newFormValid = !!(newAddrForm.label && newAddrForm.street && newAddrForm.city && newAddrForm.state && newAddrForm.pincode && newAddrForm.country);
  const canContinue = showNewForm ? newFormValid : !!selectedAddressId;

  const handleRazorpayPayment = async (orderId: number, paymentData: any) => {
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
      handler: async (response: any) => {
        try {
          await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }).unwrap();
          dispatch(cartApi.util.invalidateTags(['Cart']));
          router.push(`/order-placed/${orderId}?success=true&payment=success`);
        } catch (err: any) {
          setOrderError(err?.data?.message || 'Payment verification failed. Your payment may have been captured — please check your orders.');
          setIsProcessing(false);
          router.push(`/order-placed/${orderId}?payment=failed`);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: { color: '#C4A484' },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          router.push(`/order-placed/${orderId}?payment=pending`);
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
        addressId = (res as any)?.data?.id || (res as any)?.id;
      }

      if (!addressId) {
        setOrderError('Please select or enter a shipping address.');
        setIsProcessing(false);
        return;
      }

      const order = await createOrder({
        addressId,
        paymentMethod,
        ...(coupon ? { couponId: (cart as any)?.appliedCoupon?.id } : {}),
      }).unwrap();
      const orderId = (order as any)?.data?.id || (order as any)?.id;

      if (paymentMethod === 'cod') {
        dispatch(cartApi.util.invalidateTags(['Cart']));
        router.push(`/order-placed/${orderId}?success=true`);
      } else {
        const payment = await createPayment({ orderId }).unwrap();
        await handleRazorpayPayment(orderId, payment);
      }
    } catch (err: any) {
      setOrderError(err?.data?.message || 'Failed to place order.');
      setIsProcessing(false);
    }
  };

  const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId);

  return {
    step,
    setStep,
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
    hasSavedAddresses,
    showNewForm,
    canContinue,
    handlePlaceOrder,
    selectedAddress,
    isAuthenticated,
    user,
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}
