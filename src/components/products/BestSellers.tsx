'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { CardSkeleton } from '@/components/common';
import type { Product } from '@/types';

interface BestSellersProps {
  products: Product[];
  wishlistIds: Set<number>;
  onToggleWishlist: (productId: number, e: React.MouseEvent) => void;
  isLoading?: boolean;
}

export const BestSellers = ({
  products,
  wishlistIds,
  onToggleWishlist,
  isLoading = false,
}: BestSellersProps) => {
  if (isLoading) {
    return (
      <section className="py-10 md:py-16 lg:py-24 bg-white">
        <div className="container-mono">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <CardSkeleton count={8} />
          </div>
        </div>
      </section>
    );
  }

  const displayProducts = products.slice(0, 8);

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container-mono">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 md:mb-10 lg:mb-14"
        >
          <div>
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-4 block"
              style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Shop Now
            </span>
            <h2
              className="leading-[1.05] mb-3"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 700,
                color: '#1A1A18',
              }}
            >
              Best Sellers
            </h2>
            <p
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Our most-loved pieces — trusted by thousands of customers worldwide.
            </p>
          </div>

          <Link href="/products">
            <motion.span
              className="inline-flex items-center gap-2 font-medium transition-colors cursor-pointer group hover:opacity-70"
              style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)', letterSpacing: '0.04em' }}
              whileHover={{ x: 5 }}
            >
              View All Products
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </motion.span>
          </Link>
        </motion.div>

        {/* Products Grid */}
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                isInWishlist={wishlistIds.has(product.id)}
                onToggleWishlist={(e) => onToggleWishlist(product.id, e)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
              No products available
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default BestSellers;
