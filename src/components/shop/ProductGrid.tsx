'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PackageSearch } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { CardSkeleton } from '@/components/common/CardSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  wishlistIds: Set<number>;
  onToggleWishlist: (productId: number, e: React.MouseEvent) => void;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  totalCount?: number;
  currentCount?: number;
}

export function ProductGrid({
  products,
  wishlistIds,
  onToggleWishlist,
  isLoading,
  isFetchingMore,
  hasMore,
  onLoadMore,
  totalCount,
  currentCount,
}: ProductGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isFetchingMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '600px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <CardSkeleton count={9} />
      </div>
    );
  }

  if (!isLoading && products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products found"
        description="Try adjusting your filters or browse a different category."
        className="py-24"
      />
    );
  }

  return (
    <div>
      {/* Count */}
      {totalCount !== undefined && currentCount !== undefined && (
        <p className="text-sm text-[#6B6B6B] mb-5">
          Showing <span className="font-medium text-[#111111]">{currentCount}</span> of{' '}
          <span className="font-medium text-[#111111]">{totalCount}</span> products
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            isInWishlist={wishlistIds.has(product.id)}
            onToggleWishlist={(e) => onToggleWishlist(product.id, e)}
          />
        ))}
      </div>

      {/* Skeleton rows when fetching more */}
      {isFetchingMore && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6">
          <CardSkeleton count={3} />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* End of results */}
      {!hasMore && products.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center pt-12 pb-4"
        >
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-16 bg-[#E5E2DD]" />
            <span className="text-xs text-[#6B6B6B] tracking-widest uppercase">End of results</span>
            <div className="h-px w-16 bg-[#E5E2DD]" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
