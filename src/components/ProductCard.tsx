'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { staggerItem } from '@/lib/animations';

interface ProductCardProps {
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
  showQuickAdd?: boolean;
}

export function ProductCard({
  product,
  index = 0,
  isInWishlist = false,
  isAddingToCart = false,
  onAddToCart,
  onToggleWishlist,
  showQuickAdd = true,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <Link href={`/products/${product.slug}`} className="block h-96">
        <motion.div
          whileHover={{ y: -8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 h-full flex flex-col"
        >
          <div className="relative h-56 overflow-hidden bg-muted shrink-0">
            {product.images?.[0] ? (
              <motion.img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                initial={{ scale: 1 }}
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No image</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.stock === 0 && (
                <span className="px-2 py-1 bg-mono-charcoal text-white text-[10px] font-semibold tracking-wide uppercase rounded">
                  Sold Out
                </span>
              )}
              {product.stock > 0 && product.stock < 10 && (
                <span className="px-2 py-1 bg-mono-rose/90 text-white text-[10px] font-semibold tracking-wide uppercase rounded">
                  Low Stock
                </span>
              )}
              {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
                <span className="px-2 py-1 bg-mono-terracotta text-white text-[10px] font-semibold tracking-wide uppercase rounded">
                  Sale
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            {onToggleWishlist && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                transition={{ duration: 0.2 }}
                onClick={onToggleWishlist}
                className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isInWishlist
                    ? 'bg-mono-rose text-white'
                    : 'bg-white/90 hover:bg-white text-mono-charcoal'
                }`}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </motion.button>
            )}

            {/* Quick Add Button */}
            {showQuickAdd && onAddToCart && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-0 left-0 right-0 p-3"
              >
                <Button
                  onClick={onAddToCart}
                  disabled={product.stock === 0 || isAddingToCart}
                  className="w-full bg-mono-charcoal hover:bg-mono-charcoal/90 text-white shadow-lg"
                  size="sm"
                >
                  {isAddingToCart ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
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

          <div className="p-4 flex-1 flex flex-col justify-between min-h-0">
            <div className="flex items-start justify-between gap-2 min-h-0">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-foreground truncate group-hover:text-mono-terracotta transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {product.category?.name || 'Uncategorized'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm text-mono-charcoal">
                  ${parseFloat(product.price).toFixed(2)}
                </p>
                {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
                  <p className="text-xs text-muted-foreground line-through">
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
}
