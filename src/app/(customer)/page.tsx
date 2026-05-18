'use client';

import { useState, useCallback } from 'react';
import { useGetProductsQuery } from '@/services/api/productsApi';
import { useGetCategoriesQuery } from '@/services/api/categoriesApi';
import { useAddToCartMutation } from '@/services/api/cartApi';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '@/services/api/wishlistApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Heart, Search, SlidersHorizontal, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [cartLoadingIds, setCartLoadingIds] = useState<Set<number>>(new Set());
  const [wishlistLoadingIds, setWishlistLoadingIds] = useState<Set<number>>(new Set());

  const { data: productsData, isLoading, error } = useGetProductsQuery({
    search: search || undefined,
    categoryId: categoryId || undefined,
    sortBy,
    sortOrder,
    page,
    limit: 12,
  });

  const { data: categoriesData } = useGetCategoriesQuery({});
  const [addToCart] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const products = (productsData as any)?.data || [];
  const pagination = (productsData as any)?.metadata?.pagination;
  const categories = (categoriesData as any)?.data || [];

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split(':');
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  const handleAddToCart = async (productId: number) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setCartLoadingIds((prev) => new Set(prev).add(productId));
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
    } catch {}
    setCartLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const handleToggleWishlist = async (productId: number) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setWishlistLoadingIds((prev) => new Set(prev).add(productId));
    try {
      if (wishlistIds.has(productId)) {
        await removeFromWishlist(productId).unwrap();
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await addToWishlist(productId).unwrap();
        setWishlistIds((prev) => new Set(prev).add(productId));
      }
    } catch {}
    setWishlistLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Discover Products</h1>
        <p className="text-muted-foreground mb-6">Find everything you need in one place</p>

        <div className="flex flex-col gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex flex-wrap gap-2">
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="createdAt:DESC">Newest First</option>
              <option value="createdAt:ASC">Oldest First</option>
              <option value="price:ASC">Price: Low to High</option>
              <option value="price:DESC">Price: High to Low</option>
              <option value="avgRating:DESC">Best Rated</option>
              <option value="name:ASC">Name: A-Z</option>
            </select>

            {(search || categoryId) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setCategoryId('');
                  setPage(1);
                }}
              >
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-destructive text-lg">Failed to load products. Please try again.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">No products found{search ? ` for "${search}"` : ''}.</p>
          {(search || categoryId) && (
            <Button className="mt-4" variant="outline" onClick={() => { setSearch(''); setSearchInput(''); setCategoryId(''); }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
                <CardHeader className="p-0 relative">
                  <Link href={`/products/${product.slug}`}>
                    <div className="aspect-square bg-muted overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          No image
                        </div>
                      )}
                    </div>
                  </Link>
                  {product.stock === 0 && (
                    <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
                      Out of Stock
                    </div>
                  )}
                  {product.isLowStock && product.stock > 0 && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                      Low Stock
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background ${wishlistIds.has(product.id) ? 'text-red-500' : ''}`}
                    onClick={() => handleToggleWishlist(product.id)}
                    disabled={wishlistLoadingIds.has(product.id)}
                    aria-label="Add to wishlist"
                  >
                    <Heart className={`h-4 w-4 ${wishlistIds.has(product.id) ? 'fill-current' : ''}`} />
                  </Button>
                </CardHeader>

                <CardContent className="p-4">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold mb-1 hover:text-primary line-clamp-2 text-sm leading-snug">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-2">{product.category?.name}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold">${parseFloat(product.price).toFixed(2)}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span>{product.avgRating ? parseFloat(product.avgRating).toFixed(1) : '—'}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleAddToCart(product.id)}
                    disabled={product.stock === 0 || cartLoadingIds.has(product.id)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {cartLoadingIds.has(product.id) ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 7 && <span className="text-muted-foreground">...</span>}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
