'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Sparkles, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { useGetProductsQuery } from '@/services/api/productsApi';
import { useWishlist } from '@/hooks/useWishlist';
import { extractPaginatedData } from '@/lib/api-utils';
import type { Product } from '@/types';

const TERRA = '#C8703A';
const SAGE = '#4A7C59';

const QUICK_LINKS = [
  { label: 'New Arrivals', href: '/products?isNewArrival=true' },
  { label: 'Bestsellers', href: '/products?isBestseller=true' },
  { label: 'Top Rated', href: '/products?sortBy=avgRating&sortOrder=desc' },
  { label: 'Sustainable Edit', href: '/products?isSustainable=true' },
];

/**
 * Empty cart state — shared by guest and authenticated views.
 * Goes beyond a generic placeholder: surfaces quick entry points back into
 * the catalog and a small "you might like" grid so the empty bag still
 * feels like a starting point rather than a dead end.
 */
export function EmptyCart() {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { data, isLoading } = useGetProductsQuery({
    limit: 4,
    sortBy: 'avgRating',
    sortOrder: 'desc',
  });
  const { data: products } = extractPaginatedData<Product>(data);

  return (
    <div className="container-mono py-16 md:py-20">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border/40 px-6 py-14 sm:py-20 text-center"
        style={{
          background: `linear-gradient(135deg, ${TERRA}08 0%, transparent 60%)`,
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${TERRA}12` }}
        >
          <ShoppingBag className="h-9 w-9" style={{ color: TERRA }} />
        </motion.div>

        <span className="label-caps mb-2 block text-xs tracking-wider" style={{ color: TERRA }}>
          Shopping Experience
        </span>
        <h1 className="font-playfair text-3xl md:text-5xl text-mono-charcoal leading-tight mb-3">
          Your bag is empty
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
          Looks like you haven&apos;t added anything yet. Explore our curated collection
          and find pieces that speak to your style.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link href="/products">
            <Button
              size="lg"
              className="group h-12 px-8 rounded-2xl bg-mono-charcoal hover:bg-mono-charcoal/90 text-sm font-medium"
            >
              Browse Collection
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/wishlist">
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 rounded-2xl text-sm font-medium border-border/60"
            >
              View Wishlist
            </Button>
          </Link>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/70 px-4 py-2 text-xs font-medium text-mono-charcoal hover:border-mono-terracotta/60 hover:bg-mono-terracotta/5 transition-colors"
            >
              <Sparkles className="h-3 w-3" style={{ color: TERRA }} />
              {link.label}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-3 gap-3 mt-8 max-w-xl mx-auto"
      >
        {[
          { icon: ShieldCheck, label: 'Secure Checkout' },
          { icon: Truck, label: 'Fast Shipping' },
          { icon: RotateCcw, label: 'Easy Returns' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="rounded-2xl border border-border/40 bg-card/50 p-4 flex flex-col items-center text-center gap-2.5 backdrop-blur-sm"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${SAGE}15` }}
            >
              <Icon className="h-4 w-4" style={{ color: SAGE }} />
            </div>
            <span className="text-[10px] leading-tight text-muted-foreground font-medium">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* You might like */}
      {(isLoading || products.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-16 md:mt-20"
        >
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="label-caps mb-1.5 block text-xs tracking-wider" style={{ color: TERRA }}>
                Recommended for you
              </span>
              <h2 className="font-playfair text-2xl md:text-3xl text-mono-charcoal">You might like</h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-mono-charcoal transition-colors"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:gap-x-4 md:gap-y-6 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-border/40 bg-card">
                    <div className="aspect-[3/4] skeleton-shimmer" />
                    <div className="space-y-2 px-4 py-3.5">
                      <div className="h-2.5 w-1/3 rounded bg-muted skeleton-shimmer" />
                      <div className="h-3.5 w-3/4 rounded bg-muted skeleton-shimmer" />
                      <div className="h-3.5 w-1/2 rounded bg-muted skeleton-shimmer" />
                    </div>
                  </div>
                ))
              : products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    isInWishlist={wishlistIds.has(product.id)}
                    onToggleWishlist={(e) => toggleWishlist(product.id, e)}
                  />
                ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
