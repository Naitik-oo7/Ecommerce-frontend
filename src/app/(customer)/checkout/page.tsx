'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, CreditCard, CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    shipping: {
      fullName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phone: '',
    },
    payment: {
      cardNumber: '',
      expiry: '',
      cvv: '',
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                {step > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
              </div>
              <span className="ml-2 font-medium">Shipping</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                {step > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 3 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Review</span>
            </div>
          </div>

          {/* Step 1: Shipping */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.shipping.fullName}
                      onChange={(e) => setFormData({
                        ...formData,
                        shipping: { ...formData.shipping, fullName: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.shipping.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        shipping: { ...formData.shipping, phone: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.shipping.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping: { ...formData.shipping, address: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.shipping.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        shipping: { ...formData.shipping, city: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.shipping.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        shipping: { ...formData.shipping, state: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.shipping.zipCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        shipping: { ...formData.shipping, zipCode: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.shipping.country}
                      onChange={(e) => setFormData({
                        ...formData,
                        shipping: { ...formData.shipping, country: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <Button onClick={() => setStep(2)} className="w-full">
                  Continue to Payment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.payment.cardNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      payment: { ...formData.payment, cardNumber: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={formData.payment.expiry}
                      onChange={(e) => setFormData({
                        ...formData,
                        payment: { ...formData.payment, expiry: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={formData.payment.cvv}
                      onChange={(e) => setFormData({
                        ...formData,
                        payment: { ...formData.payment, cvv: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Review Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.shipping.fullName}<br />
                    {formData.shipping.address}<br />
                    {formData.shipping.city}, {formData.shipping.state} {formData.shipping.zipCode}<br />
                    {formData.shipping.country}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Payment Method</h3>
                  <p className="text-sm text-muted-foreground">
                    Card ending in {formData.payment.cardNumber.slice(-4)}
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button className="flex-1">
                    Place Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>$0.00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
