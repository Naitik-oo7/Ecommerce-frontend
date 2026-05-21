'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PackageSearch } from 'lucide-react';
import { PremiumProductCard } from '@/components/products/PremiumProductCard';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  comparePrice?: string;
  stock: number;
  images?: string[];
  category?: { name: string };
}

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

function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] bg-[#F0EDE8] rounded-2xl mb-4" />
      <div className="h-3 bg-[#F0EDE8] rounded w-1/3 mb-2" />
      <div className="h-4 bg-[#F0EDE8] rounded w-3/4 mb-2" />
      <div className="h-4 bg-[#F0EDE8] rounded w-1/2" />
    </div>
  );
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
        {[...Array(9)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!isLoading && products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-16 h-16 bg-[#F6F3EE] rounded-full flex items-center justify-center mb-5">
          <PackageSearch className="h-7 w-7 text-[#6B6B6B]" />
        </div>
        <h3 className="text-lg font-semibold text-[#111111] mb-2">No products found</h3>
        <p className="text-sm text-[#6B6B6B] max-w-xs">
          Try adjusting your filters or browse a different category.
        </p>
      </motion.div>
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
          <PremiumProductCard
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
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
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
