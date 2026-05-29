'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  index?: number;
  isInWishlist?: boolean;
  isAddingToCart?: boolean;
  onAddToCart?: (e: React.MouseEvent) => void;
  onToggleWishlist?: (e: React.MouseEvent) => void;
  onQuickView?: (e: React.MouseEvent) => void;
}

export const ProductCard = ({
  product,
  index = 0,
  isInWishlist = false,
  isAddingToCart = false,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const hasSecondaryImage = product.images && product.images.length > 1;

  const salePercent = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1] as const 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <Link href={`/products/${product.slug}`} className="block">
        <motion.div
          whileHover={{ y: -8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
          className="relative bg-white rounded-2xl overflow-hidden border border-[#E5E2DD] shadow-sm hover:shadow-xl transition-shadow duration-500"
        >
          {/* Image Container */}
          <div className="relative aspect-[3/4] overflow-hidden bg-[#F6F3EE]">
            {/* Primary Image */}
            {product.images?.[0] ? (
              <>
                <motion.img
                  src={product.images[0]}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ scale: 1 }}
                  animate={{ scale: isHovered ? 1.08 : 1 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
                />
                
                {/* Secondary Image Crossfade */}
                <AnimatePresence>
                  {isHovered && hasSecondaryImage && (
                    <motion.img
                      src={product.images[1]}
                      alt={`${product.name} - alternate view`}
                      className="absolute inset-0 w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#6B6B6B]">
                <span className="text-sm">No image</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.stock === 0 && (
                <span className="px-2.5 py-1 bg-[#111111]/80 backdrop-blur-sm text-white text-[9px] font-semibold tracking-wider uppercase rounded-full">
                  Sold Out
                </span>
              )}
              {product.stock > 0 && product.stock < 10 && (
                <span className="px-2.5 py-1 bg-[#B54A4A]/90 backdrop-blur-sm text-white text-[9px] font-semibold tracking-wider uppercase rounded-full">
                  Low Stock
                </span>
              )}
              {salePercent && (
                <span className="px-2.5 py-1 bg-[#C7A27C]/90 backdrop-blur-sm text-white text-[9px] font-semibold tracking-wider rounded-full">
                  -{salePercent}%
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            {onToggleWishlist && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0, 
                  scale: isHovered ? 1 : 0.8 
                }}
                transition={{ duration: 0.2 }}
                onClick={onToggleWishlist}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isInWishlist
                    ? 'bg-[#B54A4A] text-white'
                    : 'bg-white/90 backdrop-blur-sm text-[#111111] hover:bg-white'
                }`}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </motion.button>
            )}

            {/* Quick View Button */}
            {onQuickView && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0, 
                  y: isHovered ? 0 : -10 
                }}
                transition={{ duration: 0.2, delay: 0.05 }}
                onClick={onQuickView}
                className="absolute top-4 right-16 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-[#111111] hover:bg-white flex items-center justify-center transition-all duration-200"
              >
                <Eye className="h-4 w-4" />
              </motion.button>
            )}

            {/* Add to Cart - Slides Up */}
            {onAddToCart && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0, 
                  y: isHovered ? 0 : 20 
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                className="absolute bottom-0 left-0 right-0 p-4"
              >
                <Button
                  onClick={onAddToCart}
                  disabled={product.stock === 0 || isAddingToCart}
                  className="w-full bg-[#111111] hover:bg-[#1a1a1a] text-white shadow-lg rounded-full h-12 font-medium"
                >
                  {isAddingToCart ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Product Info */}
          <div className="px-4 py-3.5">
            {/* Category */}
            <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[#9B9B9B] mb-1">
              {product.category?.name || 'Uncategorized'}
            </p>
            {/* Name */}
            <h3 className="font-semibold text-[14px] text-[#111111] truncate group-hover:text-[#C7A27C] transition-colors leading-snug mb-2">
              {product.name}
            </h3>
            {/* Price row */}
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[15px] text-[#111111]">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-xs text-[#9B9B9B] line-through">
                  ₹{product.comparePrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {/* Rating */}
            {product.avgRating !== undefined && Number(product.avgRating) > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                <div className="flex">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} className={`w-2.5 h-2.5 ${
                      s <= Math.round(Number(product.avgRating)) ? 'text-[#C7A27C]' : 'text-[#E5E2DD]'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {product.reviewCount !== undefined && (
                  <span className="text-[9px] text-[#9B9B9B]">({product.reviewCount})</span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
