'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Check, Minus, Plus } from 'lucide-react';

interface Variant {
  id: number;
  size?: string;
  color?: string;
  stock: number;
}

interface ProductActionsProps {
  quantity: number;
  setQuantity: (q: number) => void;
  selectedVariant: Variant | null;
  onAddToCart: () => void;
  onBuyNow: () => void;
  cartLoading: boolean;
  buyNowLoading: boolean;
  addedToCart: boolean;
  price: number;
  comparePrice?: number | null;
}

function Spinner({ light }: { light?: boolean }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      className={`w-5 h-5 border-2 rounded-full ${
        light ? 'border-white/30 border-t-white' : 'border-mono-charcoal/30 border-t-mono-charcoal'
      }`}
    />
  );
}

export function ProductActions({
  quantity,
  setQuantity,
  selectedVariant,
  onAddToCart,
  onBuyNow,
  cartLoading,
  buyNowLoading,
  addedToCart,
  price,
  comparePrice,
}: ProductActionsProps) {
  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0;
  const maxQuantity = selectedVariant?.stock || 0;
  const actionsRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -80px 0px' }
    );
    if (actionsRef.current) observer.observe(actionsRef.current);
    return () => observer.disconnect();
  }, []);

  const variantLabel = [selectedVariant?.color, selectedVariant?.size].filter(Boolean).join(' · ');

  return (
    <>
      <div ref={actionsRef} className="space-y-4 pt-1">
        <div className="flex items-center gap-4">
          <span className="text-sm text-mono-stone w-20 shrink-0">Quantity</span>
          <div className="inline-flex items-center border border-border rounded-lg bg-white">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-11 h-11 flex items-center justify-center hover:bg-mono-sand/40 transition-colors disabled:opacity-40"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              className="w-11 h-11 flex items-center justify-center hover:bg-mono-sand/40 transition-colors disabled:opacity-40"
              disabled={isOutOfStock || quantity >= maxQuantity}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <Button
            onClick={onAddToCart}
            disabled={isOutOfStock || cartLoading || buyNowLoading}
            className="h-12 md:h-11 text-[15px] md:text-sm font-semibold rounded-lg bg-mono-terracotta hover:bg-mono-terracotta/90 text-white shadow-sm"
          >
            {cartLoading ? (
              <Spinner light />
            ) : addedToCart ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Added to bag
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-5 w-5" />
                {isOutOfStock ? 'Sold out' : 'Add to bag'}
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={onBuyNow}
            disabled={isOutOfStock || buyNowLoading || cartLoading}
            className="h-12 md:h-11 md:px-8 font-semibold text-mono-charcoal border border-mono-charcoal rounded-lg hover:bg-mono-charcoal hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {buyNowLoading ? 'Processing…' : 'Buy now'}
          </button>
        </div>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-mono-charcoal tabular-nums leading-tight">
                  ₹{price.toLocaleString('en-IN')}
                </p>
                {comparePrice && comparePrice > price && (
                  <p className="text-xs text-mono-stone line-through tabular-nums">
                    ₹{comparePrice.toLocaleString('en-IN')}
                  </p>
                )}
                {variantLabel && (
                  <p className="text-xs text-mono-stone truncate capitalize">{variantLabel}</p>
                )}
              </div>
              <Button
                onClick={onAddToCart}
                disabled={isOutOfStock || cartLoading || buyNowLoading}
                className="h-11 px-6 rounded-lg bg-mono-terracotta hover:bg-mono-terracotta/90 text-white font-semibold shrink-0"
              >
                {cartLoading ? <Spinner light /> : addedToCart ? <Check className="h-4 w-4" /> : 'Add to bag'}
              </Button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
