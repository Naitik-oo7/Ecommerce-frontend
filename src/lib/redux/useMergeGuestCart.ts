import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { clearGuestCart } from '@/lib/redux/guestCartSlice';
import { useMergeCartMutation } from '@/services/api/cartApi';

/**
 * Returns a function that merges the guest (localStorage) cart into the
 * authenticated user's server cart, then clears the guest cart.
 *
 * Call this right after a successful login/registration, once the auth
 * token has been set (so the merge request is authenticated).
 *
 * It is safe to call when the guest cart is empty (it no-ops), and it never
 * throws — a failed merge must not block the login flow.
 */
export function useMergeGuestCart() {
  const dispatch = useAppDispatch();
  const guestItems = useAppSelector((state) => state.guestCart.items);
  const [mergeCart] = useMergeCartMutation();

  return useCallback(async () => {
    if (!guestItems.length) return;

    const payload = guestItems.map(({ variantId, size, quantity }) => ({
      variantId,
      size,
      quantity,
    }));

    try {
      await mergeCart(payload).unwrap();
      dispatch(clearGuestCart());
    } catch {
      // Keep the guest cart on failure so nothing is lost; the user can
      // retry, and the items remain visible in the meantime.
    }
  }, [guestItems, mergeCart, dispatch]);
}
