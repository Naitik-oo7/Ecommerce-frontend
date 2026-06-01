'use client';

import { formatCurrency } from '@/lib/currency';

interface CartItem {
  id: number;
  product?: {
    name?: string;
    primaryImage?: string | null;
    media?: { url?: string }[];
  };
  variant?: {
    size?: string;
  };
  size?: string;
  quantity: number;
  // Authoritative per-line total from the cart API — never recompute.
  lineTotal?: number;
}

interface OrderItemsReviewProps {
  cartItems: CartItem[];
}

export function OrderItemsReview({ cartItems }: OrderItemsReviewProps) {
  return (
    <ul className="divide-y divide-[#E5E2DD]">
      {cartItems.map((item) => {
        const image = item.product?.primaryImage || item.product?.media?.[0]?.url;
        const size = item.variant?.size ?? item.size;
        return (
          <li key={item.id} className="py-3 flex gap-3 first:pt-0 last:pb-0">
            <div className="relative w-16 h-16 rounded-xl bg-[#F6F3EE] overflow-hidden shrink-0 border border-[#E5E2DD]">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={item.product?.name || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-[#9B9B9B]">
                  No Image
                </div>
              )}
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#111111] text-white text-[11px] font-medium flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="font-medium text-sm text-[#111111] truncate">{item.product?.name}</p>
              {size && <p className="text-xs text-[#9B9B9B] mt-0.5">Size: {size}</p>}
            </div>
            <div className="flex items-center">
              <span className="text-sm font-semibold text-[#111111]">
                {formatCurrency(item.lineTotal ?? 0)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
