'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { CardSkeleton } from '@/components/common';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  comparePrice?: string;
  stock: number;
  images?: string[];
  category?: { name: string };
}

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
      <section className="py-20 md:py-32 bg-white">
        <div className="container-mono">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <CardSkeleton count={8} />
          </div>
        </div>
      </section>
    );
  }

  // Show only first 8 products for best sellers
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
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16"
        >
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-4 block">
              Shop Now
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-[#111111] leading-[1.1]">
              Best Sellers
            </h2>
          </div>
          
          <Link href="/products">
            <motion.span 
              className="inline-flex items-center gap-2 text-[#111111] font-medium hover:text-[#C7A27C] transition-colors cursor-pointer group"
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
            <p className="text-[#6B6B6B]">No products available</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default BestSellers;
