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
import { useAddToWishlistMutation } from '@/services/api/wishlistApi';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { updateGuestItem, removeGuestItem, clearGuestCart, type GuestCartItem } from '@/lib/redux/guestCartSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  X,
  ArrowRight,
  ArrowLeft,
  Heart,
  Loader2,
  Truck,
  ShieldCheck,
  RotateCcw,
  Lock,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthLoading } from '@/components/auth/RequireAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, cartItem } from '@/lib/animations';
import { EmptyState } from '@/components/common';
import { extractCart } from '@/lib/api-utils';
import { formatCurrency } from '@/lib/currency';
import type { Cart } from '@/types/order';

// ============================================
// MONO Cart — editorial, premium shopping experience
// Pricing is authoritative from the backend; this page never recomputes money.
// ============================================

function GuestCartView({
  items,
  dispatch,
}: {
  items: GuestCartItem[];
  dispatch: ReturnType<typeof useAppDispatch>;
}) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="container-mono py-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10"
      >
        <div>
          <span className="label-caps mb-2 block" style={{ color: TERRA }}>
            Shopping Bag
          </span>
          <h1 className="font-playfair text-4xl md:text-5xl text-mono-charcoal leading-none">Your Bag</h1>
          <p className="text-muted-foreground mt-2">
            {totalQuantity} {totalQuantity === 1 ? 'piece' : 'pieces'} saved
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => dispatch(clearGuestCart())}
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-mono-rose transition-colors self-start sm:self-auto"
        >
          <Trash2 className="h-4 w-4" />
          Clear bag
        </motion.button>
      </motion.div>

      {/* Sign-in banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ backgroundColor: `${TERRA}0d`, borderColor: `${TERRA}33` }}
      >
        <div>
          <p className="font-medium text-mono-charcoal">Sign in to checkout</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your items are saved. Sign in to place your order and track delivery.
          </p>
        </div>
        <Link href={`/login?redirect=${encodeURIComponent('/cart')}`} className="shrink-0">
          <Button className="bg-mono-charcoal hover:bg-mono-charcoal/90 rounded-xl px-6">
            Sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-14">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const unitPrice = item.price;
              const comparePrice = item.comparePrice ?? null;
              const lineTotal = unitPrice * item.quantity;
              const onSale = comparePrice && comparePrice > unitPrice;

              return (
                <motion.div
                  key={`${item.variantId}-${item.size}`}
                  layout
                  variants={cartItem}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="group rounded-3xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-border transition-all duration-300"
                >
                  <div className="flex gap-3 sm:gap-5">
                    <Link href={`/products/${item.productSlug}`} className="shrink-0">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-2xl overflow-hidden ring-1 ring-black/[0.04]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            sizes="(max-width: 640px) 96px, 128px"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No image
                          </div>
                        )}
                        {onSale && (
                          <span
                            className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: ROSE }}
                          >
                            Sale
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {item.category && (
                            <p className="label-caps text-[11px] text-muted-foreground mb-1">{item.category}</p>
                          )}
                          <Link href={`/products/${item.productSlug}`}>
                            <h3 className="font-medium text-base text-foreground hover:text-mono-terracotta transition-colors line-clamp-2 leading-snug">
                              {item.productName}
                            </h3>
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-mono-charcoal">
                              Size {item.size}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-mono-charcoal tabular-nums">{formatCurrency(lineTotal)}</p>
                          {onSale && (
                            <p className="text-xs text-muted-foreground line-through tabular-nums">
                              {formatCurrency(comparePrice! * item.quantity)}
                            </p>
                          )}
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{formatCurrency(unitPrice)} each</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mt-auto pt-4">
                        <div className="inline-flex items-center rounded-full border border-border bg-background">
                          <button
                            aria-label="Decrease quantity"
                            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                            onClick={() =>
                              dispatch(updateGuestItem({ variantId: item.variantId, size: item.size, quantity: item.quantity - 1 }))
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-9 text-center text-sm font-semibold tabular-nums text-mono-charcoal">
                            {item.quantity}
                          </span>
                          <button
                            aria-label="Increase quantity"
                            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                            onClick={() =>
                              dispatch(updateGuestItem({ variantId: item.variantId, size: item.size, quantity: item.quantity + 1 }))
                            }
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          aria-label="Remove item"
                          onClick={() =>
                            dispatch(removeGuestItem({ variantId: item.variantId, size: item.size }))
                          }
                          className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-mono-rose hover:bg-muted transition-colors rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-mono-charcoal transition-colors pt-2"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Continue shopping
          </Link>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 rounded-3xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-5 border-b border-border/50">
              <span className="label-caps mb-1.5 block" style={{ color: TERRA }}>
                Summary
              </span>
              <h2 className="font-playfair text-2xl text-mono-charcoal">Order Details</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({totalQuantity} items)</span>
                  <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping & taxes calculated at checkout after sign in.
                </p>
              </div>

              <div className="space-y-3">
                <Link href={`/login?redirect=${encodeURIComponent('/cart')}`} className="block">
                  <Button
                    className="group w-full h-14 text-base rounded-2xl bg-mono-charcoal hover:bg-mono-charcoal/90"
                    size="lg"
                  >
                    Sign in to checkout
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Secure, encrypted checkout
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-5 border-t border-border/50">
                {[
                  { icon: ShieldCheck, label: 'Secure Payment' },
                  { icon: Truck, label: 'Fast Shipping' },
                  { icon: RotateCcw, label: 'Easy Returns' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center text-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4 text-mono-charcoal" />
                    </div>
                    <span className="text-[10px] leading-tight text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Brand tones (kept cohesive with the MONO palette rather than generic UI colors)
const SAGE = '#4A7C59'; // success / savings / free shipping
const TERRA = '#C8703A'; // accent / progress
const ROSE = '#B54A4A'; // warnings / destructive

interface CartProduct {
  id: number;
  primaryImage?: string | null;
  name: string;
  slug: string;
  price: string;
  comparePrice?: string | null;
  category?: { name: string };
}

interface LocalCartItem {
  id: number;
  product: CartProduct;
  variant: { stock: number; isLowStock?: boolean };
  quantity: number;
  size: string;
  lineTotal?: number;
  lineSavings?: number;
}

export default function CartPage() {
  const { ready, isAuthenticated } = useAuthGuard();
  const dispatch = useAppDispatch();
  const guestItems = useAppSelector((state) => state.guestCart.items);
  const { data: cartResponse, isLoading } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeFromCart] = useRemoveFromCartMutation();
  const [clearCart] = useClearCartMutation();
  const [applyCoupon] = useApplyCouponMutation();
  const [removeCoupon] = useRemoveCouponMutation();
  const [addToWishlist] = useAddToWishlistMutation();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

  // ---------- Auth gate ----------
  if (!ready) return <AuthLoading />;

  if (!isAuthenticated) {
    if (guestItems.length === 0) {
      return (
        <div className="container-mono py-16">
          <EmptyState
            icon={ShoppingBag}
            title="Your bag is empty"
            description="Discover our curated collection and find pieces that speak to your style"
            action={{ label: 'Browse Collection', href: '/products' }}
          />
        </div>
      );
    }
    return <GuestCartView items={guestItems} dispatch={dispatch} />;
  }

  // ---------- Loading ----------
  if (isLoading) {
    return (
      <div className="container-mono py-10">
        <div className="h-10 w-56 bg-muted rounded-xl skeleton-shimmer mb-3" />
        <div className="h-4 w-32 bg-muted rounded-lg skeleton-shimmer mb-10" />
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-14">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded-3xl skeleton-shimmer" />
            ))}
          </div>
          <div className="h-[28rem] bg-muted rounded-3xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  const cart = extractCart(cartResponse) as Cart | null;
  const cartItems = (cart?.items ?? []) as unknown as LocalCartItem[];
  const appliedCoupon = cart?.appliedCoupon;

  // ---------- Empty ----------
  if (cartItems.length === 0) {
    return (
      <div className="container-mono py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Discover our curated collection and find pieces that speak to your style"
          action={{ label: 'Browse Collection', href: '/products' }}
        />
      </div>
    );
  }

  // ---------- Authoritative pricing from backend ----------
  const subtotal = cart?.subtotal ?? 0;
  const discount = cart?.discount ?? 0;
  const shipping = cart?.shipping ?? 0;
  const tax = cart?.tax ?? 0;
  const total = cart?.total ?? subtotal;
  const freeShipping = cart?.freeShipping;
  const totalQuantity = cart?.totalQuantity ?? cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalSavings = cartItems.reduce((sum, i) => sum + (i.lineSavings ?? 0), 0);
  const freeShippingProgress = freeShipping
    ? Math.min(100, (subtotal / freeShipping.threshold) * 100)
    : 100;

  // ---------- Mutations ----------
  const setBusy = (
    setter: React.Dispatch<React.SetStateAction<Set<number>>>,
    id: number,
    busy: boolean,
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleUpdateQuantity = async (itemId: number, quantity: number, stock: number) => {
    if (quantity < 1 || quantity > stock) return;
    setBusy(setUpdatingIds, itemId, true);
    try {
      await updateCartItem({ itemId, quantity }).unwrap();
    } catch {}
    setBusy(setUpdatingIds, itemId, false);
  };

  const handleRemove = async (itemId: number) => {
    setBusy(setRemovingIds, itemId, true);
    await new Promise((resolve) => setTimeout(resolve, 250)); // let exit animation play
    try {
      await removeFromCart(itemId).unwrap();
    } catch {
      setBusy(setRemovingIds, itemId, false);
    }
  };

  const handleSaveForLater = async (item: LocalCartItem) => {
    setBusy(setSavingIds, item.id, true);
    try {
      await addToWishlist(item.product.id).unwrap();
      setBusy(setRemovingIds, item.id, true);
      await new Promise((resolve) => setTimeout(resolve, 250));
      await removeFromCart(item.id).unwrap();
    } catch {
      setBusy(setRemovingIds, item.id, false);
    }
    setBusy(setSavingIds, item.id, false);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      await applyCoupon(couponCode.trim().toUpperCase()).unwrap();
      setCouponCode('');
    } catch (err) {
      const errorWithData = err as { data?: { message?: string } };
      setCouponError(errorWithData?.data?.message || 'Invalid coupon code');
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = async () => {
    setCouponError('');
    await removeCoupon(undefined).unwrap().catch(() => {});
  };

  return (
    <div className="container-mono py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10"
      >
        <div>
          <span className="label-caps mb-2 block" style={{ color: TERRA }}>
            Shopping Bag
          </span>
          <h1 className="font-playfair text-4xl md:text-5xl text-mono-charcoal leading-none">Your Bag</h1>
          <p className="text-muted-foreground mt-2">
            {totalQuantity} {totalQuantity === 1 ? 'piece' : 'pieces'} ready for checkout
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => clearCart(undefined).catch(() => {})}
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-mono-rose transition-colors self-start sm:self-auto"
        >
          <Trash2 className="h-4 w-4" />
          Clear bag
        </motion.button>
      </motion.div>

      {/* Free shipping progress */}
      {freeShipping && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: freeShipping.eligible ? `${SAGE}1a` : `${TERRA}1a`,
                color: freeShipping.eligible ? SAGE : TERRA,
              }}
            >
              {freeShipping.eligible ? <Check className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
            </div>
            <p className="text-sm leading-snug">
              {freeShipping.eligible ? (
                <span className="font-semibold" style={{ color: SAGE }}>
                  Nice — you&apos;ve unlocked free shipping.
                </span>
              ) : (
                <>
                  You&apos;re almost there. Add{' '}
                  <span className="font-semibold text-mono-charcoal">{formatCurrency(freeShipping.remaining)}</span> more
                  to enjoy <span className="font-medium">free shipping</span>.
                </>
              )}
            </p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: freeShipping.eligible
                  ? `linear-gradient(90deg, ${SAGE}, ${SAGE})`
                  : `linear-gradient(90deg, ${TERRA}, #E0996B)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${freeShippingProgress}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-14">
        {/* Cart Items */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {cartItems.map((item) => {
              const { product, variant } = item;
              const isRemoving = removingIds.has(item.id);
              const isUpdating = updatingIds.has(item.id);
              const isSaving = savingIds.has(item.id);
              if (!product) return null;

              const unitPrice = parseFloat(product.price);
              const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
              const lineTotal = item.lineTotal ?? unitPrice * item.quantity;
              const outOfStockForQty = variant.stock < item.quantity;
              const onSale = comparePrice && comparePrice > unitPrice;

              return (
                <motion.div
                  key={item.id}
                  layout
                  variants={cartItem}
                  initial="hidden"
                  animate={isRemoving ? 'exit' : 'visible'}
                  exit="exit"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="group rounded-3xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-border transition-all duration-300"
                >
                  <div className="flex gap-3 sm:gap-5">
                    {/* Product Image */}
                    <Link href={`/products/${product.slug}`} className="shrink-0">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-2xl overflow-hidden ring-1 ring-black/[0.04]">
                        {product.primaryImage ? (
                          <Image
                            src={product.primaryImage}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 96px, 128px"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No image
                          </div>
                        )}
                        {onSale && (
                          <span
                            className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: ROSE }}
                          >
                            Sale
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {product.category?.name && (
                            <p className="label-caps text-[11px] text-muted-foreground mb-1">{product.category.name}</p>
                          )}
                          <Link href={`/products/${product.slug}`}>
                            <h3 className="font-medium text-base text-foreground hover:text-mono-terracotta transition-colors line-clamp-2 leading-snug">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-mono-charcoal">
                              Size {item.size}
                            </span>
                            {variant.isLowStock && variant.stock > 0 && !outOfStockForQty && (
                              <span
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{ backgroundColor: `${TERRA}14`, color: TERRA }}
                              >
                                Only {variant.stock} left
                              </span>
                            )}
                            {outOfStockForQty && (
                              <span
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{ backgroundColor: `${ROSE}14`, color: ROSE }}
                              >
                                Only {variant.stock} in stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Line total */}
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-mono-charcoal tabular-nums">{formatCurrency(lineTotal)}</p>
                          {onSale && (
                            <p className="text-xs text-muted-foreground line-through tabular-nums">
                              {formatCurrency(comparePrice! * item.quantity)}
                            </p>
                          )}
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{formatCurrency(unitPrice)} each</p>
                          )}
                        </div>
                      </div>

                      {/* Bottom row: stepper + actions */}
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mt-auto pt-4">
                        <div className="inline-flex items-center rounded-full border border-border bg-background">
                          <button
                            aria-label="Decrease quantity"
                            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, variant.stock)}
                            disabled={item.quantity <= 1 || isUpdating}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-9 text-center text-sm font-semibold tabular-nums text-mono-charcoal">
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : item.quantity}
                          </span>
                          <button
                            aria-label="Increase quantity"
                            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, variant.stock)}
                            disabled={item.quantity >= variant.stock || isUpdating}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSaveForLater(item)}
                            disabled={isSaving || isRemoving}
                            className="inline-flex items-center gap-1.5 px-3 h-9 text-xs font-medium text-muted-foreground hover:text-mono-terracotta transition-colors rounded-full hover:bg-muted disabled:opacity-50"
                          >
                            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
                            <span className="hidden sm:inline">Save for later</span>
                          </button>
                          <button
                            aria-label="Remove item"
                            onClick={() => handleRemove(item.id)}
                            disabled={isRemoving}
                            className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-mono-rose hover:bg-muted transition-colors rounded-full disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-mono-charcoal transition-colors pt-2"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Continue shopping
          </Link>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 rounded-3xl border border-border/60 bg-card shadow-sm overflow-hidden">
            {/* Summary header */}
            <div className="px-6 pt-6 pb-5 border-b border-border/50">
              <span className="label-caps mb-1.5 block" style={{ color: TERRA }}>
                Summary
              </span>
              <h2 className="font-playfair text-2xl text-mono-charcoal">Order Details</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({totalQuantity} items)</span>
                  <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between" style={{ color: SAGE }}>
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      Discount {appliedCoupon?.code ? `(${appliedCoupon.code})` : ''}
                    </span>
                    <span className="font-medium tabular-nums">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium tabular-nums" style={shipping === 0 ? { color: SAGE } : undefined}>
                    {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span className="font-medium tabular-nums">{formatCurrency(tax)}</span>
                </div>
                <div className="border-t border-border/50 pt-4 flex justify-between items-baseline">
                  <span className="font-semibold text-base text-mono-charcoal">Total</span>
                  <span className="font-playfair text-3xl text-mono-charcoal tabular-nums">{formatCurrency(total)}</span>
                </div>
                {totalSavings > 0 && (
                  <div
                    className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold"
                    style={{ backgroundColor: `${SAGE}14`, color: SAGE }}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    You&apos;re saving {formatCurrency(totalSavings)} on this order
                  </div>
                )}
              </div>

              {/* Coupon */}
              <div className="space-y-2">
                {appliedCoupon ? (
                  <div
                    className="flex items-center justify-between rounded-2xl px-4 py-3 border"
                    style={{ backgroundColor: `${SAGE}0d`, borderColor: `${SAGE}33` }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${SAGE}1f`, color: SAGE }}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="leading-tight">
                        <p className="font-mono font-bold text-sm" style={{ color: SAGE }}>
                          {appliedCoupon.code}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Coupon applied</p>
                      </div>
                    </div>
                    <button
                      aria-label="Remove coupon"
                      onClick={handleRemoveCoupon}
                      className="p-1.5 text-muted-foreground hover:text-mono-rose hover:bg-muted rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Promo code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          className="pl-10 uppercase rounded-xl h-11"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-5 h-11 rounded-xl"
                      >
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs" style={{ color: ROSE }}>
                        {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="space-y-3">
                <Link href="/checkout" className="block">
                  <Button
                    className="group w-full h-14 text-base rounded-2xl bg-mono-charcoal hover:bg-mono-charcoal/90"
                    size="lg"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Secure, encrypted checkout
                </p>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 pt-5 border-t border-border/50">
                {[
                  { icon: ShieldCheck, label: 'Secure Payment' },
                  { icon: Truck, label: 'Fast Shipping' },
                  { icon: RotateCcw, label: 'Easy Returns' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center text-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4 text-mono-charcoal" />
                    </div>
                    <span className="text-[10px] leading-tight text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
