'use client';

import { useGetWishlistQuery, useRemoveFromWishlistMutation, useClearWishlistMutation } from '@/services/api/wishlistApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Trash2, ShoppingCart, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: wishlistResponse, isLoading } = useGetWishlistQuery({}, { skip: !isAuthenticated });
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [clearWishlist] = useClearWishlistMutation();
  const [removeLoadingIds, setRemoveLoadingIds] = useState<Set<number>>(new Set());

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center p-8">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view your wishlist</h2>
          <Link href="/login"><Button className="mt-4">Login</Button></Link>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Card key={i} className="h-80 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const wishlistItems = (wishlistResponse as any)?.data || [];

  // Updated: Wishlist items need size selection - redirect to product page
  const handleAddToCart = (productSlug: string) => {
    router.push(`/products/${productSlug}`);
  };

  const handleRemove = async (productId: number) => {
    setRemoveLoadingIds((prev) => new Set(prev).add(productId));
    try {
      await removeFromWishlist(productId).unwrap();
    } catch {}
    setRemoveLoadingIds((prev) => { const n = new Set(prev); n.delete(productId); return n; });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="text-muted-foreground mt-1">{wishlistItems.length} saved item{wishlistItems.length !== 1 ? 's' : ''}</p>
        </div>
        {wishlistItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => clearWishlist().catch(() => {})}
          >
            Clear All
          </Button>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <Card className="max-w-md mx-auto text-center p-10">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6">Save products you love for later</p>
          <Link href="/"><Button>Browse Products</Button></Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item: any) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
              <CardHeader className="p-0 relative">
                <Link href={`/products/${item.product.slug}`}>
                  <div className="aspect-square bg-muted overflow-hidden">
                    {(() => {
                      const media = item.product.media || [];
                      const primaryImage = media.find((m: any) => m.isPrimary)?.url || media[0]?.url;
                      return primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={item.product.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                      );
                    })()}
                  </div>
                </Link>
                {(() => {
                  const totalStock = item.product.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
                  return totalStock === 0 ? (
                    <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">Out of Stock</div>
                  ) : null;
                })()}
              </CardHeader>

              <CardContent className="p-4">
                <Link href={`/products/${item.product.slug}`}>
                  <h3 className="font-semibold mb-1 hover:text-primary line-clamp-2 text-sm">{item.product.name}</h3>
                </Link>
                <p className="text-xs text-muted-foreground mb-2">{item.product.category?.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold">${parseFloat(item.product.price).toFixed(2)}</p>
                  {item.product.avgRating && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {parseFloat(item.product.avgRating).toFixed(1)}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                  className="flex-1"
                  size="sm"
                  onClick={() => handleAddToCart(item.product.slug)}
                  disabled={(() => {
                    const totalStock = item.product.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
                    return totalStock === 0;
                  })()}
                >
                  <><ShoppingCart className="h-4 w-4 mr-1" /> Select Size</>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(item.product.id)}
                  disabled={removeLoadingIds.has(item.product.id)}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  {removeLoadingIds.has(item.product.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
