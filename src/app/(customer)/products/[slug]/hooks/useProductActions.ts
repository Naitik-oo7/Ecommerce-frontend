'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { loginRedirectUrl } from '@/lib/loginRedirect';
import { useAddToCartMutation } from '@/services/api/cartApi';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '@/services/api/wishlistApi';
import { addGuestItem } from '@/lib/redux/guestCartSlice';

export interface GuestCartMeta {
  productName?: string;
  productSlug?: string;
  price?: number;
  comparePrice?: number | null;
  imageUrl?: string | null;
  category?: string;
}

interface UseProductActionsOptions {
  productId: number;
  slug: string;
}

export function useProductActions({ productId, slug }: UseProductActionsOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const [addToCartMutation] = useAddToCartMutation();
  const [addToWishlistMutation] = useAddToWishlistMutation();
  const [removeFromWishlistMutation] = useRemoveFromWishlistMutation();

  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      router.push(loginRedirectUrl(pathname));
      return false;
    }
    return true;
  }, [isAuthenticated, router, pathname]);

  const handleAddToCart = useCallback(
    async (variantId: number, size: string, meta?: GuestCartMeta) => {
      if (!variantId) return;

      if (!isAuthenticated) {
        dispatch(
          addGuestItem({
            variantId,
            size,
            quantity,
            productName: meta?.productName ?? '',
            productSlug: meta?.productSlug ?? slug,
            price: meta?.price ?? 0,
            comparePrice: meta?.comparePrice ?? null,
            imageUrl: meta?.imageUrl ?? null,
            category: meta?.category,
          })
        );
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2500);
        return;
      }

      setCartLoading(true);
      try {
        await addToCartMutation({ variantId, size, quantity }).unwrap();
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2500);
      } catch {
        // Error handled by RTK Query
      }
      setCartLoading(false);
    },
    [addToCartMutation, quantity, isAuthenticated, dispatch, slug]
  );

  const handleBuyNow = useCallback(
    async (variantId: number, size: string) => {
      if (!requireAuth()) return;
      if (!variantId) return;

      setBuyNowLoading(true);
      try {
        await addToCartMutation({ variantId, size, quantity }).unwrap();
        router.push('/checkout');
      } catch {
        setBuyNowLoading(false);
      }
    },
    [addToCartMutation, quantity, requireAuth, router]
  );

  const toggleWishlist = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!requireAuth()) return;

      setWishlistLoading(true);
      try {
        if (inWishlist) {
          await removeFromWishlistMutation(productId).unwrap();
          setInWishlist(false);
        } else {
          await addToWishlistMutation(productId).unwrap();
          setInWishlist(true);
        }
      } catch {
        // Error handled by RTK Query
      }
      setWishlistLoading(false);
    },
    [addToWishlistMutation, inWishlist, productId, removeFromWishlistMutation, requireAuth]
  );

  return {
    quantity,
    setQuantity,
    cartLoading,
    buyNowLoading,
    wishlistLoading,
    inWishlist,
    setInWishlist,
    addedToCart,
    handleAddToCart,
    handleBuyNow,
    toggleWishlist,
  };
}
