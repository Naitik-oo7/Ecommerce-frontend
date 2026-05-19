'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PremiumProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: string;
    comparePrice?: string;
    stock: number;
    images?: string[];
    category?: { name: string };
  };
  index?: number;
  isInWishlist?: boolean;
  isAddingToCart?: boolean;
  onAddToCart?: (e: React.MouseEvent) => void;
  onToggleWishlist?: (e: React.MouseEvent) => void;
  onQuickView?: (e: React.MouseEvent) => void;
}

export const PremiumProductCard = ({
  product,
  index = 0,
  isInWishlist = false,
  isAddingToCart = false,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
}: PremiumProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasSecondaryImage = product.images && product.images.length > 1;

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
          <div className="relative aspect-[4/5] overflow-hidden bg-[#F6F3EE]">
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
                  onLoad={() => setImageLoaded(true)}
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
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.stock === 0 && (
                <span className="px-3 py-1.5 bg-[#111111] text-white text-[10px] font-semibold tracking-wider uppercase rounded-full">
                  Sold Out
                </span>
              )}
              {product.stock > 0 && product.stock < 10 && (
                <span className="px-3 py-1.5 bg-[#B54A4A] text-white text-[10px] font-semibold tracking-wider uppercase rounded-full">
                  Low Stock
                </span>
              )}
              {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
                <span className="px-3 py-1.5 bg-[#C7A27C] text-white text-[10px] font-semibold tracking-wider uppercase rounded-full">
                  Sale
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
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#6B6B6B] mb-1.5">
                  {product.category?.name || 'Uncategorized'}
                </p>
                <h3 className="font-medium text-[15px] text-[#111111] truncate group-hover:text-[#C7A27C] transition-colors leading-tight">
                  {product.name}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-[15px] text-[#111111]">
                  ${parseFloat(product.price).toFixed(2)}
                </p>
                {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
                  <p className="text-xs text-[#6B6B6B] line-through">
                    ${parseFloat(product.comparePrice).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default PremiumProductCard;
