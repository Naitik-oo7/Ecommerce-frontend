'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  // Placeholder - will integrate with wishlist API in Phase 3
  const wishlistItems = [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
      
      {wishlistItems.length === 0 ? (
        <Card className="max-w-md mx-auto text-center p-8">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6">Save products you love</p>
          <Link href="/">
            <Button>Browse Products</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item: any) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <Link href={`/products/${item.product.slug}`}>
                  <div className="aspect-square bg-muted relative">
                    {item.product.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                </Link>
              </CardHeader>
              <CardContent className="p-4">
                <Link href={`/products/${item.product.slug}`}>
                  <h3 className="font-semibold mb-2 hover:text-primary line-clamp-2">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="text-2xl font-bold mb-2">${item.product.price}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button className="flex-1" size="sm">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
