/**
 * Admin Utilities
 * 
 * Shared utility functions used across admin pages.
 */

export interface Variant {
  id?: number;
  stock?: number;
}

export interface MediaItem {
  url?: string;
  isPrimary?: boolean;
}

/**
 * Calculate total stock across all variants.
 */
export const getTotalStock = (variants: Variant[] = []): number => {
  return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
};

/**
 * Get primary image URL from media array.
 * Falls back to first image if no primary is marked.
 */
export const getPrimaryImage = (media: MediaItem[] = []): string | null => {
  const primary = media?.find((m) => m.isPrimary);
  return primary?.url || media?.[0]?.url || null;
};

/**
 * Format price with ₹ symbol.
 */
export const formatPrice = (price: string | number | undefined): string => {
  if (price === undefined || price === null) return '—';
  const n = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(n) ? '—' : `₹${n.toFixed(2)}`;
};

/**
 * Format price with $ symbol (for legacy code).
 */
export const formatPriceUSD = (price: string | number | undefined): string => {
  if (price === undefined || price === null) return '—';
  const n = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(n) ? '—' : `$${n.toFixed(2)}`;
};

/**
 * Check if any variant has low stock (<= 5 and > 0).
 */
export const hasLowStock = (variants: Variant[] = []): boolean => {
  return variants.some((v) => (v.stock || 0) <= 5 && (v.stock || 0) > 0);
};

/**
 * Check if product is completely out of stock.
 */
export const isOutOfStock = (variants: Variant[] = []): boolean => {
  return getTotalStock(variants) === 0;
};
