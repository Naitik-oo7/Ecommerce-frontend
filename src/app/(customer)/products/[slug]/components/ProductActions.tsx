'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Zap, Check, Minus, Plus } from 'lucide-react';

interface Variant {
  id: number;
  size?: string;
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
  productName?: string;
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
  productName,
}: ProductActionsProps) {
  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0;
  const maxQuantity = selectedVariant?.stock || 0;
  const actionsRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -60px 0px' }
    );
    if (actionsRef.current) observer.observe(actionsRef.current);
    return () => observer.disconnect();
  }, []);

  const urgency =
    !isOutOfStock && selectedVariant && selectedVariant.stock <= 5
      ? `Only ${selectedVariant.stock} left — order soon!`
      : null;

  return (
    <>
      <div ref={actionsRef} className="space-y-4">
        {/* Quantity Selector */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-mono-charcoal">Qty:</span>
          <div className="flex items-center rounded-xl border-2 border-border overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-semibold text-sm tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
              disabled={isOutOfStock || quantity >= maxQuantity}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {urgency && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-medium text-orange-500"
            >
              {urgency}
            </motion.span>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onBuyNow}
            disabled={isOutOfStock || buyNowLoading || cartLoading}
            className="w-full bg-mono-terracotta hover:bg-mono-terracotta/90 text-white h-14 text-base font-semibold rounded-xl shadow-sm"
          >
            {buyNowLoading ? <Spinner light /> : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                {isOutOfStock ? 'Sold Out' : 'Buy Now'}
              </>
            )}
          </Button>

          <Button
            onClick={onAddToCart}
            disabled={isOutOfStock || cartLoading || buyNowLoading}
            variant="outline"
            className="w-full border-2 border-mono-charcoal text-mono-charcoal hover:bg-mono-charcoal hover:text-white h-12 text-base rounded-xl transition-all"
          >
            {cartLoading ? <Spinner /> : addedToCart ? (
              <>
                <Check className="mr-2 h-5 w-5 text-green-500" />
                Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sticky Bottom Bar — mobile only, appears when CTA scrolls out of view */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-border/60 px-4 py-3 flex gap-3 shadow-2xl"
          >
            {productName && (
              <div className="hidden sm:block flex-1 min-w-0 self-center">
                <p className="text-xs font-semibold truncate text-mono-charcoal">{productName}</p>
                {selectedVariant?.size && (
                  <p className="text-xs text-muted-foreground">Size: {selectedVariant.size}</p>
                )}
              </div>
            )}
            <Button
              onClick={onAddToCart}
              disabled={isOutOfStock || cartLoading || buyNowLoading}
              variant="outline"
              size="sm"
              className="flex-1 border-2 border-mono-charcoal text-mono-charcoal hover:bg-mono-charcoal hover:text-white rounded-xl h-11"
            >
              {cartLoading ? <Spinner /> : addedToCart ? <><Check className="mr-1.5 h-4 w-4" /> Added</> : <><ShoppingCart className="mr-1.5 h-4 w-4" /> Add to Cart</>}
            </Button>
            <Button
              onClick={onBuyNow}
              disabled={isOutOfStock || buyNowLoading || cartLoading}
              size="sm"
              className="flex-1 bg-mono-terracotta hover:bg-mono-terracotta/90 text-white rounded-xl h-11 font-semibold"
            >
              {buyNowLoading ? <Spinner light /> : <><Zap className="mr-1.5 h-4 w-4" /> Buy Now</>}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
