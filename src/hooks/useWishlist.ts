'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';
import { 
  useGetWishlistQuery, 
  useAddToWishlistMutation, 
  useRemoveFromWishlistMutation 
} from '@/services/api/wishlistApi';
import { extractWishlist } from '@/lib/api-utils';

interface UseWishlistOptions {
  skip?: boolean;
}

export function useWishlist(options: UseWishlistOptions = {}) {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { skip = false } = options;
  
  // Fetch wishlist data
  const { data: wishlistResponse } = useGetWishlistQuery(
    {}, 
    { skip: !isAuthenticated || skip }
  );
  
  // Mutations
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  
  // Optimistic state for immediate UI feedback
  const [optimisticIds, setOptimisticIds] = useState<Set<number> | null>(null);
  
  // Compute wishlist IDs from server response
  const serverIds = useMemo(() => {
    const items = extractWishlist(wishlistResponse);
    return new Set(
      items
        .map((item: { productId?: number; product?: { id?: number }; id?: number }) => 
          item.productId ?? item.product?.id ?? item.id
        )
        .filter((id): id is number => typeof id === 'number')
    );
  }, [wishlistResponse]);
  
  // Use optimistic IDs if available, otherwise server IDs
  const wishlistIds = optimisticIds ?? serverIds;
  
  // Check if a product is in wishlist
  const isInWishlist = useCallback((productId: number) => {
    return wishlistIds.has(productId);
  }, [wishlistIds]);
  
  // Toggle wishlist status with optimistic updates
  const toggleWishlist = useCallback(async (productId: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    const currentlyInWishlist = wishlistIds.has(productId);
    
    // Optimistic update
    setOptimisticIds((prev) => {
      const next = new Set(prev ?? serverIds);
      if (currentlyInWishlist) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
    
    try {
      if (currentlyInWishlist) {
        await removeFromWishlist(productId).unwrap();
      } else {
        await addToWishlist(productId).unwrap();
      }
    } catch {
      // Revert on error by clearing optimistic state
      setOptimisticIds(null);
    }
  }, [isAuthenticated, router, wishlistIds, serverIds, addToWishlist, removeFromWishlist]);
  
  return {
    wishlistIds,
    isInWishlist,
    toggleWishlist,
    isAuthenticated,
    count: wishlistIds.size,
  };
}
