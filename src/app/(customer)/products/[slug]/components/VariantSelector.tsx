'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Variant {
  id: number;
  size: string;
  color: string;
  colorHex?: string;
  stock: number;
  price: number;
  sku: string;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariant: Variant | null;
  onSelect: (variant: Variant) => void;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-xs text-red-500 font-medium flex items-center gap-1"><XCircle className="h-3 w-3" /> Sold out</span>;
  if (stock <= 3) return <span className="text-xs text-orange-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Only {stock} left!</span>;
  if (stock <= 10) return <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Low stock</span>;
  return <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> In stock</span>;
}

export function VariantSelector({ variants, selectedVariant, onSelect }: VariantSelectorProps) {
  if (!variants?.length) return null;

  const hasColors = variants.some((v) => v.color);
  const colors = hasColors ? [...new Set(variants.filter((v) => v.color).map((v) => v.color))] : [];
  const selectedColor = selectedVariant?.color;

  const sizesForColor = hasColors
    ? (selectedColor ? variants.filter((v) => v.color === selectedColor) : [])
    : variants;

  return (
    <div className="space-y-5">
      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-mono-charcoal">Color</label>
            {selectedColor && (
              <span className="text-sm text-muted-foreground capitalize">{selectedColor}</span>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color);
              const isSelected = selectedVariant?.color === color;
              const hasStock = variants.some((v) => v.color === color && v.stock > 0);
              return (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const first = variants.find((v) => v.color === color && v.stock > 0)
                      || variants.find((v) => v.color === color);
                    if (first) onSelect(first);
                  }}
                  className={`relative w-9 h-9 rounded-full transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-mono-terracotta'
                      : 'ring-1 ring-transparent hover:ring-mono-stone/40 hover:ring-offset-1'
                  } ${!hasStock ? 'opacity-40' : ''}`}
                  style={{ backgroundColor: variant?.colorHex || '#ccc' }}
                  title={color}
                  aria-label={`Select color ${color}`}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-white/80" />
                    </span>
                  )}
                  {!hasStock && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-full h-[1px] bg-white/70 rotate-45" />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizesForColor.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-mono-charcoal">Size</label>
            {selectedVariant?.size && (
              <span className="text-sm text-muted-foreground">Selected: <strong>{selectedVariant.size}</strong></span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {sizesForColor.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              const isOutOfStock = variant.stock === 0;
              const isLowStock = variant.stock > 0 && variant.stock <= 5;

              return (
                <motion.button
                  key={variant.id}
                  whileHover={!isOutOfStock ? { y: -1 } : {}}
                  whileTap={!isOutOfStock ? { scale: 0.96 } : {}}
                  onClick={() => !isOutOfStock && onSelect(variant)}
                  disabled={isOutOfStock}
                  title={isLowStock ? `Only ${variant.stock} left` : undefined}
                  className={`relative min-w-[52px] h-11 px-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-mono-charcoal text-white border-mono-charcoal shadow-md'
                      : isOutOfStock
                      ? 'bg-muted/50 text-muted-foreground/50 border-muted cursor-not-allowed'
                      : 'bg-white text-mono-charcoal border-border hover:border-mono-charcoal hover:shadow-sm'
                  }`}
                >
                  {variant.size}
                  {isLowStock && !isOutOfStock && (
                    <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-orange-400 rounded-full border border-white" />
                  )}
                  {isOutOfStock && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="absolute w-full h-[1.5px] bg-muted-foreground/30 rotate-[20deg]" />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> = Low stock
            </span>
          </p>
        </div>
      )}

      {/* Stock Status for selected variant */}
      <AnimatePresence mode="wait">
        {selectedVariant && (
          <motion.div
            key={selectedVariant.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
          >
            <StockBadge stock={selectedVariant.stock} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
