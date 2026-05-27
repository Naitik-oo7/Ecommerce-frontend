'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Heart } from 'lucide-react';
import { useGetRelatedProductsQuery } from '@/services/api/productsApi';
import { useAddToWishlistMutation } from '@/services/api/wishlistApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { useRouter } from 'next/navigation';

interface RelatedProductsProps {
  slug: string;
}

export function RelatedProducts({ slug }: RelatedProductsProps) {
  const { data: products, isLoading } = useGetRelatedProductsQuery({ slug, limit: 8 });
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [addToWishlist] = useAddToWishlistMutation();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  };

  const handleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push('/login'); return; }
    await addToWishlist(productId);
  };

  if (isLoading) {
    return (
      <section className="container-mono py-16 border-t border-border">
        <h2 className="text-2xl font-bold text-mono-charcoal mb-6">You May Also Like</h2>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-56 shrink-0 animate-pulse">
              <div className="aspect-[3/4] bg-muted rounded-2xl mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products?.length) return null;

  return (
    <section className="container-mono py-16 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-mono-charcoal">You May Also Like</h2>
          <p className="text-sm text-muted-foreground mt-0.5">From the same collection</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:border-mono-charcoal hover:bg-mono-charcoal hover:text-white transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:border-mono-charcoal hover:bg-mono-charcoal hover:text-white transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product, idx) => {
          const salePercent =
            product.comparePrice && product.comparePrice > product.price
              ? Math.round((1 - product.price / product.comparePrice) * 100)
              : null;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="w-52 md:w-60 shrink-0 snap-start group"
            >
              <Link href={`/products/${product.slug}`}>
                <div className="relative aspect-[3/4] bg-mono-cream/60 rounded-2xl overflow-hidden mb-3">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-sm">
                      No image
                    </div>
                  )}

                  {/* Sale badge */}
                  {salePercent && (
                    <span className="absolute top-2 left-2 bg-mono-terracotta text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      -{salePercent}%
                    </span>
                  )}

                  {/* Wishlist button */}
                  <button
                    onClick={(e) => handleWishlist(e, product.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-sm"
                    aria-label="Add to wishlist"
                  >
                    <Heart className="h-3.5 w-3.5 text-mono-charcoal" />
                  </button>
                </div>

                <div className="space-y-1 px-0.5">
                  <p className="text-sm font-medium text-mono-charcoal line-clamp-2 leading-snug group-hover:text-mono-terracotta transition-colors">
                    {product.name}
                  </p>
                  {product.avgRating && Number(product.avgRating) > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-muted-foreground">{Number(product.avgRating).toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-mono-charcoal">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{product.comparePrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
