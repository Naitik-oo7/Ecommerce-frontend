'use client';

import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import type { Product, ProductVariant } from '@/types';

export type ProductCardView = 'grid' | 'list';

interface ProductCardProps {
  product: Product;
  index?: number;
  view?: ProductCardView;
  isInWishlist?: boolean;
  isAddingToCart?: boolean;
  /** Opens the quick-view / quick-add experience (variant + size selection). */
  onQuickView?: (product: Product) => void;
  onToggleWishlist?: (e: React.MouseEvent) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const CUBIC = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Unique colour swatches derived from a product's variants. */
function useColorSwatches(variants: ProductVariant[] | undefined) {
  return useMemo(() => {
    if (!variants?.length) return [] as { color: string; hex: string; inStock: boolean }[];
    const seen = new Map<string, { color: string; hex: string; inStock: boolean }>();
    for (const v of variants) {
      if (!v.color) continue;
      const key = (v.colorHex || v.color).toLowerCase();
      const existing = seen.get(key);
      if (existing) {
        existing.inStock = existing.inStock || v.stock > 0;
      } else {
        seen.set(key, { color: v.color, hex: v.colorHex || '#CFC7BD', inStock: v.stock > 0 });
      }
    }
    return Array.from(seen.values());
  }, [variants]);
}

export const ProductCard = memo(function ProductCard({
  product,
  index = 0,
  view = 'grid',
  isInWishlist = false,
  isAddingToCart = false,
  onQuickView,
  onToggleWishlist,
}: ProductCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const hasSecondaryImage = (product.images?.length ?? 0) > 1;
  const swatches = useColorSwatches(product.variants);

  const salePercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round((1 - product.price / product.comparePrice) * 100)
      : null;

  const rating = Number(product.avgRating) || 0;
  const isSoldOut = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock < 10;

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  // Entrance fires once at mount (not on every scroll via IntersectionObserver).
  // Use index % 12 so each infinite-scroll batch also gets a per-page stagger.
  const localIndex = index % 12;
  const entrance = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  const entranceTransition = {
    duration: 0.45,
    delay: Math.min(localIndex * 0.04, 0.28),
    ease: EASE,
  };

  // ── Shared sub-elements ────────────────────────────────────────────────
  const Badges = (
    <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1.5">
      {isSoldOut && (
        <span className="px-2.5 py-1 bg-mono-charcoal/85 backdrop-blur-sm text-white text-[9px] font-semibold tracking-[0.12em] uppercase rounded-full">
          Sold Out
        </span>
      )}
      {salePercent && !isSoldOut && (
        <span className="px-2.5 py-1 bg-mono-terracotta text-white text-[9px] font-bold tracking-wide rounded-full shadow-sm">
          −{salePercent}%
        </span>
      )}
    </div>
  );

  const WishlistButton = onToggleWishlist && (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleWishlist(e);
      }}
      aria-label={isInWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      aria-pressed={isInWishlist}
      className={`z-20 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 focus-visible:opacity-100 ${
        isInWishlist
          ? 'bg-[#B54A4A] text-white shadow-md'
          : 'bg-white/90 text-mono-charcoal shadow-sm hover:bg-white hover:scale-105'
      }`}
    >
      <Heart className={`h-[15px] w-[15px] ${isInWishlist ? 'fill-current' : ''}`} />
    </button>
  );

  const PriceBlock = (
    <div className="flex items-baseline gap-2">
      <span className="font-bold text-[15px] text-mono-charcoal tabular-nums">
        ₹{product.price.toLocaleString('en-IN')}
      </span>
      {product.comparePrice && product.comparePrice > product.price && (
        <span className="text-xs text-[#A8A199] line-through tabular-nums">
          ₹{product.comparePrice.toLocaleString('en-IN')}
        </span>
      )}
    </div>
  );

  const RatingRow = rating > 0 && (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-3 w-3 ${
              s <= Math.round(rating) ? 'fill-mono-terracotta text-mono-terracotta' : 'fill-[#E8E2DA] text-[#E8E2DA]'
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-[#A8A199] tabular-nums">{rating.toFixed(1)}</span>
      {product.reviewCount !== undefined && product.reviewCount > 0 && (
        <span className="text-[10px] text-[#C8C0B8]">({product.reviewCount})</span>
      )}
    </div>
  );

  const Swatches = swatches.length > 0 && (
    <div className="flex items-center gap-1.5 pt-0.5">
      {swatches.slice(0, 5).map((s) => (
        <span
          key={s.hex + s.color}
          title={s.color}
          className={`h-3.5 w-3.5 rounded-full ring-1 ring-black/10 ${s.inStock ? '' : 'opacity-40'}`}
          style={{ backgroundColor: s.hex }}
        />
      ))}
      {swatches.length > 5 && (
        <span className="text-[10px] font-medium text-[#A8A199]">+{swatches.length - 5}</span>
      )}
    </div>
  );

  // Pure CSS hover — no JS state, no re-renders as cards scroll past the cursor.
  const ImageStack = (
    <>
      {product.images?.[0] ? (
        <>
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-700 ${
              prefersReducedMotion ? '' : 'group-hover:scale-[1.07]'
            }`}
            style={{ transitionTimingFunction: CUBIC }}
          />
          {hasSecondaryImage && !prefersReducedMotion && (
            <Image
              src={product.images[1]}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-mono-sand text-[#A8A199]">
          <ShoppingBag className="h-7 w-7" strokeWidth={1.25} />
        </div>
      )}
    </>
  );

  // ── LIST VIEW ───────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <motion.article
        {...entrance}
        transition={entranceTransition}
        className="group relative flex gap-4 rounded-2xl border border-[#E8E2DA] bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-md sm:gap-6 sm:p-4"
      >
        <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-mono-cream sm:w-40 md:w-48">
          {ImageStack}
          {Badges}
        </div>

        <div className="flex min-w-0 flex-1 flex-col py-1 justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-medium leading-snug text-mono-charcoal transition-colors group-hover:text-mono-terracotta line-clamp-2">
              {product.name}
            </h3>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3 pt-2">
            <div>{PriceBlock}</div>
            <div className="z-20 flex items-center gap-2">
              {WishlistButton}
              {onQuickView && (
                <button
                  type="button"
                  onClick={handleQuickView}
                  disabled={isSoldOut}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-mono-charcoal px-4 text-xs font-medium text-white transition-all duration-200 hover:bg-[#2A2A26] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {isSoldOut ? 'Sold Out' : 'Quick Add'}
                </button>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/products/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0 z-10 rounded-2xl"
        />
      </motion.article>
    );
  }

  // ── GRID VIEW (default) ──────────────────────────────────────────────────
  return (
    <motion.article
      {...entrance}
      transition={entranceTransition}
      className="group relative"
    >
      {/* CSS lift + shadow — no JS animation loop, no re-render on hover */}
      <div
        className={`relative overflow-hidden rounded-2xl border border-[#E8E2DA] bg-white shadow-sm transition-[transform,box-shadow] duration-300 group-hover:shadow-xl ${
          prefersReducedMotion ? '' : 'group-hover:-translate-y-1.5'
        }`}
        style={{ transitionTimingFunction: CUBIC }}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-mono-cream">
          {ImageStack}
          {Badges}

          {/* Top-right wishlist button */}
          <div className="absolute right-3 top-3 z-20">
            {WishlistButton}
          </div>

          {/* Quick Add — full-width bar slides up on hover (desktop ≥md). */}
          {onQuickView && (
            <div className="absolute inset-x-0 bottom-0 z-20 hidden p-3 md:block md:translate-y-3 md:opacity-0 md:transition-all md:duration-300 md:group-hover:translate-y-0 md:group-hover:opacity-100">
              <button
                type="button"
                onClick={handleQuickView}
                disabled={isSoldOut || isAddingToCart}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-mono-charcoal text-sm font-medium text-white shadow-lg transition-colors duration-200 hover:bg-[#2A2A26] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAddingToCart ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    {isSoldOut ? 'Sold Out' : 'Quick Add'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quick Add — compact icon button on mobile/touch (<md), matches wishlist size. */}
          {onQuickView && !isSoldOut && (
            <div className="absolute bottom-3 right-3 z-20 md:hidden">
              <button
                type="button"
                onClick={handleQuickView}
                disabled={isAddingToCart}
                aria-label={`Quick add ${product.name} to bag`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-mono-charcoal text-white shadow-md transition-colors duration-200 active:bg-[#2A2A26] disabled:opacity-60"
              >
                {isAddingToCart ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <ShoppingBag className="h-[15px] w-[15px]" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1.5 px-4 py-3.5">
          <h3 className="text-sm font-medium leading-snug text-mono-charcoal transition-colors group-hover:text-mono-terracotta truncate">
            {product.name}
          </h3>
          {PriceBlock}
        </div>

        {/* Stretched link overlay — sits below action buttons (z-20) */}
        <Link
          href={`/products/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0 z-10 rounded-2xl"
        />
      </div>
    </motion.article>
  );
});

export default ProductCard;
