'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetProductBySlugQuery } from '@/services/api/productsApi';
import { useAddToCartMutation } from '@/services/api/cartApi';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '@/services/api/wishlistApi';
import { useGetProductReviewsQuery } from '@/services/api/reviewsApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Heart, Star, Minus, Plus, ArrowLeft, Package, Shield, Truck, Check, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fadeInUp, 
  fadeInScale, 
  staggerContainer, 
  staggerItem,
  hoverImageZoom,
  pageTransition 
} from '@/lib/animations';

// ============================================
// MONO Product Detail Page - Premium Fashion Experience
// ============================================

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const { data: productResponse, isLoading, error } = useGetProductBySlugQuery(slug as string);
  const product = (productResponse as any)?.data || productResponse;

  const primaryImageIndex = useMemo(() => {
    if (!product?.media?.length) return 0;
    const idx = (product.media as { isPrimary?: boolean }[]).findIndex((m) => m.isPrimary);
    return idx >= 0 ? idx : 0;
  // product.id is the stable key — recompute only when the product itself changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const [quantity, setQuantity] = useState(1);
  const [userSelectedImage, setUserSelectedImage] = useState<number | null>(null);
  const selectedImage = userSelectedImage ?? primaryImageIndex;
  const setSelectedImage = (idx: number) => setUserSelectedImage(idx);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);

  // Set default variant when product loads
  if (product?.variants?.length > 0 && !selectedVariant) {
    setSelectedVariant(product.variants[0]);
  }

  const { data: reviewsResponse } = useGetProductReviewsQuery(
    { productId: product?.id },
    { skip: !product?.id }
  );

  const [addToCart] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const reviews = (reviewsResponse as any)?.reviews || [];
  const reviewStats = (reviewsResponse as any)?.stats;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!selectedVariant) {
      return; // Should show error toast
    }
    setCartLoading(true);
    try {
      await addToCart({ 
        variantId: selectedVariant.id, 
        size: selectedVariant.size,
        quantity 
      }).unwrap();
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    } catch {}
    setCartLoading(false);
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(product.id).unwrap();
        setInWishlist(false);
      } else {
        await addToWishlist(product.id).unwrap();
        setInWishlist(true);
      }
    } catch {}
    setWishlistLoading(false);
  };

  if (isLoading) {
    return (
      <div className="container-mono py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid lg:grid-cols-2 gap-10"
        >
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-2xl skeleton-shimmer" />
            <div className="flex gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-24 h-24 bg-muted rounded-xl skeleton-shimmer" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded-lg w-2/3 skeleton-shimmer" />
            <div className="h-6 bg-muted rounded-lg w-1/3 skeleton-shimmer" />
            <div className="h-4 bg-muted rounded w-full skeleton-shimmer" />
            <div className="h-4 bg-muted rounded w-4/5 skeleton-shimmer" />
            <div className="h-4 bg-muted rounded w-3/4 skeleton-shimmer" />
            <div className="h-12 bg-muted rounded-lg w-1/2 skeleton-shimmer mt-4" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !product || !product.isActive) {
    return (
      <div className="container-mono py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Package className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
          <h2 className="text-editorial text-3xl text-mono-charcoal mb-3">Product not found</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            This product may have been removed or is temporarily unavailable.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-mono-charcoal">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Collection
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const avgRating = parseFloat(reviewStats?.avgRating || product.avgRating || '0');

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen"
    >
      {/* Breadcrumb & Back */}
      <div className="container-mono py-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="link-underline">Back to Collection</span>
          </Link>
        </motion.div>
      </div>

      {/* Main Product Section */}
      <section className="container-mono pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* Main Image */}
            <motion.div
              onMouseEnter={() => setIsImageHovered(true)}
              onMouseLeave={() => setIsImageHovered(false)}
              className="relative aspect-square bg-muted rounded-2xl overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {product.media?.[selectedImage] ? (
                  <motion.img
                    key={selectedImage}
                    src={product.media[selectedImage].url}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ 
                      opacity: 1, 
                      scale: isImageHovered ? 1.05 : 1,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-32 w-32 text-muted-foreground/30" />
                  </div>
                )}
              </AnimatePresence>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {/* Check total stock across all variants */}
                {(() => {
                  const totalStock = product.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
                  return totalStock === 0 ? (
                    <span className="px-3 py-1.5 bg-mono-charcoal text-white text-xs font-semibold tracking-wide uppercase rounded-lg">
                      Sold Out
                    </span>
                  ) : totalStock < 10 ? (
                    <span className="px-3 py-1.5 bg-mono-rose/90 text-white text-xs font-semibold tracking-wide uppercase rounded-lg">
                      Only {totalStock} Left
                    </span>
                  ) : null;
                })()}
                {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
                  <span className="px-3 py-1.5 bg-mono-terracotta text-white text-xs font-semibold tracking-wide uppercase rounded-lg">
                    Sale
                  </span>
                )}
              </div>

              {/* Wishlist Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  inWishlist
                    ? 'bg-mono-rose text-white'
                    : 'bg-white/90 hover:bg-white text-mono-charcoal shadow-lg'
                }`}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </motion.button>
            </motion.div>

            {/* Thumbnail Images */}
            {product.media?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.media.map((mediaItem: any, index: number) => (
                  <motion.button
                    key={mediaItem.id || index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-mono-charcoal'
                        : 'border-transparent hover:border-mono-charcoal/30'
                    }`}
                  >
                    <img
                      src={mediaItem.url}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Title & Rating */}
            <div>
              <h1 className="text-editorial text-3xl md:text-4xl text-mono-charcoal mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(avgRating)
                          ? 'text-mono-terracotta fill-mono-terracotta'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {avgRating > 0 ? avgRating.toFixed(1) : 'No reviews'}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-mono-charcoal">
                ${parseFloat(product.price).toFixed(2)}
              </span>
              {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
                <span className="text-xl text-muted-foreground line-through">
                  ${parseFloat(product.comparePrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-mono-stone leading-relaxed">
              {product.description}
            </p>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-border">
              <div className="text-center">
                <Truck className="h-5 w-5 mx-auto mb-2 text-mono-terracotta" />
                <p className="text-xs text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="h-5 w-5 mx-auto mb-2 text-mono-terracotta" />
                <p className="text-xs text-muted-foreground">Quality Guarantee</p>
              </div>
              <div className="text-center">
                <Check className="h-5 w-5 mx-auto mb-2 text-mono-terracotta" />
                <p className="text-xs text-muted-foreground">In Stock</p>
              </div>
            </div>

            {/* Size Selector */}
            {product.variants?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Size:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedVariant ? `${selectedVariant.stock} in stock` : 'Select a size'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.stock === 0}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedVariant?.id === variant.id
                          ? 'bg-mono-charcoal text-white'
                          : variant.stock === 0
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-white border border-input hover:border-mono-charcoal'
                      }`}
                    >
                      {variant.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border border-input rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-muted transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant?.stock || 0, quantity + 1))}
                    className="px-3 py-2 hover:bg-muted transition-colors"
                    disabled={quantity >= (selectedVariant?.stock || 0)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock === 0 || cartLoading}
                  className="flex-1 bg-mono-charcoal hover:bg-mono-charcoal/90 text-white h-14 text-lg"
                >
                  {cartLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : addedToCart ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Category */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Category:{' '}
                <Link
                  href={`/?category=${product.category?.id}`}
                  className="text-mono-terracotta hover:underline"
                >
                  {product.category?.name || 'Uncategorized'}
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="container-mono py-16 border-t border-border">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-editorial text-2xl text-mono-charcoal mb-8">
              Customer Reviews
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map((review: any) => (
                <Card key={review.id} className="bg-mono-cream/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'text-mono-terracotta fill-mono-terracotta'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-mono-stone mb-4">{review.comment}</p>
                    <p className="text-sm text-muted-foreground">
                      {review.user?.name || 'Anonymous'} -{' '}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </section>
      )}
    </motion.div>
  );
}
