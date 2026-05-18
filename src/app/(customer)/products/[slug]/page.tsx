'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetProductBySlugQuery } from '@/services/api/productsApi';
import { useAddToCartMutation } from '@/services/api/cartApi';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '@/services/api/wishlistApi';
import { useGetProductReviewsQuery } from '@/services/api/reviewsApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Heart, Star, Minus, Plus, ArrowLeft, Package, Shield, Truck } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const { data: productResponse, isLoading, error } = useGetProductBySlugQuery(slug as string);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [inWishlist, setInWishlist] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const product = (productResponse as any)?.data || productResponse;

  const { data: reviewsResponse } = useGetProductReviewsQuery(
    { productId: product?.id },
    { skip: !product?.id }
  );

  const [addToCart] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const reviewsData = (reviewsResponse as any)?.data;
  const reviews = reviewsData?.reviews || [];
  const reviewStats = reviewsData?.stats;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setCartLoading(true);
    try {
      await addToCart({ productId: product.id, quantity }).unwrap();
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
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
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-muted animate-pulse rounded-xl" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-20 h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-10 bg-muted rounded animate-pulse w-1/3" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Product not found</h2>
        <p className="text-muted-foreground mb-6">This product may have been removed or doesn't exist.</p>
        <Link href="/"><Button>Browse Products</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-xl overflow-hidden">
            {product.images?.[selectedImage] ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Package className="h-24 w-24" />
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground'
                  }`}
                >
                  <img src={img} alt={`View ${index + 1}`} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{product.category?.name}</p>
            <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(parseFloat(reviewStats?.avgRating || product.avgRating || '0'))
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {reviewStats?.avgRating || product.avgRating
                  ? `${parseFloat(reviewStats?.avgRating || product.avgRating).toFixed(1)} (${reviewStats?.totalReviews || 0} reviews)`
                  : 'No reviews yet'}
              </span>
            </div>
            <p className="text-4xl font-bold text-primary">${parseFloat(product.price).toFixed(2)}</p>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium min-w-[80px]">Quantity:</span>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-none h-10"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-none h-10"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= (product.stock || 0)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className={`text-sm ${product.stock === 0 ? 'text-destructive' : product.isLowStock ? 'text-orange-500' : 'text-green-600'}`}>
                {product.stock === 0 ? 'Out of stock' : product.isLowStock ? `Only ${product.stock} left!` : `${product.stock} in stock`}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 h-12"
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || cartLoading}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {cartLoading ? 'Adding...' : addedToCart ? 'Added!' : 'Add to Cart'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-4"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-lg text-center">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-lg text-center">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Secure Payment</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 bg-muted/50 rounded-lg text-center">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

        {reviewStats && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-bold">{parseFloat(reviewStats.avgRating || '0').toFixed(1)}</p>
                  <div className="flex justify-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(parseFloat(reviewStats.avgRating || '0')) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{reviewStats.totalReviews} reviews</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewStats.distribution?.[star] || 0;
                    const percent = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs w-3">{star}</span>
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-6">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No reviews yet. Purchase this product to leave a review.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <Card key={review.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{review.user?.name || 'Anonymous'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>}
                  {review.isVerified && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Verified Purchase
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
