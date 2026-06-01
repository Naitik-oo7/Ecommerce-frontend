'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Heart, ArrowRight } from 'lucide-react';
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
    scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const handleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    await addToWishlist(productId);
  };

  if (isLoading) {
    return (
      <section className="bg-mono-cream/40 border-t border-border">
        <div className="container-mono py-14">
          <div className="h-8 w-48 bg-mono-sand/60 rounded-lg animate-pulse mb-8" />
          <div className="flex gap-5 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-[220px] shrink-0 animate-pulse">
                <div className="aspect-[3/4] bg-mono-sand/50 rounded-2xl mb-3" />
                <div className="h-4 bg-mono-sand/50 rounded w-3/4 mb-2" />
                <div className="h-4 bg-mono-sand/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products?.length) return null;

  return (
    <section className="bg-mono-cream/40 border-t border-border">
      <div className="container-mono py-14">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-mono-charcoal tracking-tight">
              Complete the look
            </h2>
            <p className="text-sm text-mono-stone mt-1">Curated picks you might love</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center hover:bg-mono-charcoal hover:text-white hover:border-mono-charcoal transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center hover:bg-mono-charcoal hover:text-white hover:border-mono-charcoal transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1"
        >
          {products.map((product, idx) => {
            const salePercent =
              product.comparePrice && product.comparePrice > product.price
                ? Math.round((1 - product.price / product.comparePrice) * 100)
                : null;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="w-[200px] sm:w-[220px] shrink-0 snap-start group"
              >
                <Link href={`/products/${product.slug}`} className="block">
                  <div className="relative aspect-[3/4] bg-white rounded-2xl overflow-hidden mb-3 ring-1 ring-border/30">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-mono-stone/40 text-sm">
                        No image
                      </div>
                    )}

                    {salePercent && (
                      <span className="absolute top-3 left-3 bg-mono-charcoal text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        −{salePercent}%
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleWishlist(e, product.id)}
                      className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-md"
                      aria-label="Add to wishlist"
                    >
                      <Heart className="h-4 w-4 text-mono-charcoal" />
                    </button>

                    <span className="absolute bottom-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
                      <ArrowRight className="h-4 w-4 text-mono-charcoal" />
                    </span>
                  </div>

                  <p className="text-sm font-medium text-mono-charcoal line-clamp-2 leading-snug group-hover:text-mono-terracotta transition-colors">
                    {product.name}
                  </p>
                  {product.avgRating && Number(product.avgRating) > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-mono-stone tabular-nums">
                        {Number(product.avgRating).toFixed(1)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-bold text-mono-charcoal tabular-nums">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="text-xs text-mono-stone line-through tabular-nums">
                        ₹{product.comparePrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
