'use client';

import { useGetCartQuery } from '@/services/api/cartApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function CartPage() {
  const { data: cart, isLoading } = useGetCartQuery();
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const cartItems = (cart as any)?.items || [];
  const isEmpty = cartItems.length === 0;

  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center p-8">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some products to get started</p>
          <Link href="/">
            <Button>Browse Products</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + item.product.price * (quantities[item.id] || item.quantity),
    0
  );
  const shipping = 0;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-muted rounded-md flex-shrink-0">
                    {item.product.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="object-cover w-full h-full rounded-md"
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="font-semibold hover:text-primary">{item.product.name}</h3>
                    </Link>
                    <p className="text-muted-foreground text-sm">{item.product.category?.name}</p>
                    <p className="font-bold">${item.product.price}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newQty = Math.max(1, (quantities[item.id] || item.quantity) - 1);
                          setQuantities({ ...quantities, [item.id]: newQty });
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{quantities[item.id] || item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newQty = (quantities[item.id] || item.quantity) + 1;
                          setQuantities({ ...quantities, [item.id]: newQty });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    className="flex-1 border rounded-md px-3 py-2"
                  />
                  <Button variant="outline">Apply</Button>
                </div>
                <Link href="/checkout">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
