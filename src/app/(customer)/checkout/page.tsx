'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, CreditCard, CheckCircle, MapPin, Package, Loader2 } from 'lucide-react';
import { useGetCartQuery } from '@/services/api/cartApi';
import { useGetAddressesQuery, useCreateAddressMutation } from '@/services/api/addressesApi';
import { useCreateOrderMutation } from '@/services/api/ordersApi';
import { useAppSelector } from '@/lib/redux/hooks';
import Link from 'next/link';

type NewAddressForm = {
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [orderError, setOrderError] = useState('');

  const [newAddrForm, setNewAddrForm] = useState<NewAddressForm>({
    label: 'Home', street: '', city: '', state: '', pincode: '', country: 'India',
  });

  const { data: cartResponse } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: addressesResponse } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });
  const [createOrder, { isLoading: isPlacingOrder }] = useCreateOrderMutation();
  const [createAddress] = useCreateAddressMutation();

  const cartData = (cartResponse as any)?.data || cartResponse;
  const cart = cartData?.cart || cartData;
  const cartItems = cart?.items || [];
  const addresses = (addressesResponse as any)?.data || [];

  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + parseFloat(item.product?.price || 0) * item.quantity,
    0
  );
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const coupon = cart?.appliedCoupon;
  const discount = coupon
    ? coupon.type === 'percentage'
      ? (subtotal * coupon.value) / 100
      : Math.min(coupon.value, subtotal)
    : 0;
  const tax = (subtotal - discount) * 0.1;
  const total = subtotal - discount + shipping + tax;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="mb-4">Please login to checkout.</p>
        <Link href="/login"><Button>Login</Button></Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <Link href="/"><Button className="mt-4">Browse Products</Button></Link>
      </div>
    );
  }

  const hasSavedAddresses = addresses.length > 0;
  const showNewForm = !hasSavedAddresses || useNewAddress;

  const newFormValid = !!(newAddrForm.label && newAddrForm.street && newAddrForm.city && newAddrForm.state && newAddrForm.pincode && newAddrForm.country);
  const canContinue = showNewForm ? newFormValid : !!selectedAddressId;

  const handlePlaceOrder = async () => {
    setOrderError('');
    try {
      let addressId = selectedAddressId;

      if (showNewForm) {
        const res = await createAddress(newAddrForm).unwrap();
        addressId = (res as any)?.data?.id || (res as any)?.id;
      }

      if (!addressId) {
        setOrderError('Please select or enter a shipping address.');
        return;
      }

      const order = await createOrder({ addressId }).unwrap();
      const orderId = (order as any)?.data?.id || (order as any)?.id;
      router.push(`/orders/${orderId}?success=true`);
    } catch (err: any) {
      setOrderError(err?.data?.message || 'Failed to place order. Please try again.');
    }
  };

  const steps = [
    { number: 1, label: 'Shipping', icon: Truck },
    { number: 2, label: 'Review', icon: Package },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s.number} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${step >= s.number ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-colors ${
                    step > s.number ? 'bg-primary border-primary text-primary-foreground' :
                    step === s.number ? 'border-primary text-primary' : 'border-muted-foreground'
                  }`}>
                    {step > s.number ? <CheckCircle className="h-4 w-4" /> : s.number}
                  </div>
                  <span className="font-medium hidden sm:block">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 mx-2 w-12 ${step > s.number ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasSavedAddresses && !useNewAddress && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Saved Addresses</p>
                    {addresses.map((addr: any) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1"
                        />
                        <div className="text-sm">
                          <p className="font-semibold capitalize">
                            {addr.label}
                            {addr.isDefault && <span className="ml-2 text-xs text-primary font-normal">(Default)</span>}
                          </p>
                          <p className="text-muted-foreground">{addr.street}</p>
                          <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.pincode}</p>
                          <p className="text-muted-foreground">{addr.country}</p>
                        </div>
                      </label>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => { setUseNewAddress(true); setSelectedAddressId(null); }}
                    >
                      + Use a different address
                    </Button>
                  </div>
                )}

                {showNewForm && (
                  <div className="space-y-4">
                    {hasSavedAddresses && (
                      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setUseNewAddress(false)}>
                        ← Back to saved addresses
                      </Button>
                    )}
                    <div className="space-y-1">
                      <Label>Label * <span className="text-muted-foreground font-normal text-xs">(Home, Work, etc.)</span></Label>
                      <Input
                        value={newAddrForm.label}
                        onChange={(e) => setNewAddrForm({ ...newAddrForm, label: e.target.value })}
                        placeholder="Home"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Street Address *</Label>
                      <Input
                        value={newAddrForm.street}
                        onChange={(e) => setNewAddrForm({ ...newAddrForm, street: e.target.value })}
                        placeholder="123 MG Road, Flat 4B"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>City *</Label>
                        <Input value={newAddrForm.city} onChange={(e) => setNewAddrForm({ ...newAddrForm, city: e.target.value })} placeholder="Mumbai" />
                      </div>
                      <div className="space-y-1">
                        <Label>State *</Label>
                        <Input value={newAddrForm.state} onChange={(e) => setNewAddrForm({ ...newAddrForm, state: e.target.value })} placeholder="Maharashtra" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Pincode *</Label>
                        <Input value={newAddrForm.pincode} onChange={(e) => setNewAddrForm({ ...newAddrForm, pincode: e.target.value })} placeholder="400001" />
                      </div>
                      <div className="space-y-1">
                        <Label>Country *</Label>
                        <Input value={newAddrForm.country} onChange={(e) => setNewAddrForm({ ...newAddrForm, country: e.target.value })} placeholder="India" />
                      </div>
                    </div>
                  </div>
                )}

                <Button className="w-full mt-2" onClick={() => setStep(2)} disabled={!canContinue}>
                  Continue to Review
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Review Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">Shipping To</h3>
                  {!showNewForm && selectedAddressId ? (
                    (() => {
                      const addr = addresses.find((a: any) => a.id === selectedAddressId);
                      return addr ? (
                        <p className="text-sm">
                          <span className="font-medium capitalize">{addr.label}</span><br />
                          {addr.street}<br />
                          {addr.city}, {addr.state} {addr.pincode}, {addr.country}
                        </p>
                      ) : null;
                    })()
                  ) : (
                    <p className="text-sm">
                      <span className="font-medium capitalize">{newAddrForm.label}</span><br />
                      {newAddrForm.street}<br />
                      {newAddrForm.city}, {newAddrForm.state} {newAddrForm.pincode}, {newAddrForm.country}
                    </p>
                  )}
                  <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs text-muted-foreground" onClick={() => setStep(1)}>
                    Edit
                  </Button>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Items ({cartItems.length})</h3>
                  <div className="space-y-3">
                    {cartItems.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                          {item.product?.images?.[0] && (
                            <img src={item.product.images[0]} alt={item.product.name} className="object-cover w-full h-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold flex-shrink-0">
                          ${(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">Payment</h3>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Cash on Delivery</span>
                  </div>
                </div>

                {orderError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                    {orderError}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button className="flex-1" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                    {isPlacingOrder ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order...</>
                    ) : (
                      `Place Order · $${total.toFixed(2)}`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] && (
                        <img src={item.product.images[0]} alt={item.product.name} className="object-cover w-full h-full" />
                      )}
                    </div>
                    <span className="flex-1 truncate">{item.product?.name}</span>
                    <span className="font-medium flex-shrink-0 text-muted-foreground">×{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({coupon?.code})</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">Free shipping on orders over $50</p>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t text-base">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
