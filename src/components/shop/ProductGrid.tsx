'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PackageSearch } from 'lucide-react';
import { ProductCard, type ProductCardView } from '@/components/products/ProductCard';
import { EmptyState } from '@/components/common/EmptyState';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  view?: ProductCardView;
  wishlistIds: Set<number>;
  onToggleWishlist: (productId: number, e: React.MouseEvent) => void;
  onQuickView?: (product: Product) => void;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const GRID_CLASS =
  'grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-3 md:gap-x-4 md:gap-y-6 xl:grid-cols-5';

/** Skeleton card matching the real ProductCard footprint. */
function GridCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E2DA] bg-white">
      <div className="aspect-[3/4] skeleton-shimmer" />
      <div className="space-y-2 px-4 py-3.5">
        <div className="h-2.5 w-1/3 rounded bg-mono-sand" />
        <div className="h-3.5 w-3/4 rounded bg-mono-sand" />
        <div className="h-3.5 w-1/2 rounded bg-mono-sand" />
        <div className="flex gap-1.5 pt-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3.5 w-3.5 rounded-full bg-mono-sand" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ListCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-[#E8E2DA] bg-white p-3 sm:gap-6 sm:p-4">
      <div className="aspect-square w-28 shrink-0 rounded-xl skeleton-shimmer sm:w-44" />
      <div className="flex-1 space-y-3 py-2">
        <div className="h-2.5 w-24 rounded bg-mono-sand" />
        <div className="h-4 w-2/3 rounded bg-mono-sand" />
        <div className="h-3 w-full max-w-md rounded bg-mono-sand" />
        <div className="h-5 w-24 rounded bg-mono-sand" />
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  view = 'grid',
  wishlistIds,
  onToggleWishlist,
  onQuickView,
  isLoading,
  isFetchingMore,
  hasMore,
  onLoadMore,
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

  const isList = view === 'list';
  const containerClass = isList ? 'flex flex-col gap-4' : GRID_CLASS;
  const Skeleton = isList ? ListCardSkeleton : GridCardSkeleton;

  if (isLoading) {
    return (
      <div className={containerClass}>
        {Array.from({ length: isList ? 6 : 9 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
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
      <div className={containerClass}>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            view={view}
            isInWishlist={wishlistIds.has(product.id)}
            onToggleWishlist={(e) => onToggleWishlist(product.id, e)}
            onQuickView={onQuickView}
          />
        ))}
      </div>

      {/* Skeletons while fetching the next page */}
      {isFetchingMore && (
        <div className={`${containerClass} mt-7 md:mt-9`}>
          {Array.from({ length: isList ? 2 : 4 }).map((_, i) => (
            <Skeleton key={i} />
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
          className="pb-4 pt-14 text-center"
        >
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-16 bg-[#E5E2DD]" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-mono-stone">
              You&apos;ve seen it all
            </span>
            <div className="h-px w-16 bg-[#E5E2DD]" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
