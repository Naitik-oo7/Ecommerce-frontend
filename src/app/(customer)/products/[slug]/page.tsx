'use client';

import { useParams } from 'next/navigation';
import { useGetProductBySlugQuery } from '@/services/api/productsApi';
import { useGetProductReviewsQuery } from '@/services/api/reviewsApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Heart, Star, ChevronRight, Shield, Truck, RotateCcw,
  AlertTriangle, ChevronDown, ChevronUp, Tag, Ruler,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { extractData } from '@/lib/api-utils';

import { ProductGallery } from './components/ProductGallery';
import { VariantSelector } from './components/VariantSelector';
import { ProductActions } from './components/ProductActions';
import { ReviewsSection } from './components/ReviewsSection';
import { RelatedProducts } from './components/RelatedProducts';
import { useProductActions } from './hooks/useProductActions';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  comparePrice?: string;
  stock: number;
  isActive: boolean;
  material?: string;
  gender?: string;
  media: { url: string; isPrimary?: boolean }[];
  category?: { id: number; name: string; slug?: string };
  variants: { id: number; size: string; color: string; colorHex?: string; stock: number; price: number; sku: string }[];
  avgRating?: number;
  reviewCount?: number;
  tags?: { id: number; name: string; type?: string }[];
}

const TABS = ['Description', 'Details', 'Reviews'] as const;
type Tab = typeof TABS[number];

function AccordionItem({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: React.ElementType }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-sm font-medium text-mono-charcoal hover:text-mono-terracotta transition-colors"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-mono-terracotta" />}
          {title}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-muted-foreground leading-relaxed">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<Tab>('Description');

  const { data: productResponse, isLoading, error } = useGetProductBySlugQuery(slug as string);
  const product = extractData<Product>(productResponse);

  const { data: reviewsResponse } = useGetProductReviewsQuery(
    { productId: product?.id },
    { skip: !product?.id }
  );

  interface ReviewItem { id: number; rating: number; comment: string; createdAt: string; user?: { name: string } }
  interface ReviewStatsShape { average: number; total: number; distribution: Record<number, number> }
  const reviews: ReviewItem[] = (reviewsResponse as { reviews?: ReviewItem[] })?.reviews || [];
  const reviewStats: ReviewStatsShape | undefined = (reviewsResponse as { stats?: ReviewStatsShape })?.stats;

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

  const handleVariantSelect = (variant: Product['variants'][0]) => {
    setSelectedVariant(variant);
    setQuantity(Math.min(quantity, Math.max(1, variant.stock)));
  };

  if (isLoading) {
    return (
      <div className="container-mono py-8">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-3 w-10 bg-muted rounded animate-pulse" />
          <div className="h-3 w-3 bg-muted rounded animate-pulse" />
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          <div className="h-3 w-3 bg-muted rounded animate-pulse" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="animate-pulse">
            <div className="aspect-[4/5] bg-muted rounded-2xl mb-3" />
          </div>
          <div className="animate-pulse space-y-5">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-9 bg-muted rounded w-3/4" />
            <div className="h-5 bg-muted rounded w-1/4" />
            <div className="h-10 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
            <div className="flex gap-2 mt-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-11 w-14 bg-muted rounded-xl" />)}
            </div>
            <div className="h-14 bg-muted rounded-xl" />
            <div className="h-12 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-mono py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">The product you are looking for does not exist.</p>
        <Link href="/products"><Button>Browse Products</Button></Link>
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
          <Link href="/products"><Button className="w-full">Browse Other Products</Button></Link>
        </Card>
      </div>
    );
  }

  const price = parseFloat(product.price);
  const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
  const salePercent = comparePrice && comparePrice > price
    ? Math.round((1 - price / comparePrice) * 100)
    : null;

  const reviewCount = reviews.length;

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="container-mono py-4">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <Link href="/" className="hover:text-mono-charcoal transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href="/products" className="hover:text-mono-charcoal transition-colors">Shop</Link>
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <Link
                href={`/products?categoryId=${product.category.id}`}
                className="hover:text-mono-charcoal transition-colors capitalize"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-mono-charcoal font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Main product section */}
      <section className="container-mono pb-10">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">
          {/* Left — Gallery */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <ProductGallery media={product.media} productName={product.name} />
          </motion.div>

          {/* Right — Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="space-y-5 lg:max-h-screen lg:overflow-y-auto lg:pr-1 scrollbar-hide"
          >
            {/* Category tag */}
            {product.category && (
              <p className="text-xs font-semibold tracking-widest uppercase text-mono-terracotta">
                {product.category.name}
              </p>
            )}

            {/* Title + Wishlist */}
            <div className="flex items-start gap-3">
              <h1 className="text-3xl lg:text-4xl font-bold text-mono-charcoal leading-tight flex-1">
                {product.name}
              </h1>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleWishlist}
                disabled={wishlistLoading || !isAuthenticated}
                className={`mt-1 p-3 rounded-full shrink-0 transition-all ${
                  inWishlist
                    ? 'bg-mono-rose/10 text-mono-rose border border-mono-rose/30'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-mono-rose border border-transparent'
                }`}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </motion.button>
            </div>

            {/* Rating */}
            {product.avgRating && Number(product.avgRating) > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i <= Math.round(Number(product.avgRating))
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-mono-charcoal">{Number(product.avgRating).toFixed(1)}</span>
                <button
                  onClick={() => setActiveTab('Reviews')}
                  className="text-sm text-muted-foreground hover:text-mono-terracotta transition-colors underline-offset-2 hover:underline"
                >
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-mono-charcoal">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {comparePrice && comparePrice > price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{comparePrice.toLocaleString('en-IN')}
                  </span>
                  <span className="bg-mono-terracotta text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    -{salePercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Variant Selector */}
            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onSelect={handleVariantSelect}
            />

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Actions */}
            <ProductActions
              quantity={quantity}
              setQuantity={setQuantity}
              selectedVariant={selectedVariant}
              onAddToCart={() => selectedVariant && handleAddToCart(selectedVariant.id, selectedVariant.size)}
              onBuyNow={() => selectedVariant && handleBuyNow(selectedVariant.id, selectedVariant.size)}
              cartLoading={cartLoading}
              buyNowLoading={buyNowLoading}
              addedToCart={addedToCart}
              productName={product.name}
            />

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck, label: 'Free Shipping', sub: 'On orders over ₹999' },
                { icon: Shield, label: 'Secure Payment', sub: 'SSL encrypted' },
                { icon: RotateCcw, label: 'Easy Returns', sub: '7-day return policy' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl gap-1.5">
                  <Icon className="h-5 w-5 text-mono-terracotta" />
                  <p className="text-xs font-semibold text-mono-charcoal">{label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>
                </div>
              ))}
            </div>

            {/* Shipping / Returns accordion */}
            <div className="rounded-xl border border-border/50 px-4 divide-y divide-border/30">
              <AccordionItem title="Shipping Information" icon={Truck}>
                Free standard shipping on orders over ₹999. Express delivery available at checkout.
                Usually dispatched within 1–2 business days.
              </AccordionItem>
              <AccordionItem title="Returns & Exchanges" icon={RotateCcw}>
                Easy 7-day return policy. Items must be unworn, unwashed and with original tags attached.
                Initiate a return from your Orders page.
              </AccordionItem>
              {product.material && (
                <AccordionItem title="Size & Fit" icon={Ruler}>
                  Material: {product.material}.
                  {product.gender && ` Designed for ${product.gender}.`}
                  {' '}Select your usual size — see size chart for measurements.
                </AccordionItem>
              )}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                {product.tags.map((tag) => (
                  <span key={tag.id} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Tabbed Section */}
      <section className="container-mono py-10 border-t border-border">
        {/* Tab headers */}
        <div className="flex gap-0 border-b border-border mb-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-mono-charcoal'
                  : 'text-muted-foreground hover:text-mono-charcoal'
              }`}
            >
              {tab}
              {tab === 'Reviews' && reviewCount > 0 && (
                <span className="ml-1.5 text-xs bg-mono-terracotta/10 text-mono-terracotta rounded-full px-1.5 py-0.5">
                  {reviewCount}
                </span>
              )}
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-mono-terracotta rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'Description' && (
            <motion.div
              key="description"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl"
            >
              <p className="text-mono-stone leading-relaxed text-base whitespace-pre-line">
                {product.description}
              </p>
            </motion.div>
          )}

          {activeTab === 'Details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-lg"
            >
              <dl className="space-y-3">
                {[
                  { label: 'Category', value: product.category?.name },
                  { label: 'Material', value: product.material },
                  { label: 'Gender', value: product.gender ? product.gender.charAt(0).toUpperCase() + product.gender.slice(1) : undefined },
                  { label: 'Available Sizes', value: product.variants.filter(v => v.stock > 0).map(v => v.size).filter(Boolean).join(', ') || undefined },
                  { label: 'SKU', value: selectedVariant?.sku },
                ].filter(({ value }) => Boolean(value)).map(({ label, value }) => (
                  <div key={label} className="flex gap-4 py-2.5 border-b border-border/40 last:border-0">
                    <dt className="text-sm font-medium text-mono-charcoal w-36 shrink-0">{label}</dt>
                    <dd className="text-sm text-muted-foreground capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          )}

          {activeTab === 'Reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {reviews.length > 0 ? (
                <ReviewsSection reviews={reviews} stats={reviewStats} inline />
              ) : (
                <div className="text-center py-12">
                  <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground font-medium mb-1">No reviews yet</p>
                  <p className="text-sm text-muted-foreground">Be the first to review this product</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Related Products */}
      <RelatedProducts slug={slug as string} />
    </div>
  );
}
