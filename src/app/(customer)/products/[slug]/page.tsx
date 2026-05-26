'use client';

import { useParams } from 'next/navigation';
import { useGetProductBySlugQuery } from '@/services/api/productsApi';
import { useGetProductReviewsQuery } from '@/services/api/reviewsApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, Star, ArrowLeft, Shield, Truck, Package, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { extractData } from '@/lib/api-utils';

import { ProductGallery } from './components/ProductGallery';
import { VariantSelector } from './components/VariantSelector';
import { ProductActions } from './components/ProductActions';
import { ReviewsSection } from './components/ReviewsSection';
import { useProductActions } from './hooks/useProductActions';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  comparePrice?: string;
  stock: number;
  isActive: boolean;
  media: { url: string; isPrimary?: boolean }[];
  category?: { id: number; name: string };
  variants: { id: number; size: string; color: string; colorHex?: string; stock: number; price: number; sku: string }[];
  avgRating?: number;
  reviewCount?: number;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const { data: productResponse, isLoading, error } = useGetProductBySlugQuery(slug as string);
  const product = extractData<Product>(productResponse);

  const { data: reviewsResponse } = useGetProductReviewsQuery(
    { productId: product?.id },
    { skip: !product?.id }
  );

  const reviews = (reviewsResponse as { reviews?: unknown[] })?.reviews || [];
  const reviewStats = (reviewsResponse as { stats?: unknown })?.stats;

  const [selectedVariant, setSelectedVariant] = useState<Product['variants'][0] | null>(null);
  const initializedRef = useRef(false);

  const {
    quantity,
    setQuantity,
    cartLoading,
    buyNowLoading,
    wishlistLoading,
    inWishlist,
    toggleWishlist,
    addedToCart,
    handleAddToCart,
    handleBuyNow,
  } = useProductActions({ productId: product?.id || 0, slug: slug as string });

  useEffect(() => {
    if (product?.variants?.length > 0 && !initializedRef.current) {
      setSelectedVariant(product.variants[0]);
      initializedRef.current = true;
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="container-mono py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-96 bg-muted rounded-2xl" />
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-mono py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">The product you are looking for does not exist.</p>
        <Link href="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  if (!product.isActive) {
    return (
      <div className="container-mono py-16">
        <Card className="max-w-md mx-auto text-center p-8">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
          <h1 className="text-2xl font-bold mb-4">Product Unavailable</h1>
          <p className="text-muted-foreground mb-8">This product is currently not available for purchase.</p>
          <Link href="/products">
            <Button className="w-full">Browse Other Products</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const salePercent = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price)
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.comparePrice)) * 100)
    : null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="min-h-screen"
    >
      <div className="container-mono py-4">
        <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>

      <section className="container-mono py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div variants={staggerItem}>
            <ProductGallery media={product.media} productName={product.name} />
          </motion.div>

          <motion.div variants={staggerItem} className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-mono-charcoal mb-2">{product.name}</h1>
                <p className="text-muted-foreground">{product.category?.name}</p>
              </div>
              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading || !isAuthenticated}
                className={`p-3 rounded-full transition-all ${
                  inWishlist ? 'bg-mono-rose text-white' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            {product.avgRating && Number(product.avgRating) > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i <= Math.round(Number(product.avgRating))
                          ? 'text-mono-terracotta fill-mono-terracotta'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {Number(product.avgRating).toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-mono-charcoal">
                ₹{parseFloat(product.price).toLocaleString('en-IN')}
              </span>
              {salePercent && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ₹{parseFloat(product.comparePrice!).toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm bg-mono-terracotta/10 text-mono-terracotta px-2 py-1 rounded">
                    Save {salePercent}%
                  </span>
                </>
              )}
            </div>

            <p className="text-mono-stone leading-relaxed">{product.description}</p>

            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onSelect={setSelectedVariant}
            />

            <ProductActions
              quantity={quantity}
              setQuantity={setQuantity}
              selectedVariant={selectedVariant}
              onAddToCart={() => selectedVariant && handleAddToCart(selectedVariant.id, selectedVariant.size)}
              onBuyNow={() => selectedVariant && handleBuyNow(selectedVariant.id, selectedVariant.size)}
              cartLoading={cartLoading}
              buyNowLoading={buyNowLoading}
              addedToCart={addedToCart}
            />

            <div className="grid grid-cols-3 gap-4 py-4 border-t border-border">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-mono-terracotta" />
                <p className="text-xs text-muted-foreground">Free Shipping over ₹50</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-mono-terracotta" />
                <p className="text-xs text-muted-foreground">Secure Payment</p>
              </div>
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-mono-terracotta" />
                <p className="text-xs text-muted-foreground">Easy Returns</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <ReviewsSection reviews={reviews} stats={reviewStats} />
    </motion.div>
  );
}
