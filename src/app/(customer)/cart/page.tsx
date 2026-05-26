'use client';

import { useState } from 'react';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,
} from '@/services/api/cartApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus, ShoppingBag, Tag, X, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/redux/hooks';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  staggerContainer, 
  staggerItem, 
  cartItem,
  fadeInUp,
  hoverLift 
} from '@/lib/animations';
import { EmptyState } from '@/components/common';
import { extractCart } from '@/lib/api-utils';

// ============================================
// MONO Cart Page - Premium Shopping Experience
// ============================================

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: cartResponse, isLoading } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeFromCart] = useRemoveFromCartMutation();
  const [clearCart] = useClearCartMutation();
  const [applyCoupon] = useApplyCouponMutation();
  const [removeCoupon] = useRemoveCouponMutation();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  if (!isAuthenticated) {
    return (
      <div className="container-mono py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md mx-auto text-center p-12">
            <div className="w-20 h-20 rounded-full bg-mono-cream flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-mono-terracotta" />
            </div>
            <h2 className="text-editorial text-2xl text-mono-charcoal mb-3">Sign in to view your cart</h2>
            <p className="text-muted-foreground mb-8">Access your saved items and continue shopping</p>
            <Link href="/login">
              <Button className="w-full bg-mono-charcoal hover:bg-mono-charcoal/90" size="lg">
                Login to Continue
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-mono py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl skeleton-shimmer" />
          ))}
        </motion.div>
      </div>
    );
  }

  const cart = extractCart(cartResponse);
  const cartItems = (cart as { items?: unknown[] })?.items || [];
  const appliedCoupon = cart?.appliedCoupon;

  if (cartItems.length === 0) {
    return (
      <div className="container-mono py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Discover our curated collection and find pieces that speak to your style"
          action={{ label: 'Browse Collection', href: '/' }}
        />
      </div>
    );
  }

  const setUpdating = (itemId: number, loading: boolean) => {
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      loading ? next.add(itemId) : next.delete(itemId);
      return next;
    });
  };

  // Updated: Now uses itemId (cart item ID) instead of productId
  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    setUpdating(itemId, true);
    try {
      await updateCartItem({ itemId, quantity }).unwrap();
    } catch {}
    setUpdating(itemId, false);
  };

  // Updated: Now uses itemId (cart item ID) instead of productId
  const handleRemove = async (itemId: number) => {
    setRemovingIds((prev) => new Set(prev).add(itemId));
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      await removeFromCart(itemId).unwrap();
    } catch {}
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  // Helper to get primary image from product
  const getPrimaryImage = (product: any) => {
    return product?.primaryImage || null;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      await applyCoupon(couponCode.trim().toUpperCase()).unwrap();
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err?.data?.message || 'Invalid coupon code');
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = async () => {
    setCouponError('');
    await removeCoupon(undefined).unwrap().catch(() => {});
  };

  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + parseFloat(item.product?.price ?? 0) * item.quantity,
    0
  );
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const discount = appliedCoupon
    ? appliedCoupon.type === 'percentage'
      ? (subtotal * appliedCoupon.value) / 100
      : Math.min(appliedCoupon.value, subtotal)
    : 0;
  const tax = (subtotal - discount) * 0.1;
  const total = subtotal - discount + shipping + tax;

  return (
    <div className="container-mono py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
      >
        <div>
          <span className="label-caps text-mono-terracotta mb-2 block">Shopping Cart</span>
          <h1 className="text-editorial text-3xl md:text-4xl text-mono-charcoal">
            {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => clearCart(undefined).catch(() => {})}
          className="text-sm text-mono-rose hover:text-mono-rose/80 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Trash2 className="h-4 w-4" />
          Clear Cart
        </motion.button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Cart Items */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {cartItems.map((item: any) => {
              const variant = item.variant;
              const product = item.product;
              const isRemoving = removingIds.has(item.id);
              const isUpdating = updatingIds.has(item.id);
              
              if (!product) return null;
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  variants={cartItem}
                  initial="hidden"
                  animate={isRemoving ? "exit" : "visible"}
                  exit="exit"
                  className="group"
                >
                  <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex gap-4 sm:gap-6">
                        {/* Product Image */}
                        <Link href={`/products/${product.slug}`} className="flex-shrink-0">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-muted rounded-xl overflow-hidden">
                            {getPrimaryImage(product) ? (
                              <img src={getPrimaryImage(product)} alt={product.name} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                            )}
                          </div>
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${product.slug}`}>
                            <h3 className="font-semibold text-foreground hover:text-mono-terracotta transition-colors line-clamp-2">{product.name}</h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">{product.category?.name}</p>
                          {/* Show Size */}
                          <p className="text-xs text-mono-terracotta mt-1 font-medium">Size: {item.size}</p>
                          {/* Stock check on variant */}
                          {variant.stock < item.quantity && (
                            <p className="text-xs text-mono-rose mt-1">Only {variant.stock} in stock</p>
                          )}
                        </div>

                        {/* Quantity & Actions */}
                        <div className="flex flex-col items-end justify-between">
                          <p className="font-semibold text-mono-charcoal">${(parseFloat(product.price) * item.quantity).toFixed(2)}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-input rounded-xl overflow-hidden bg-card">
                              <button className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-30" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || isUpdating}>
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-10 text-center text-sm font-medium">{isUpdating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : item.quantity}</span>
                              <button className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-30" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= variant.stock || isUpdating}>
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <button onClick={() => handleRemove(item.id)} disabled={isRemoving} className="p-2 text-muted-foreground hover:text-mono-rose transition-colors"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-1">
          <Card className="sticky top-24 overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div>
                <span className="label-caps text-mono-terracotta mb-2 block">Summary</span>
                <h2 className="text-xl font-semibold text-mono-charcoal">Order Details</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0)} items)</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-medium">-${discount.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Tax (10%)</span><span className="font-medium">${tax.toFixed(2)}</span></div>
                <div className="border-t border-border/50 pt-3 flex justify-between"><span className="font-semibold text-base">Total</span><span className="font-bold text-xl text-mono-charcoal">${total.toFixed(2)}</span></div>
              </div>

              {/* Coupon Section */}
              <div className="space-y-2">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><Tag className="h-4 w-4 text-green-600" /></div><span className="font-mono font-bold text-green-700">{appliedCoupon.code}</span></div>
                    <button onClick={handleRemoveCoupon} className="p-1.5 text-green-600 hover:text-mono-rose hover:bg-red-50 rounded-lg"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="pl-10" /></div>
                      <Button variant="outline" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="px-4">{couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}</Button>
                    </div>
                    {couponError && <p className="text-xs text-mono-rose">{couponError}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <Link href="/checkout"><Button className="w-full h-12 text-base bg-mono-charcoal hover:bg-mono-charcoal/90" size="lg">Proceed to Checkout<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                <Link href="/"><Button variant="ghost" className="w-full" size="sm">Continue Shopping</Button></Link>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
                <div className="text-center"><Sparkles className="h-4 w-4 mx-auto mb-1 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Quality</span></div>
                <div className="text-center"><Tag className="h-4 w-4 mx-auto mb-1 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Best Price</span></div>
                <div className="text-center"><X className="h-4 w-4 mx-auto mb-1 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Easy Returns</span></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
