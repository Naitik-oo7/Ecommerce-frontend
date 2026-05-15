'use client';

import { useGetProductsQuery } from '@/services/api/productsApi';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Heart, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { data: products, isLoading, error } = useGetProductsQuery({});

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="h-80 animate-pulse">
              <div className="h-48 bg-muted" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Failed to load products</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Featured Products</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-10" />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <select className="border rounded-md px-3 py-2">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Clothing</option>
            <option>Home & Garden</option>
          </select>
          <select className="border rounded-md px-3 py-2">
            <option>Sort by: Newest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Rating</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products?.data?.map((product: any) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="p-0">
              <Link href={`/products/${product.slug}`}>
                <div className="aspect-square bg-muted relative">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <Link href={`/products/${product.slug}`}>
                <h3 className="font-semibold mb-2 hover:text-primary line-clamp-2">
                  {product.name}
                </h3>
              </Link>
              <p className="text-2xl font-bold mb-2">${product.price}</p>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm">{product.avgRating || '4.5'}</span>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
              <Button className="flex-1" size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
