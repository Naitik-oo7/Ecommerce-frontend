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
  ArrowRight,
  ArrowLeft,
  Heart,
  Loader2,
  Truck,
  ShieldCheck,
  RotateCcw,
  Lock,
  Check,
  BadgeCheck,
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
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10"
      >
        <div>
          <span className="label-caps mb-2 block text-xs tracking-wider" style={{ color: TERRA }}>
            Shopping Bag
          </span>
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-mono-charcoal leading-none">Your Bag</h1>
          <p className="text-sm text-muted-foreground mt-3 font-light">
            {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} ready to checkout
          </p>
        </div>
        <ClearBagButton onClear={() => dispatch(clearGuestCart())} />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
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
                  className="group rounded-2xl border border-border/50 bg-card p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-border transition-[box-shadow,border-color] duration-300"
                >
                  <div className="flex gap-4">
                    <Link href={`/products/${item.productSlug}`} className="shrink-0">
                      <div className="relative w-24 h-28 sm:w-28 sm:h-32 bg-muted rounded-xl overflow-hidden ring-1 ring-black/[0.05]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            sizes="(max-width: 640px) 96px, 112px"
                            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No image
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="space-y-1.5">
                        {item.category && (
                          <p className="label-caps text-[10px] text-muted-foreground uppercase tracking-wider">{item.category}</p>
                        )}
                        <Link href={`/products/${item.productSlug}`}>
                          <h3 className="font-playfair text-base sm:text-lg text-foreground hover:text-mono-terracotta transition-colors line-clamp-1 leading-snug">
                            {item.productName}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-2.5 py-0.5 text-[11px] font-medium text-mono-charcoal">
                            Size {item.size}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                        {/* Pricing */}
                        <div className="leading-tight">
                          <p className="font-semibold text-base text-mono-charcoal tabular-nums">{formatCurrency(lineTotal)}</p>
                          {onSale && (
                            <p className="text-xs text-muted-foreground line-through tabular-nums">
                              {formatCurrency(comparePrice! * item.quantity)}
                            </p>
                          )}
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-muted-foreground">{formatCurrency(unitPrice)} each</p>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5">
                          <div className="inline-flex items-center rounded-full border border-border/60 bg-background/60">
                            <button
                              aria-label="Decrease quantity"
                              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                              onClick={() =>
                                dispatch(updateGuestItem({ variantId: item.variantId, size: item.size, quantity: item.quantity - 1 }))
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span aria-live="polite" className="w-7 text-center text-xs font-semibold tabular-nums text-mono-charcoal">
                              {item.quantity}
                            </span>
                            <button
                              aria-label="Increase quantity"
                              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
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
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-mono-rose hover:bg-muted/80 transition-colors rounded-full"
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
            Continue Shopping
          </Link>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24">
            <div className="rounded-3xl border border-border/50 bg-card shadow-xl shadow-black/[0.05] p-6 sm:p-7 space-y-5">
              <h2 className="font-playfair text-2xl text-mono-charcoal">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}
                  </span>
                  <span className="font-medium text-mono-charcoal tabular-nums">{formatCurrency(subtotal)}</span>
                </div>

                <div className="border-t border-border/40" />

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Shipping and taxes are calculated at checkout. Sign in to apply coupons and complete your order.
                </p>

                <div className="border-t border-border/40" />

                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold text-mono-charcoal">Subtotal</span>
                  <span className="text-3xl font-bold text-mono-charcoal tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <Link href={`/login?redirect=${encodeURIComponent('/cart')}`} className="block">
                <Button className="group w-full h-14 text-sm font-semibold rounded-2xl bg-mono-charcoal hover:bg-mono-charcoal/90 transition-all duration-300">
                  <Lock className="mr-2 h-4 w-4" />
                  Sign in to Checkout
                </Button>
              </Link>

              <SummaryTrustRow />
            </div>
          </div>
        </motion.div>
      </div>

      <FeatureBar />

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
 * Compact free-shipping notice. Replaces the old full-width banner row with a
 * slim pill that sits above the items — present but not space-hungry.
 */
function FreeShippingNotice({
  eligible,
  remaining,
  progress,
}: {
  eligible: boolean;
  remaining: number;
  progress: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/40 px-4 py-3"
      style={{
        background: eligible
          ? `linear-gradient(135deg, ${SAGE}0f 0%, ${SAGE}05 100%)`
          : `linear-gradient(135deg, ${TERRA}0f 0%, ${TERRA}05 100%)`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{
            backgroundColor: eligible ? `${SAGE}15` : `${TERRA}15`,
            color: eligible ? SAGE : TERRA,
          }}
        >
          {eligible ? <Check className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          {eligible ? (
            <>
              <p className="text-sm font-semibold" style={{ color: SAGE }}>
                You&apos;ve unlocked free shipping!
              </p>
              <p className="text-xs text-muted-foreground">Free delivery on this order</p>
            </>
          ) : (
            <p className="text-sm text-mono-charcoal">
              Add <span className="font-semibold">{formatCurrency(remaining)}</span> more for free shipping
            </p>
          )}
        </div>
      </div>
      {!eligible && (
        <div
          role="progressbar"
          aria-label="Progress toward free shipping"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2.5 h-1.5 rounded-full bg-border/50 overflow-hidden"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${TERRA}, ${TERRA}dd)` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      )}
    </motion.div>
  );
}

/** Inline trust line under the checkout CTA, mirroring the summary card layout. */
function SummaryTrustRow() {
  const items = [
    { icon: ShieldCheck, label: 'Secure payment' },
    { icon: RotateCcw, label: 'Easy returns' },
    { icon: BadgeCheck, label: '100% authentic' },
  ];
  return (
    <div className="flex items-center justify-center gap-x-4 gap-y-2 flex-wrap pt-1 text-[11px] text-muted-foreground">
      {items.map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" style={{ color: SAGE }} />
          {label}
        </span>
      ))}
    </div>
  );
}

/** Full-width reassurance strip that fills the space below the cart. */
function FeatureBar() {
  const items = [
    { icon: Truck, title: 'Free Shipping', sub: 'On all orders above ₹999' },
    { icon: RotateCcw, title: 'Easy Returns', sub: 'Within 7 days of delivery' },
    { icon: ShieldCheck, title: 'Secure Payments', sub: '100% protected checkout' },
    { icon: BadgeCheck, title: 'Quality Assured', sub: 'Original products only' },
  ];
  return (
    <div className="mt-12 sm:mt-16 rounded-3xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-border/40 sm:divide-y-0 sm:[&>*:nth-child(odd)]:border-r [&>*]:border-border/40 lg:[&>*]:border-r lg:[&>*:last-child]:border-r-0">
        {items.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3.5 p-5 sm:p-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${TERRA}12`, color: TERRA }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-sm font-semibold text-mono-charcoal">{title}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10"
      >
        <div>
          <span className="label-caps mb-2 block text-xs tracking-wider" style={{ color: TERRA }}>
            Shopping Bag
          </span>
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-mono-charcoal leading-none">Your Bag</h1>
          <p className="text-sm text-muted-foreground mt-3 font-light">
            {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} ready to checkout
          </p>
        </div>
        <ClearBagButton onClear={() => clearCart(undefined).unwrap().catch(() => {})} />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Cart Items */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 space-y-4"
        >
          {/* Free shipping notice — compact, above the items */}
          {freeShipping && (
            <FreeShippingNotice
              eligible={!!freeShipping.eligible}
              remaining={freeShipping.remaining}
              progress={freeShippingProgress}
            />
          )}

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
                  className="group rounded-2xl border border-border/50 bg-card p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-border transition-[box-shadow,border-color] duration-300"
                >
                  <div className={`flex gap-4 transition-opacity duration-200 ${isRemoving ? 'opacity-40 pointer-events-none' : ''}`}>
                    {/* Product Image */}
                    <Link href={`/products/${product.slug}`} className="shrink-0">
                      <div className="relative w-24 h-28 sm:w-28 sm:h-32 bg-muted rounded-xl overflow-hidden ring-1 ring-black/[0.05]">
                        {product.primaryImage ? (
                          <Image
                            src={product.primaryImage}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 96px, 112px"
                            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No image
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="space-y-1.5">
                        {product.category?.name && (
                          <p className="label-caps text-[10px] text-muted-foreground uppercase tracking-wider">{product.category.name}</p>
                        )}
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-playfair text-base sm:text-lg text-foreground hover:text-mono-terracotta transition-colors line-clamp-1 leading-snug">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-2.5 py-0.5 text-[11px] font-medium text-mono-charcoal">
                            Size {item.size}
                          </span>
                          {variant.isLowStock && variant.stock > 0 && !outOfStockForQty && (
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide"
                              style={{ backgroundColor: `${TERRA}15`, color: TERRA }}
                            >
                              Only {variant.stock} left
                            </span>
                          )}
                          {outOfStockForQty && (
                            <>
                              <span
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide"
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
                                className="text-[11px] font-medium underline underline-offset-2 text-muted-foreground hover:text-mono-charcoal transition-colors disabled:opacity-50"
                              >
                                {variant.stock > 0 ? `Adjust to ${variant.stock}` : 'Remove item'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price + controls on one row, pinned to the bottom of the card */}
                      <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                        <div className="leading-tight">
                          <p className="font-semibold text-base text-mono-charcoal tabular-nums">{formatCurrency(lineTotal)}</p>
                          {onSale && (
                            <p className="text-xs text-muted-foreground line-through tabular-nums">
                              {formatCurrency(comparePrice! * item.quantity)}
                            </p>
                          )}
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-muted-foreground">{formatCurrency(unitPrice)} each</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="inline-flex items-center rounded-full border border-border/60 bg-background/60">
                            <button
                              aria-label="Decrease quantity"
                              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, variant.stock)}
                              disabled={item.quantity <= 1 || isUpdating}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span aria-live="polite" className="w-7 text-center text-xs font-semibold tabular-nums text-mono-charcoal">
                              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : item.quantity}
                            </span>
                            <button
                              aria-label="Increase quantity"
                              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
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
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-mono-terracotta transition-colors rounded-full hover:bg-muted/80 disabled:opacity-50"
                          >
                            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-4 w-4" />}
                          </button>
                          <button
                            aria-label="Remove item"
                            onClick={() => handleRemove(item.id)}
                            disabled={isRemoving}
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-mono-rose hover:bg-muted/80 transition-colors rounded-full disabled:opacity-50"
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
            Continue Shopping
          </Link>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24">
            <div className="rounded-3xl border border-border/50 bg-card shadow-xl shadow-black/[0.05] p-6 sm:p-7 space-y-5">
              <h2 className="font-playfair text-2xl text-mono-charcoal">Order Summary</h2>

              <div className="space-y-4">
                {/* Items / subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}
                  </span>
                  <span className="font-medium text-mono-charcoal tabular-nums">{formatCurrency(subtotal)}</span>
                </div>

                {/* Coupon */}
                {appliedCoupon ? (
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm" style={{ color: SAGE }}>
                      <Tag className="h-4 w-4 flex-shrink-0" />
                      <span
                        className="font-mono text-xs font-semibold rounded-md px-2 py-0.5"
                        style={{ backgroundColor: `${SAGE}14` }}
                      >
                        {appliedCoupon.code}
                      </span>
                    </span>
                    <span className="text-right leading-tight">
                      <span className="block font-semibold tabular-nums" style={{ color: SAGE }}>
                        −{formatCurrency(discount)}
                      </span>
                      <button
                        onClick={handleRemoveCoupon}
                        disabled={couponRemoving}
                        className="text-[11px] text-muted-foreground hover:text-mono-rose underline underline-offset-2 disabled:opacity-50"
                      >
                        {couponRemoving ? 'Removing…' : 'Remove'}
                      </button>
                    </span>
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

                <div className="border-t border-border/40" />

                {/* Shipping */}
                <div className="flex justify-between items-start gap-3">
                  <span className="leading-tight">
                    <span className="block text-sm text-mono-charcoal">Shipping</span>
                    <span className="block text-[11px] text-muted-foreground">Delivered in 3–5 business days</span>
                  </span>
                  <span
                    className="font-medium tabular-nums"
                    style={shipping === 0 ? { color: SAGE, fontWeight: 600 } : undefined}
                  >
                    {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                  </span>
                </div>

                {/* Tax */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tax</span>
                  <span className="font-medium text-mono-charcoal tabular-nums">{formatCurrency(tax)}</span>
                </div>

                {/* Savings */}
                {totalSavings > 0 && (
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                    style={{ backgroundColor: `${SAGE}12`, color: SAGE }}
                  >
                    <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>You&apos;re saving {formatCurrency(totalSavings)} on this order</span>
                  </div>
                )}

                <div className="border-t border-border/40" />

                {/* Total — the dominant figure, kept in a plain readable font */}
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold text-mono-charcoal">Total</span>
                  <span className="text-3xl font-bold text-mono-charcoal tabular-nums">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
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
                <Button disabled className="w-full h-14 text-sm font-semibold rounded-2xl bg-mono-charcoal">
                  <Lock className="mr-2 h-4 w-4" />
                  Proceed to Checkout
                </Button>
              ) : (
                <Link href="/checkout" className="block">
                  <Button className="group w-full h-14 text-sm font-semibold rounded-2xl bg-mono-charcoal hover:bg-mono-charcoal/90 transition-all duration-300">
                    <Lock className="mr-2 h-4 w-4" />
                    Proceed to Checkout
                  </Button>
                </Link>
              )}

              <SummaryTrustRow />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reassurance strip — fills the space below the cart */}
      <FeatureBar />

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
