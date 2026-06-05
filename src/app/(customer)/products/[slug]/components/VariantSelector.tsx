'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

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

export function VariantSelector({ variants, selectedVariant, onSelect }: VariantSelectorProps) {
  if (!variants?.length) return null;

  const hasColors = variants.some((v) => v.color);
  const colors = hasColors ? [...new Set(variants.filter((v) => v.color).map((v) => v.color))] : [];
  const selectedColor = selectedVariant?.color;

  const sizesForColor = hasColors
    ? selectedColor
      ? variants.filter((v) => v.color === selectedColor)
      : []
    : variants;

  const stockLabel =
    !selectedVariant
      ? null
      : selectedVariant.stock === 0
        ? { text: 'Out of stock', className: 'text-mono-rose' }
        : selectedVariant.stock === 1
          ? { text: '1 left', className: 'text-mono-terracotta font-semibold' }
          : selectedVariant.stock <= 5
            ? { text: `${selectedVariant.stock} left`, className: 'text-mono-terracotta' }
            : null;

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <div>
          <p className="text-sm text-mono-stone mb-3">
            Color:{' '}
            <span className="text-mono-charcoal font-medium capitalize">{selectedColor || '—'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color);
              const isSelected = selectedVariant?.color === color;
              const hasStock = variants.some((v) => v.color === color && v.stock > 0);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    const first =
                      variants.find((v) => v.color === color && v.stock > 0) ||
                      variants.find((v) => v.color === color);
                    if (first) onSelect(first);
                  }}
                  className={`relative w-11 h-11 rounded-full transition-all ${
                    isSelected ? 'ring-2 ring-mono-charcoal ring-offset-2' : 'ring-1 ring-border'
                  } ${!hasStock ? 'opacity-40' : ''}`}
                  style={{ backgroundColor: variant?.colorHex || '#CFC7BD' }}
                  title={color}
                  aria-label={`Color ${color}`}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizesForColor.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-mono-stone">
              Size:{' '}
              <span className="text-mono-charcoal font-medium">{selectedVariant?.size || '—'}</span>
            </p>
            <button
              type="button"
              className="text-sm text-mono-terracotta hover:underline underline-offset-2"
              onClick={() =>
                document.getElementById('pdp-shipping')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Size guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizesForColor.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              const isOutOfStock = variant.stock === 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => !isOutOfStock && onSelect(variant)}
                  disabled={isOutOfStock}
                  className={`min-w-[3rem] h-11 px-3 text-sm font-medium rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-mono-charcoal text-white border-mono-charcoal'
                      : isOutOfStock
                        ? 'bg-mono-sand/30 text-mono-stone/50 border-transparent line-through cursor-not-allowed'
                        : 'bg-white text-mono-charcoal border-border hover:border-mono-charcoal'
                  }`}
                  aria-pressed={isSelected}
                >
                  {variant.size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {stockLabel && (
          <motion.p
            key={selectedVariant?.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`text-sm font-medium ${stockLabel.className}`}
          >
            {stockLabel.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
