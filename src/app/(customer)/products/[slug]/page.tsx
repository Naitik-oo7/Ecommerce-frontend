'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetProductBySlugQuery } from '@/services/api/productsApi';
import { useGetProductReviewsQuery, useGetUserReviewsQuery } from '@/services/api/reviewsApi';
import { useGetOrdersQuery } from '@/services/api/ordersApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Heart,
  Star,
  ChevronRight,
  Shield,
  Truck,
  RotateCcw,
  AlertTriangle,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

import { ProductGallery } from './components/ProductGallery';
import { VariantSelector } from './components/VariantSelector';
import { ProductActions } from './components/ProductActions';
import { ReviewsSection } from './components/ReviewsSection';
import { RelatedProducts } from './components/RelatedProducts';
import { AccordionSection } from './components/ProductAccordion';
import { useProductActions } from './hooks/useProductActions';
import { WriteReviewModal } from '@/components/WriteReviewModal';
import type { Product, ProductVariant } from '@/types';

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container-mono py-6">
        <div className="h-3 w-64 bg-mono-sand/60 rounded animate-pulse mb-8" />
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
          <div className="flex gap-2">
            <div className="hidden lg:flex flex-col gap-2 w-[76px]">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[95px] bg-mono-sand/40 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="flex-1 h-[min(42vh,360px)] bg-mono-sand/40 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-5 animate-pulse max-w-md">
            <div className="h-4 w-20 bg-mono-sand/60 rounded" />
            <div className="h-8 w-full bg-mono-sand/60 rounded" />
            <div className="h-6 w-28 bg-mono-sand/60 rounded" />
            <div className="h-10 w-36 bg-mono-sand/60 rounded" />
            <div className="h-32 bg-mono-sand/40 rounded-xl" />
            <div className="h-12 bg-mono-sand/60 rounded-lg" />
            <div className="h-11 bg-mono-sand/40 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Navigate back to the products listing, restoring all filters via browser history.
  // Falls back to the category URL if there's no history to go back to (e.g. direct link).
  const handleBackToShop = useCallback(
    (fallbackHref: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackHref);
      }
    },
    [router],
  );
  const [descExpanded, setDescExpanded] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const { data: product, isLoading, error } = useGetProductBySlugQuery(slug as string);

  const { data: reviewsResponse, refetch: refetchReviews } = useGetProductReviewsQuery(
    { productId: product?.id ?? 0 },
    { skip: !product?.id }
  );

  const { data: userOrdersData } = useGetOrdersQuery(
    { status: 'delivered', limit: 50 },
    { skip: !isAuthenticated }
  );

  const { data: userReviewsData } = useGetUserReviewsQuery({}, { skip: !isAuthenticated });

  const [showWriteReview, setShowWriteReview] = useState(false);

  interface ReviewItem {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    user?: { name: string };
    images?: string[];
  }
  interface ReviewStatsShape {
    average: number;
    total: number;
    distribution: Record<number, number>;
  }
  const reviews: ReviewItem[] = (reviewsResponse as { reviews?: ReviewItem[] })?.reviews || [];
  const reviewStats: ReviewStatsShape | undefined = (reviewsResponse as { stats?: ReviewStatsShape })
    ?.stats;

  // Compute delivered orders containing this product
  interface OrderItemShape { variant?: { productId?: number; product?: { id?: number } }; productId?: number; }
  interface OrderShape { id: number; createdAt?: string; items?: OrderItemShape[]; orderItems?: OrderItemShape[]; }
  const deliveredOrdersForProduct: { id: number; label: string }[] = isAuthenticated
    ? ((userOrdersData as { data?: OrderShape[] } | undefined)?.data || [])
        .filter((o) => {
          const items: OrderItemShape[] = o.items || o.orderItems || [];
          return items.some((item) =>
            (item.productId === product?.id) ||
            (item.variant?.productId === product?.id) ||
            (item.variant?.product?.id === product?.id)
          );
        })
        .map((o) => ({
          id: o.id,
          label: `Order #${o.id}${o.createdAt ? ` · ${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`,
        }))
    : [];

  // Check if user already reviewed this product
  interface UserReviewShape { productId?: number; }
  const alreadyReviewed = isAuthenticated
    ? ((userReviewsData as { data?: UserReviewShape[] } | undefined)?.data || []).some(
        (r) => r.productId === product?.id
      )
    : false;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
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
    if ((product?.variants?.length ?? 0) > 0 && !initializedRef.current) {
      const firstInStock = product?.variants.find((v) => v.stock > 0) ?? product?.variants[0];
      setSelectedVariant(firstInStock ?? null);
      initializedRef.current = true;
    }
  }, [product]);

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setQuantity(Math.min(quantity, Math.max(1, variant.stock)));
  };

  const scrollToReviews = () => {
    setReviewsOpen(true);
    setTimeout(() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url });
      } catch {
        /* cancelled */
      }
    } else if (url) {
      await navigator.clipboard.writeText(url);
    }
  };

  if (isLoading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="container-mono py-24 text-center">
        <h1 className="text-2xl font-bold text-mono-charcoal mb-3">Product not found</h1>
        <p className="text-mono-stone mb-8">This product may have been removed.</p>
        <Link href="/products">
          <Button className="rounded-lg px-8">Continue shopping</Button>
        </Link>
      </div>
    );
  }

  if (!product.isActive) {
    return (
      <div className="container-mono py-24">
        <Card className="max-w-md mx-auto text-center p-10 rounded-2xl">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h1 className="text-xl font-bold mb-3">Unavailable</h1>
          <p className="text-mono-stone mb-6 text-sm">This product is not for sale right now.</p>
          <Link href="/products">
            <Button className="w-full rounded-lg">Browse shop</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const price = product.price;
  const comparePrice = product.comparePrice ?? null;
  const salePercent =
    comparePrice && comparePrice > price ? Math.round((1 - price / comparePrice) * 100) : null;
  const reviewCount = product.reviewCount ?? reviews.length;
  const hasLongDesc = product.description.length > 200;
  const shortDesc = hasLongDesc
    ? `${product.description.slice(0, 200).trim()}…`
    : product.description;

  const detailRows = [
    { label: 'Category', value: product.category?.name },
    { label: 'Material', value: product.material },
    {
      label: 'Gender',
      value: product.gender
        ? product.gender.charAt(0).toUpperCase() + product.gender.slice(1)
        : undefined,
    },
    {
      label: 'Sizes',
      value:
        [...new Set(product.variants.filter((v) => v.stock > 0).map((v) => v.size))]
          .filter(Boolean)
          .join(', ') || undefined,
    },
    { label: 'SKU', value: selectedVariant?.sku },
  ].filter(({ value }) => Boolean(value));

  return (
    <div className="min-h-screen bg-background pb-8 lg:pb-16">
      <div className="container-mono">
        {/* Breadcrumb */}
        <nav
          className="hidden sm:flex items-center gap-1.5 py-5 text-xs text-mono-stone"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-mono-charcoal transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 opacity-40" />
          {/* Use router.back() so filters set on the listing page are restored */}
          <a
            href="/products"
            onClick={handleBackToShop("/products")}
            className="hover:text-mono-charcoal transition-colors cursor-pointer"
          >
            Shop
          </a>
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3 opacity-40" />
              <a
                href={`/products?categoryId=${product.category.id}`}
                onClick={handleBackToShop(`/products?categoryId=${product.category.id}`)}
                className="hover:text-mono-charcoal capitalize cursor-pointer"
              >
                {product.category.name}
              </a>
            </>
          )}
          <ChevronRight className="h-3 w-3 opacity-40" />
          <span className="text-mono-charcoal truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* PDP hero — standard 50/50 */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 xl:gap-16 items-start">
          <ProductGallery
            media={product.media}
            imageUrls={product.images}
            productName={product.name}
            salePercent={salePercent}
          />

          <div className="space-y-5 lg:pl-2">
            {product.category && (
              <Link
                href={`/products?categoryId=${product.category.id}`}
                className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mono-terracotta hover:underline"
              >
                {product.category.name}
              </Link>
            )}

            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl sm:text-[1.75rem] font-bold text-mono-charcoal leading-tight tracking-tight pr-2">
                {product.name}
              </h1>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2 rounded-lg border border-border hover:bg-mono-sand/30 transition-colors"
                  aria-label="Share"
                >
                  <Share2 className="h-4 w-4 text-mono-stone" />
                </button>
                <button
                  type="button"
                  onClick={toggleWishlist}
                  disabled={wishlistLoading || !isAuthenticated}
                  className={`p-2 rounded-lg border transition-colors ${
                    inWishlist
                      ? 'border-mono-rose/40 bg-mono-rose/10 text-mono-rose'
                      : 'border-border hover:bg-mono-sand/30 text-mono-stone'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Rating — directly under title (best practice) */}
            <div className="flex items-center gap-2 -mt-1">
              {product.avgRating && Number(product.avgRating) > 0 ? (
                <>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i <= Math.round(Number(product.avgRating))
                            ? 'fill-mono-terracotta text-mono-terracotta'
                            : 'fill-mono-sand text-mono-sand'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {Number(product.avgRating).toFixed(1)}
                  </span>
                  <button
                    type="button"
                    onClick={scrollToReviews}
                    className="text-sm text-mono-stone hover:text-mono-terracotta underline-offset-2 hover:underline"
                  >
                    ({reviewCount} reviews)
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={scrollToReviews}
                  className="text-sm text-mono-stone hover:text-mono-terracotta"
                >
                  Write a review
                </button>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 pt-1">
              <span className="text-2xl sm:text-[1.65rem] font-bold text-mono-charcoal tabular-nums">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {comparePrice && comparePrice > price && (
                <>
                  <span className="text-base text-mono-stone line-through tabular-nums">
                    ₹{comparePrice.toLocaleString('en-IN')}
                  </span>
                  {salePercent && (
                    <span className="text-xs font-semibold text-mono-terracotta">
                      Save {salePercent}%
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Short description + read more */}
            <div className="text-sm text-mono-stone leading-relaxed">
              <p className="whitespace-pre-line">{descExpanded ? product.description : shortDesc}</p>
              {hasLongDesc && (
                <button
                  type="button"
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-1 text-sm font-medium text-mono-charcoal underline underline-offset-2 hover:text-mono-terracotta"
                >
                  {descExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            <div className="h-px bg-border/60" />

            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onSelect={handleVariantSelect}
            />

            <ProductActions
              quantity={quantity}
              setQuantity={setQuantity}
              selectedVariant={selectedVariant}
              onAddToCart={() =>
                selectedVariant &&
                handleAddToCart(selectedVariant.id, selectedVariant.size, {
                  productName: product.name,
                  productSlug: product.slug,
                  price: Number(selectedVariant.price ?? product.price),
                  comparePrice: product.comparePrice != null ? Number(product.comparePrice) : null,
                  imageUrl:
                    product.media?.find((m) => m.isPrimary)?.url ??
                    product.media?.[0]?.url ??
                    null,
                  category: product.category?.name,
                })
              }
              onBuyNow={() =>
                selectedVariant && handleBuyNow(selectedVariant.id, selectedVariant.size)
              }
              cartLoading={cartLoading}
              buyNowLoading={buyNowLoading}
              addedToCart={addedToCart}
              price={price}
              comparePrice={comparePrice}
            />

            {/* Trust — compact row near CTA */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              {[
                { icon: Truck, label: 'Free ship ₹999+' },
                { icon: Shield, label: 'Secure pay' },
                { icon: RotateCcw, label: '7-day returns' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 py-2">
                  <Icon className="h-4 w-4 text-mono-terracotta" />
                  <span className="text-[10px] sm:text-[11px] text-mono-stone leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Accordions — moved to right column */}
            <div className="mt-8 pt-6 border-t border-border/60 space-y-0">
              <AccordionSection id="pdp-description" title="Description" defaultOpen>
                <p className="text-mono-stone leading-relaxed whitespace-pre-line text-[15px]">
                  {product.description}
                </p>
              </AccordionSection>

              <AccordionSection id="pdp-details" title="Details">
                <dl className="space-y-0 rounded-xl border border-border/50 overflow-hidden">
                  {detailRows.map(({ label, value }, i) => (
                    <div
                      key={label}
                      className={`flex gap-4 px-4 py-3.5 text-sm ${
                        i % 2 === 0 ? 'bg-mono-cream/30' : 'bg-white'
                      }`}
                    >
                      <dt className="font-medium text-mono-charcoal w-28 shrink-0">{label}</dt>
                      <dd className="text-mono-stone capitalize">{value}</dd>
                    </div>
                  ))}
                </dl>
              </AccordionSection>

              <AccordionSection id="pdp-shipping" title="Shipping & returns">
                <ul className="space-y-4 text-sm text-mono-stone leading-relaxed">
                  <li>
                    <strong className="text-mono-charcoal font-medium">Shipping — </strong>
                    Free on orders over ₹999. Dispatched in 1–2 business days.
                  </li>
                  <li>
                    <strong className="text-mono-charcoal font-medium">Returns — </strong>
                    7-day returns on unworn items with tags. Start from your orders page.
                  </li>
                  {(product.material || product.gender) && (
                    <li id="pdp-size-fit">
                      <strong className="text-mono-charcoal font-medium">Fit — </strong>
                      {product.material && <>Material: {product.material}. </>}
                      {product.gender && <>Designed for {product.gender}. </>}
                      Choose your usual size.
                    </li>
                  )}
                </ul>
              </AccordionSection>

              <div id="pdp-reviews" ref={reviewsRef}>
                <AccordionSection
                  id="pdp-reviews-panel"
                  title={`Reviews${reviewCount > 0 ? ` (${reviewCount})` : ''}`}
                  open={reviewsOpen}
                  onOpenChange={setReviewsOpen}
                >
                  {/* Write review CTA */}
                  {isAuthenticated && !alreadyReviewed && deliveredOrdersForProduct.length > 0 && (
                    <div className="mb-6 flex items-center justify-between gap-4 p-4 rounded-xl bg-mono-cream/60 border border-border/40">
                      <p className="text-sm text-mono-stone">Share your experience with this product</p>
                      <button
                        type="button"
                        onClick={() => setShowWriteReview(true)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-mono-charcoal text-white text-sm font-medium hover:bg-mono-charcoal/80 transition-colors"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        Write a review
                      </button>
                    </div>
                  )}
                  {isAuthenticated && alreadyReviewed && (
                    <p className="text-sm text-emerald-600 mb-4 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> You have reviewed this product.
                    </p>
                  )}
                  {isAuthenticated && !alreadyReviewed && deliveredOrdersForProduct.length === 0 && (
                    <p className="text-sm text-mono-stone mb-4">
                      Purchase this product to write a review.
                    </p>
                  )}

                  {reviews.length > 0 ? (
                    <ReviewsSection reviews={reviews} stats={reviewStats} inline />
                  ) : (
                    <p className="text-sm text-mono-stone py-4">
                      No reviews yet. Be the first to share your experience with this product.
                    </p>
                  )}
                </AccordionSection>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RelatedProducts slug={slug as string} />

      {showWriteReview && product && (
        <WriteReviewModal
          productId={product.id}
          productName={product.name}
          orderOptions={deliveredOrdersForProduct}
          onClose={() => setShowWriteReview(false)}
          onSuccess={() => { setShowWriteReview(false); refetchReviews(); setReviewsOpen(true); }}
        />
      )}
    </div>
  );
}
