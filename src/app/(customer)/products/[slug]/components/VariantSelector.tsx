'use client';

import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

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

  // Only group by color when variants actually have color values
  const hasColors = variants.some((v) => v.color);
  const colors = hasColors ? [...new Set(variants.filter((v) => v.color).map((v) => v.color))] : [];
  const selectedColor = selectedVariant?.color;

  // Get sizes for selected color, or all sizes if no colors
  const sizesForColor = hasColors
    ? (selectedColor ? variants.filter((v) => v.color === selectedColor) : [])
    : variants;

  return (
    <div className="space-y-4">
      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            Color {selectedColor && <span className="text-muted-foreground font-normal">— {selectedColor}</span>}
          </label>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color);
              const isSelected = selectedVariant?.color === color;
              return (
                <button
                  key={color}
                  onClick={() => {
                    // Select first available size for this color
                    const firstVariant = variants.find((v) => v.color === color && v.stock > 0)
                      || variants.find((v) => v.color === color);
                    if (firstVariant) onSelect(firstVariant);
                  }}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: variant?.colorHex || '#ccc' }}
                  title={color}
                  aria-label={`Select color ${color}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizesForColor.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            Size {selectedVariant?.size && <span className="text-muted-foreground font-normal">— {selectedVariant.size}</span>}
          </label>
          <div className="flex gap-2 flex-wrap">
            {sizesForColor.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              const isOutOfStock = variant.stock === 0;
              
              return (
                <motion.button
                  key={variant.id}
                  whileHover={!isOutOfStock ? { scale: 1.05 } : {}}
                  whileTap={!isOutOfStock ? { scale: 0.95 } : {}}
                  onClick={() => !isOutOfStock && onSelect(variant)}
                  disabled={isOutOfStock}
                  className={`min-w-[60px] h-10 px-3 rounded-lg border text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-500'
                      : isOutOfStock
                      ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed line-through'
                      : 'bg-white border-border hover:border-amber-300'
                  }`}
                >
                  {variant.size}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Status */}
      {selectedVariant && (
        <div className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-muted-foreground" />
          {selectedVariant.stock === 0 ? (
            <span className="text-red-600">Out of stock</span>
          ) : selectedVariant.stock <= 5 ? (
            <span className="text-amber-600">Only {selectedVariant.stock} left</span>
          ) : (
            <span className="text-green-600">In stock</span>
          )}
        </div>
      )}
    </div>
  );
}
