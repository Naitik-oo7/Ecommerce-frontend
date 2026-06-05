'use client';

import { useGetWishlistQuery, useRemoveFromWishlistMutation, useClearWishlistMutation } from '@/services/api/wishlistApi';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthLoading } from '@/components/auth/RequireAuth';
import { Heart, Trash2, ShoppingBag, Star, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { extractWishlist } from '@/lib/api-utils';
import { motion } from 'framer-motion';

export default function WishlistPage() {
  const router = useRouter();
  const { ready, isAuthenticated } = useAuthGuard();
  const { data: wishlistResponse, isLoading } = useGetWishlistQuery({}, { skip: !isAuthenticated });
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [clearWishlist] = useClearWishlistMutation();
  const [removeLoadingIds, setRemoveLoadingIds] = useState<Set<number>>(new Set());

  if (!ready) return <AuthLoading />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F3EE' }}>
        <div className="text-center px-6">
          <Heart className="h-14 w-14 mx-auto mb-6" style={{ color: '#C8C0B8' }} />
          <h2
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)', color: '#1A1A18' }}
          >
            Sign in to view your wishlist
          </h2>
          <p className="text-sm mb-8" style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
            Save pieces you love and find them here.
          </p>
          <Link href={`/login?redirect=${encodeURIComponent('/wishlist')}`}>
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium cursor-pointer"
              style={{ background: '#1A1A18', color: '#F6F3EE', fontFamily: 'var(--font-body, Jost, sans-serif)', letterSpacing: '0.06em' }}
            >
              Login to Continue <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: '#F6F3EE' }}>
        <div className="container-mono py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-3/4 rounded-xl mb-3" style={{ background: '#E2D9CE' }} />
                <div className="space-y-2">
                  <div className="h-4 rounded w-3/4" style={{ background: '#E2D9CE' }} />
                  <div className="h-3 rounded w-1/2" style={{ background: '#E2D9CE' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const wishlistItems = extractWishlist(wishlistResponse);

  const handleAddToCart = (productSlug: string) => {
    router.push(`/products/${productSlug}`);
  };

  const handleRemove = async (productId: number) => {
    setRemoveLoadingIds((prev) => new Set(prev).add(productId));
    try {
      await removeFromWishlist(productId).unwrap();
    } catch {}
    setRemoveLoadingIds((prev) => {
      const n = new Set(prev);
      n.delete(productId);
      return n;
    });
  };

  return (
    <div className="min-h-screen" style={{ background: '#F6F3EE' }}>

      {/* ── Page Header ── */}
      <div className="border-b" style={{ background: '#F0ECE4', borderColor: '#E2D9CE' }}>
        <div className="container-mono py-8 md:py-10">
          <div className="flex items-end justify-between">
            <div>
              <span
                className="text-xs font-semibold tracking-[0.2em] uppercase mb-3 block"
                style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
              >
                My Account
              </span>
              <h1
                className="leading-[1.05]"
                style={{
                  fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                  fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                  fontWeight: 700,
                  color: '#1A1A18',
                }}
              >
                Wishlist
              </h1>
              {wishlistItems.length > 0 && (
                <p
                  className="text-sm mt-1"
                  style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                >
                  {wishlistItems.length} saved {wishlistItems.length === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
            {wishlistItems.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => clearWishlist(undefined).catch(() => {})}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70"
                style={{ color: '#B54A4A', fontFamily: 'var(--font-body, Jost, sans-serif)', letterSpacing: '0.04em' }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container-mono py-10 md:py-14">
        {wishlistItems.length === 0 ? (
          <div className="text-center py-24">
            <Heart className="h-14 w-14 mx-auto mb-6" style={{ color: '#C8C0B8' }} />
            <h2
              className="text-2xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)', color: '#1A1A18' }}
            >
              Your wishlist is empty
            </h2>
            <p
              className="text-sm mb-8"
              style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Save pieces you love — they&apos;ll be waiting here for you.
            </p>
            <Link href="/products">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium cursor-pointer"
                style={{ background: '#1A1A18', color: '#F6F3EE', fontFamily: 'var(--font-body, Jost, sans-serif)', letterSpacing: '0.06em' }}
              >
                Browse Collection <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlistItems.map((item: any, index: number) => {
              const product = item.product;
              const media = product.media || [];
              const primaryImage = media.find((m: any) => m.isPrimary)?.url || media[0]?.url || product.images?.[0];
              const totalStock = product.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
              const isOutOfStock = totalStock === 0;
              const isRemoving = removeLoadingIds.has(product.id);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="group"
                >
                  {/* Image */}
                  <div className="relative aspect-3/4 overflow-hidden rounded-xl mb-3" style={{ background: '#E8E4DE' }}>
                    <Link href={`/products/${product.slug}`}>
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-600"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-10 w-10" style={{ color: '#C8C0B8' }} />
                        </div>
                      )}
                    </Link>

                    {isOutOfStock && (
                      <div
                        className="absolute top-3 left-3 px-2 py-1 text-[10px] font-semibold tracking-wide uppercase"
                        style={{ background: '#1A1A18', color: '#F6F3EE', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                      >
                        Out of Stock
                      </div>
                    )}

                    {/* Remove button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemove(product.id)}
                      disabled={isRemoving}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}
                    >
                      {isRemoving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#1A1A18' }} />
                      ) : (
                        <Heart className="h-3.5 w-3.5 fill-mono-rose text-mono-rose" />
                      )}
                    </motion.button>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <Link href={`/products/${product.slug}`}>
                      <p
                        className="text-sm font-semibold leading-snug line-clamp-2 hover:opacity-70 transition-opacity"
                        style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                      >
                        {product.name}
                      </p>
                    </Link>
                    <p
                      className="text-xs"
                      style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                    >
                      {product.category?.name}
                    </p>
                    <div className="flex items-center justify-between pt-0.5">
                      <p
                        className="text-sm font-bold"
                        style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                      >
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(product.price))}
                      </p>
                      {product.avgRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-[#C8703A] text-[#C8703A]" />
                          <span className="text-xs" style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
                            {parseFloat(product.avgRating).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddToCart(product.slug)}
                    disabled={isOutOfStock}
                    className="w-full mt-3 py-2.5 text-xs font-medium transition-colors disabled:opacity-40"
                    style={{
                      background: isOutOfStock ? '#E2D9CE' : '#1A1A18',
                      color: isOutOfStock ? '#6B6560' : '#F6F3EE',
                      fontFamily: 'var(--font-body, Jost, sans-serif)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {isOutOfStock ? 'Out of Stock' : 'Select Size'}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
