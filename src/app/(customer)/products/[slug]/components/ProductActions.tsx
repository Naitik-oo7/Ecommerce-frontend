'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Zap, Check, Minus, Plus } from 'lucide-react';

interface Variant {
  id: number;
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
}: ProductActionsProps) {
  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0;
  const maxQuantity = selectedVariant?.stock || 0;

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity:</span>
        <div className="flex items-center border border-input rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-50"
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
            className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-50"
            disabled={quantity >= maxQuantity}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Buy Now + Add to Cart Buttons */}
      <div className="flex flex-col gap-3">
        {/* Buy Now — primary CTA */}
        <Button
          onClick={onBuyNow}
          disabled={isOutOfStock || buyNowLoading || cartLoading}
          className="w-full bg-mono-terracotta hover:bg-mono-terracotta/90 text-white h-14 text-base font-semibold"
        >
          {buyNowLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <Zap className="mr-2 h-5 w-5" />
              {isOutOfStock ? 'Sold Out' : 'Buy Now'}
            </>
          )}
        </Button>

        {/* Add to Cart — secondary */}
        <Button
          onClick={onAddToCart}
          disabled={isOutOfStock || cartLoading || buyNowLoading}
          variant="outline"
          className="w-full border-mono-charcoal text-mono-charcoal hover:bg-mono-charcoal hover:text-white h-12 text-base"
        >
          {cartLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-mono-charcoal/30 border-t-mono-charcoal rounded-full"
            />
          ) : addedToCart ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              Added to Cart
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
  );
}
