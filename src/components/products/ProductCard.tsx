'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  index?: number;
  isInWishlist?: boolean;
  isAddingToCart?: boolean;
  onAddToCart?: (e: React.MouseEvent) => void;
  onToggleWishlist?: (e: React.MouseEvent) => void;
  onQuickView?: (e: React.MouseEvent) => void;
}

export const ProductCard = ({
  product,
  index = 0,
  isInWishlist = false,
  onToggleWishlist,
}: ProductCardProps) => {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  const primaryImage = product.images?.[0];
  const secondaryImage = product.images?.[1];
  const isOutOfStock = (product.stock ?? 0) === 0;
  const isLowStock = !isOutOfStock && (product.stock ?? 99) < 10;

  const salePercent =
    product.comparePrice && Number(product.comparePrice) > Number(product.price)
      ? Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)
      : null;

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const category = (product as any).category?.name as string | undefined;
  const avgRating = (product as any).avgRating as string | number | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.055, ease: [0.16, 1, 0.3, 1] }}
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image ── */}
      <div
        className="relative aspect-3/4 overflow-hidden rounded-xl mb-3"
        style={{ background: '#E8E4DE' }}
      >
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          {primaryImage && !imgError ? (
            <>
              <img
                src={primaryImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                onError={() => setImgError(true)}
              />
              <AnimatePresence>
                {hovered && secondaryImage && (
                  <motion.img
                    key="secondary"
                    src={secondaryImage}
                    alt={`${product.name} – alternate`}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  />
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-10 w-10" style={{ color: '#C8C0B8' }} />
            </div>
          )}
        </Link>

        {/* Badges — top-left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {isOutOfStock && (
            <span
              className="px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] uppercase"
              style={{ background: '#1A1A18', color: '#F6F3EE', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Sold Out
            </span>
          )}
          {!isOutOfStock && isLowStock && (
            <span
              className="px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] uppercase"
              style={{ background: 'rgba(181,74,74,0.92)', color: '#fff', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Only {product.stock} left
            </span>
          )}
          {salePercent && (
            <span
              className="px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] uppercase"
              style={{ background: '#C8703A', color: '#fff', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              −{salePercent}%
            </span>
          )}
        </div>

        {/* Wishlist button — top-right, fades in on hover */}
        <motion.button
          onClick={onToggleWishlist}
          initial={false}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)' }}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className="h-3.5 w-3.5 transition-colors duration-200"
            style={{
              fill: isInWishlist ? '#B54A4A' : 'transparent',
              color: isInWishlist ? '#B54A4A' : '#1A1A18',
            }}
          />
        </motion.button>

        {/* Select Size CTA — slides up from bottom on hover */}
        {!isOutOfStock && (
          <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden>
            <motion.div
              initial={false}
              animate={{ y: hovered ? 0 : '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 bottom-0 py-3 px-4 text-center"
              style={{ background: 'rgba(26,26,24,0.92)', backdropFilter: 'blur(4px)' }}
            >
              <span
                className="text-[10px] font-semibold tracking-[0.16em] uppercase"
                style={{ color: '#F6F3EE', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
              >
                Select Size
              </span>
            </motion.div>
          </Link>
        )}
      </div>

      {/* ── Info ── */}
      <div className="space-y-0.5">
        {category && (
          <p
            className="text-[10px] uppercase tracking-[0.12em] font-medium"
            style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
          >
            {category}
          </p>
        )}

        <Link href={`/products/${product.slug}`}>
          <p
            className="text-sm font-semibold leading-snug line-clamp-2 hover:opacity-70 transition-opacity"
            style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
          >
            {product.name}
          </p>
        </Link>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold"
              style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              {formatINR(Number(product.price))}
            </span>
            {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
              <span
                className="text-xs line-through"
                style={{ color: '#C8C0B8', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
              >
                {formatINR(Number(product.comparePrice))}
              </span>
            )}
          </div>
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-[#C8703A] text-[#C8703A]" />
              <span
                className="text-xs"
                style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
              >
                {parseFloat(String(avgRating)).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
