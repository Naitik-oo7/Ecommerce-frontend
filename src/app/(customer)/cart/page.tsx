'use client';

import { useEffect, useState } from 'react';
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
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { staggerContainer } from '@/lib/animations';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { extractCart } from '@/lib/api-utils';
import { formatCurrency } from '@/lib/currency';
import type { Cart } from '@/types/order';

// ============================================
// MONO Cart — editorial, premium shopping experience
// Pricing is authoritative from the backend; this page never recomputes money.
// ============================================

// Transform/opacity only — the shared `cartItem` variant animates height,
// which forces layout reflow every frame and makes removal feel laggy.
const itemRow: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

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
    <div className="container-mono pt-12 md:pt-16 pb-32 lg:pb-16">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 sm:mb-14"
      >
        <div>
          <span className="label-caps mb-2 block text-xs tracking-wider" style={{ color: TERRA }}>
            Shopping Experience
          </span>
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-mono-charcoal leading-none">Your Bag</h1>
          <p className="text-sm text-muted-foreground mt-3 font-light">
            {totalQuantity} {totalQuantity === 1 ? 'exquisite piece' : 'carefully selected pieces'}
          </p>
        </div>
        <ClearBagButton onClear={() => dispatch(clearGuestCart())} />
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
                  layout="position"
                  variants={itemRow}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="group rounded-3xl border border-border/40 bg-card/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-border/80 transition-[box-shadow,border-color,background-color] duration-300 hover:bg-card"
                >
                  <div className="flex gap-4 sm:gap-6">
                    <Link href={`/products/${item.productSlug}`} className="shrink-0">
                      <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-muted rounded-2xl overflow-hidden ring-1 ring-black/[0.05]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            sizes="(max-width: 640px) 112px, 144px"
                            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No image
                          </div>
                        )}
                        {onSale && (
                          <span
                            className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white uppercase tracking-wider"
                            style={{ backgroundColor: ROSE }}
                          >
                            On Sale
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-3">
                        {item.category && (
                          <p className="label-caps text-[10px] text-muted-foreground uppercase tracking-wider">{item.category}</p>
                        )}
                        <Link href={`/products/${item.productSlug}`}>
                          <h3 className="font-playfair text-lg text-foreground hover:text-mono-terracotta transition-colors line-clamp-2 leading-snug">
                            {item.productName}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-mono-charcoal">
                            Size {item.size}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-border/30">
                        {/* Pricing */}
                        <div className="space-y-1">
                          <p className="font-semibold text-base text-mono-charcoal tabular-nums">{formatCurrency(lineTotal)}</p>
                          {onSale && (
                            <p className="text-xs text-muted-foreground line-through tabular-nums">
                              {formatCurrency(comparePrice! * item.quantity)}
                            </p>
                          )}
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-muted-foreground">{formatCurrency(unitPrice)} per item</p>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2.5">
                          <div className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60">
                            <button
                              aria-label="Decrease quantity"
                              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                              onClick={() =>
                                dispatch(updateGuestItem({ variantId: item.variantId, size: item.size, quantity: item.quantity - 1 }))
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span aria-live="polite" className="w-6 text-center text-xs font-semibold tabular-nums text-mono-charcoal">
                              {item.quantity}
                            </span>
                            <button
                              aria-label="Increase quantity"
                              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
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
                            className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-mono-rose hover:bg-muted/80 transition-colors rounded-full"
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

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 space-y-6">
            {/* Sign-in CTA Card - Premium Style */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="rounded-3xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${TERRA}08 0%, ${TERRA}04 100%)`,
                border: `2px solid ${TERRA}1a`,
              }}
            >
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-playfair text-xl text-mono-charcoal">Ready to checkout?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sign in to your account to complete your purchase, track your order, and access exclusive benefits.
                  </p>
                </div>
                <Link href={`/login?redirect=${encodeURIComponent('/cart')}`} className="block">
                  <Button
                    className="group w-full h-12 text-sm font-medium rounded-2xl bg-mono-charcoal hover:bg-mono-charcoal/90 transition-all duration-300"
                  >
                    Sign in to checkout
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Secure, encrypted checkout</span>
                </p>
              </div>
            </motion.div>

            {/* Order Summary Card */}
            <div className="rounded-3xl border border-border/60 bg-card shadow-sm overflow-hidden backdrop-blur-sm">
              <div className="px-6 pt-6 pb-5 border-b border-border/50">
                <span className="label-caps mb-1.5 block text-xs tracking-wider" style={{ color: TERRA }}>
                  Order Summary
                </span>
                <h2 className="font-playfair text-2xl text-mono-charcoal">Subtotal</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}</span>
                  <span className="font-semibold text-lg text-mono-charcoal tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                  Shipping and taxes will be calculated when you sign in at checkout.
                </p>
              </div>
            </div>

            {/* Trust Badges - Refined */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: ShieldCheck, label: 'Secure' },
                { icon: Truck, label: 'Fast Shipping' },
                { icon: RotateCcw, label: 'Easy Returns' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/40 bg-card/50 p-4 flex flex-col items-center text-center gap-2.5 backdrop-blur-sm"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${TERRA}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: TERRA }} />
                  </div>
                  <span className="text-[10px] leading-tight text-muted-foreground font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <MobileCheckoutBar
        label={`Subtotal · ${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}`}
        amount={subtotal}
        cta="Sign in to checkout"
        href={`/login?redirect=${encodeURIComponent('/cart')}`}
      />
    </div>
  );
}

// Brand tones (kept cohesive with the MONO palette rather than generic UI colors)
const SAGE = '#4A7C59'; // success / savings / free shipping
const TERRA = '#C8703A'; // accent / progress
const ROSE = '#B54A4A'; // warnings / destructive

/**
 * Clearing the whole bag is destructive — require an inline two-step confirm
 * instead of acting on the first click. Auto-dismisses if the user walks away.
 */
function ClearBagButton({ onClear }: { onClear: () => unknown }) {
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 5000);
    return () => clearTimeout(t);
  }, [confirming]);

  if (confirming) {
    return (
      <div
        className="flex items-center gap-2.5 self-start sm:self-auto"
        role="alertdialog"
        aria-label="Confirm clearing your bag"
      >
        <span className="text-xs text-muted-foreground">Remove all items?</span>
        <button
          onClick={async () => {
            setClearing(true);
            try {
              await onClear();
            } finally {
              setClearing(false);
              setConfirming(false);
            }
          }}
          disabled={clearing}
          className="inline-flex items-center gap-1.5 h-8 rounded-full px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: ROSE }}
        >
          {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Yes, clear
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="h-8 rounded-full px-3 text-xs font-medium text-muted-foreground hover:text-mono-charcoal hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setConfirming(true)}
      className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-mono-rose transition-colors self-start sm:self-auto uppercase tracking-wider"
    >
      <Trash2 className="h-4 w-4" />
      Clear bag
    </motion.button>
  );
}

/**
 * On small screens the order summary lives below the item list, so the primary
 * CTA can be a full page-scroll away. Surface the total + CTA in a fixed bar.
 */
function MobileCheckoutBar({
  label,
  amount,
  cta,
  href,
  disabled,
  disabledHint,
}: {
  label: string;
  amount: number;
  cta: string;
  href: string;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <motion.div
      initial={{ y: 96 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="container-mono flex items-center justify-between gap-4 py-3">
        <div className="leading-tight min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-mono-charcoal tabular-nums">{formatCurrency(amount)}</p>
          {disabled && disabledHint && (
            <p className="text-[11px] font-medium truncate" style={{ color: ROSE }}>
              {disabledHint}
            </p>
          )}
        </div>
        {disabled ? (
          <Button disabled className="h-11 shrink-0 px-6 rounded-2xl bg-mono-charcoal text-sm font-medium">
            {cta}
          </Button>
        ) : (
          <Link href={href} className="shrink-0">
            <Button className="group h-11 px-6 rounded-2xl bg-mono-charcoal hover:bg-mono-charcoal/90 text-sm font-medium">
              {cta}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

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
  const [couponRemoving, setCouponRemoving] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

  // ---------- Auth gate ----------
  if (!ready) return <AuthLoading />;

  if (!isAuthenticated) {
    if (guestItems.length === 0) {
      return <EmptyCart />;
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
    return <EmptyCart />;
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

  // No artificial delays here — AnimatePresence plays the exit animation when
  // the item leaves the cart data; waiting first made removal feel laggy.
  const handleRemove = async (itemId: number) => {
    setBusy(setRemovingIds, itemId, true);
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
    setCouponRemoving(true);
    await removeCoupon(undefined).unwrap().catch(() => {});
    setCouponRemoving(false);
  };

  const hasStockIssues = cartItems.some((i) => i.variant.stock < i.quantity);

  return (
    <div className="container-mono pt-12 md:pt-16 pb-32 lg:pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 sm:mb-14"
      >
        <div>
          <span className="label-caps mb-2 block text-xs tracking-wider" style={{ color: TERRA }}>
            Shopping Experience
          </span>
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-mono-charcoal leading-none">Your Bag</h1>
          <p className="text-sm text-muted-foreground mt-3 font-light">
            {totalQuantity} {totalQuantity === 1 ? 'exquisite piece' : 'carefully selected pieces'} ready to check out
          </p>
        </div>
        <ClearBagButton onClear={() => clearCart(undefined).unwrap().catch(() => {})} />
      </motion.div>

      {/* Free shipping progress - Luxury style */}
      {freeShipping && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 rounded-3xl overflow-hidden border border-border/40"
          style={{
            background: freeShipping.eligible
              ? `linear-gradient(135deg, ${SAGE}08 0%, ${SAGE}04 100%)`
              : `linear-gradient(135deg, ${TERRA}08 0%, ${TERRA}04 100%)`,
          }}
        >
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: freeShipping.eligible ? `${SAGE}15` : `${TERRA}15`,
                  color: freeShipping.eligible ? SAGE : TERRA,
                }}
              >
                {freeShipping.eligible ? <Check className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">
                  {freeShipping.eligible ? (
                    <span className="block space-y-1">
                      <span className="font-semibold block" style={{ color: SAGE }}>
                        You&apos;ve unlocked complimentary shipping
                      </span>
                      <span className="text-xs text-muted-foreground">Free delivery on this order</span>
                    </span>
                  ) : (
                    <span className="block space-y-1">
                      <span className="font-medium text-mono-charcoal block">Almost there!</span>
                      <span className="text-xs text-muted-foreground">
                        Add <span className="font-semibold text-mono-charcoal">{formatCurrency(freeShipping.remaining)}</span> more to earn free shipping
                      </span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            {!freeShipping.eligible && (
              <div
                role="progressbar"
                aria-label="Progress toward free shipping"
                aria-valuenow={Math.round(freeShippingProgress)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 rounded-full bg-border/50 overflow-hidden"
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${TERRA}, ${TERRA}dd)`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${freeShippingProgress}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
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
                  layout="position"
                  variants={itemRow}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="group rounded-3xl border border-border/40 bg-card/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-border/80 transition-[box-shadow,border-color,background-color] duration-300 hover:bg-card"
                >
                  <div className={`flex gap-4 sm:gap-6 transition-opacity duration-200 ${isRemoving ? 'opacity-40 pointer-events-none' : ''}`}>
                    {/* Product Image */}
                    <Link href={`/products/${product.slug}`} className="shrink-0">
                      <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-muted rounded-2xl overflow-hidden ring-1 ring-black/[0.05]">
                        {product.primaryImage ? (
                          <Image
                            src={product.primaryImage}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 112px, 144px"
                            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No image
                          </div>
                        )}
                        {onSale && (
                          <span
                            className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white uppercase tracking-wider"
                            style={{ backgroundColor: ROSE }}
                          >
                            On Sale
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-3">
                        {product.category?.name && (
                          <p className="label-caps text-[10px] text-muted-foreground uppercase tracking-wider">{product.category.name}</p>
                        )}
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-playfair text-lg text-foreground hover:text-mono-terracotta transition-colors line-clamp-2 leading-snug">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-mono-charcoal">
                            Size {item.size}
                          </span>
                          {variant.isLowStock && variant.stock > 0 && !outOfStockForQty && (
                            <span
                              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide"
                              style={{ backgroundColor: `${TERRA}15`, color: TERRA }}
                            >
                              Only {variant.stock} left
                            </span>
                          )}
                          {outOfStockForQty && (
                            <>
                              <span
                                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide"
                                style={{ backgroundColor: `${ROSE}15`, color: ROSE }}
                              >
                                {variant.stock > 0 ? `Only ${variant.stock} available` : 'Out of stock'}
                              </span>
                              <button
                                onClick={() =>
                                  variant.stock > 0
                                    ? handleUpdateQuantity(item.id, variant.stock, variant.stock)
                                    : handleRemove(item.id)
                                }
                                disabled={isUpdating || isRemoving}
                                className="text-xs font-medium underline underline-offset-2 text-muted-foreground hover:text-mono-charcoal transition-colors disabled:opacity-50"
                              >
                                {variant.stock > 0 ? `Adjust to ${variant.stock}` : 'Remove item'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-border/30">
                        {/* Pricing */}
                        <div className="space-y-1">
                          <p className="font-semibold text-base text-mono-charcoal tabular-nums">{formatCurrency(lineTotal)}</p>
                          {onSale && (
                            <p className="text-xs text-muted-foreground line-through tabular-nums">
                              {formatCurrency(comparePrice! * item.quantity)}
                            </p>
                          )}
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-muted-foreground">{formatCurrency(unitPrice)} per item</p>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2.5">
                          <div className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60">
                            <button
                              aria-label="Decrease quantity"
                              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, variant.stock)}
                              disabled={item.quantity <= 1 || isUpdating}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span aria-live="polite" className="w-6 text-center text-xs font-semibold tabular-nums text-mono-charcoal">
                              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : item.quantity}
                            </span>
                            <button
                              aria-label="Increase quantity"
                              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, variant.stock)}
                              disabled={item.quantity >= variant.stock || isUpdating}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            aria-label="Save for later"
                            onClick={() => handleSaveForLater(item)}
                            disabled={isSaving || isRemoving}
                            className="inline-flex items-center gap-1 px-2.5 h-9 text-xs font-medium text-muted-foreground hover:text-mono-terracotta transition-colors rounded-full hover:bg-muted/80 disabled:opacity-50"
                          >
                            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
                            <span className="hidden sm:inline text-xs">Save</span>
                          </button>
                          <button
                            aria-label="Remove item"
                            onClick={() => handleRemove(item.id)}
                            disabled={isRemoving}
                            className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-mono-rose hover:bg-muted/80 transition-colors rounded-full disabled:opacity-50"
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
          <div className="sticky top-24 space-y-6">
            {/* Pricing Summary */}
            <div className="rounded-3xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
              {/* Header */}
              <div className="px-6 pt-6 pb-5 border-b border-border/30 bg-gradient-to-br from-card to-transparent">
                <span className="label-caps mb-1.5 block text-xs tracking-wider" style={{ color: TERRA }}>
                  Order Summary
                </span>
                <h2 className="font-playfair text-2xl text-mono-charcoal">Pricing Details</h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center pb-4">
                  <span className="text-sm text-muted-foreground">{totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}</span>
                  <span className="font-semibold text-mono-charcoal tabular-nums">{formatCurrency(subtotal)}</span>
                </div>

                {/* Discount */}
                {discount > 0 && (
                  <div className="flex justify-between items-center pb-3" style={{ color: SAGE }}>
                    <span className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">Discount</span>
                      {appliedCoupon?.code && <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded ml-1">{appliedCoupon.code}</span>}
                    </span>
                    <span className="font-semibold tabular-nums">−{formatCurrency(discount)}</span>
                  </div>
                )}

                {/* Shipping & Tax */}
                <div className="space-y-2.5 py-3 border-t border-border/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Shipping</span>
                    <span className="font-medium tabular-nums" style={shipping === 0 ? { color: SAGE, fontWeight: 600 } : undefined}>
                      {shipping === 0 ? (
                        <span className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          Free
                        </span>
                      ) : (
                        formatCurrency(shipping)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tax</span>
                    <span className="font-medium text-mono-charcoal tabular-nums">{formatCurrency(tax)}</span>
                  </div>
                </div>

                {/* Total */}
                <div
                  className="rounded-2xl px-4 py-4 flex justify-between items-baseline"
                  style={{ backgroundColor: `${TERRA}08`, borderLeft: `3px solid ${TERRA}` }}
                >
                  <span className="font-semibold text-sm text-mono-charcoal uppercase tracking-wide">Total</span>
                  <span className="text-2xl font-bold text-mono-charcoal tabular-nums">{formatCurrency(total)}</span>
                </div>

                {/* Savings Badge */}
                {totalSavings > 0 && (
                  <div
                    className="flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-center"
                    style={{ backgroundColor: `${SAGE}12`, color: SAGE }}
                  >
                    <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>You&apos;re saving <span className="font-bold">{formatCurrency(totalSavings)}</span> on this order</span>
                  </div>
                )}
              </div>
            </div>

            {/* Coupon Section */}
            <div className="space-y-3">
              {appliedCoupon ? (
                <div
                  className="rounded-2xl px-4 py-3 border flex items-center justify-between"
                  style={{ backgroundColor: `${SAGE}0d`, borderColor: `${SAGE}33` }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${SAGE}15`, color: SAGE }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div className="leading-tight">
                      <p className="font-mono font-semibold text-xs" style={{ color: SAGE }}>
                        {appliedCoupon.code}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Applied</p>
                    </div>
                  </div>
                  <button
                    aria-label="Remove coupon"
                    onClick={handleRemoveCoupon}
                    disabled={couponRemoving}
                    className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-mono-rose hover:bg-muted/60 transition-colors disabled:opacity-50"
                  >
                    {couponRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Promo Code</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        className="pl-10 uppercase rounded-xl h-10 text-sm bg-background/70"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 h-10 rounded-xl text-sm"
                    >
                      {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                  {couponError && (
                    <p role="alert" className="text-xs font-medium" style={{ color: ROSE }}>
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Checkout CTA */}
            <div className="space-y-3 pt-2">
              {hasStockIssues && (
                <p
                  role="alert"
                  className="rounded-xl px-4 py-3 text-xs font-medium leading-relaxed"
                  style={{ backgroundColor: `${ROSE}0d`, color: ROSE }}
                >
                  Some items exceed available stock. Adjust the highlighted quantities to continue.
                </p>
              )}
              {hasStockIssues ? (
                <Button
                  disabled
                  className="w-full h-12 text-sm font-medium rounded-2xl bg-mono-charcoal"
                >
                  Proceed to Checkout
                </Button>
              ) : (
                <Link href="/checkout" className="block">
                  <Button
                    className="group w-full h-12 text-sm font-medium rounded-2xl bg-mono-charcoal hover:bg-mono-charcoal/90 transition-all duration-300"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              )}
              <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 flex-shrink-0" />
                <span>Secure, encrypted checkout</span>
              </p>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: ShieldCheck, label: 'Secure' },
                { icon: Truck, label: 'Fast Shipping' },
                { icon: RotateCcw, label: 'Easy Returns' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/40 bg-card/50 p-4 flex flex-col items-center text-center gap-2.5 backdrop-blur-sm"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${TERRA}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: TERRA }} />
                  </div>
                  <span className="text-[10px] leading-tight text-muted-foreground font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <MobileCheckoutBar
        label={`Total · ${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}`}
        amount={total}
        cta="Checkout"
        href="/checkout"
        disabled={hasStockIssues}
        disabledHint="Adjust quantities to continue"
      />
    </div>
  );
}
