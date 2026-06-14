'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useGetProductsQuery, useGetProductStatsQuery, useDeleteProductMutation, useUpdateProductMutation, useUpdateStockMutation } from '@/services/api/productsApi';
import { useGetCategoriesQuery } from '@/services/api/categoriesApi';
import { useGetTagsQuery } from '@/services/api/tagsApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, Package, LayoutGrid, List, ChevronLeft, ChevronRight, AlertTriangle, X, Filter } from 'lucide-react';

import { extractPaginatedData, extractData } from '@/lib/api-utils';
import { useProductFilters } from './hooks/useProductFilters';
import { ProductStats } from './components/ProductStats';
import { ProductTable } from './components/ProductTable';

interface Product {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  price: string;
  comparePrice?: string;
  avgRating: number;
  media: { url: string; isPrimary: boolean }[];
  variants: { id: number; stock: number }[];
  category?: { name: string };
  tags?: { id: number; name: string }[];
}

export default function AdminProductsPage() {
  const filters = useProductFilters();
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [updatingStockIds, setUpdatingStockIds] = useState<Set<number>>(new Set());
  const [toggleError, setToggleError] = useState('');

  const { data: productsResponse, isLoading, isFetching } = useGetProductsQuery({
    ...filters.filters,
    limit: filters.view === 'grid' ? 12 : 15,
    includeInactive: (filters.statusFilter === 'inactive' || filters.statusFilter === 'all') ? 'true' : undefined,
    gender: filters.genderFilter || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    inStock: filters.inStock === 'true' ? 'true' : undefined,
    stockStatus: filters.statusFilter === 'low_stock' ? 'low_stock' : filters.statusFilter === 'out_of_stock' ? 'out_of_stock' : undefined,
  });

  const { data: statsResponse } = useGetProductStatsQuery();
  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const { data: tagsResponse } = useGetTagsQuery({});
  const [deleteProduct] = useDeleteProductMutation();
  const [updateStock] = useUpdateStockMutation();
  const [updateProduct] = useUpdateProductMutation();

  const { data: allProducts, pagination } = extractPaginatedData<Product>(productsResponse);
  const categories = extractData<{ id: number; name: string }[]>(categoriesResponse) ?? [];
  const allTags = extractData<{ id: number; name: string; type: string }[]>(tagsResponse) ?? [];

  const products = allProducts.filter((p) => {
    if (filters.statusFilter === 'active') return p.isActive;
    if (filters.statusFilter === 'inactive') return !p.isActive;
    return true;
  });

  const stats = {
    total: statsResponse?.total ?? 0,
    active: statsResponse?.active ?? 0,
    inactive: statsResponse?.inactive ?? 0,
    lowStock: statsResponse?.lowStock ?? 0,
    outOfStock: statsResponse?.outOfStock ?? 0,
  };

  const handleDelete = useCallback(async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try { await deleteProduct(id).unwrap(); } catch {}
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, [deleteProduct]);

  const handleToggleActive = useCallback(async (product: Product) => {
    setToggleError('');
    setTogglingIds((prev) => new Set(prev).add(product.id));
    try {
      await updateProduct({ id: product.id, data: { isActive: !product.isActive } }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setToggleError(e?.data?.message || `Failed to update "${product.name}"`);
    } finally {
      setTogglingIds((prev) => { const n = new Set(prev); n.delete(product.id); return n; });
    }
  }, [updateProduct]);

  const handleMarkOutOfStock = useCallback(async (product: Product) => {
    setToggleError('');
    setUpdatingStockIds((prev) => new Set(prev).add(product.id));
    try {
      for (const variant of product.variants || []) {
        if (variant.stock > 0) {
          await updateStock({ id: product.id, variantId: variant.id, stock: 0 }).unwrap();
        }
      }
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setToggleError(e?.data?.message || `Failed to mark "${product.name}" as out of stock`);
    } finally {
      setUpdatingStockIds((prev) => { const n = new Set(prev); n.delete(product.id); return n; });
    }
  }, [updateStock]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pagination?.total ?? allProducts.length} products total</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <ProductStats 
        stats={stats} 
        activeFilter={filters.statusFilter} 
        onFilterChange={filters.setStatusFilter}
      />

      {/* Error Banner */}
      {toggleError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {toggleError}
          </div>
          <button onClick={() => setToggleError('')} className="text-destructive/60 hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, description or SKU..."
                value={filters.searchTerm}
                onChange={(e) => filters.setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => filters.setShowFilters(!filters.showFilters)}>
              <Filter className="h-3.5 w-3.5" />
              Filters
              {filters.hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" />}
            </Button>

            {filters.hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={filters.clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}

            <div className="ml-auto flex items-center gap-1 border rounded-lg p-0.5">
              <button
                onClick={() => filters.setView('table')}
                className={`p-1.5 rounded-md transition-colors ${filters.view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => filters.setView('grid')}
                className={`p-1.5 rounded-md transition-colors ${filters.view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {filters.showFilters && (
            <div className="pt-3 border-t flex flex-wrap items-center gap-3">
              <select
                value={filters.categoryId}
                onChange={(e) => { filters.setCategoryId(e.target.value); filters.setPage(1); }}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={filters.genderFilter}
                onChange={(e) => { filters.setGenderFilter(e.target.value); filters.setPage(1); }}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">All Genders</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
              </select>
              <select
                value={filters.sortBy + ':' + filters.sortOrder}
                onChange={(e) => {
                  const [by, order] = e.target.value.split(':');
                  filters.setSortBy(by);
                  filters.setSortOrder(order);
                  filters.setPage(1);
                }}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="price:asc">Price: Low to High</option>
                <option value="price:desc">Price: High to Low</option>
                <option value="name:asc">Name: A-Z</option>
                <option value="name:desc">Name: Z-A</option>
              </select>
              <Input
                placeholder="Min price"
                value={filters.minPrice}
                onChange={(e) => { filters.setMinPrice(e.target.value); filters.setPage(1); }}
                className="h-9 w-24"
                type="number"
              />
              <Input
                placeholder="Max price"
                value={filters.maxPrice}
                onChange={(e) => { filters.setMaxPrice(e.target.value); filters.setPage(1); }}
                className="h-9 w-24"
                type="number"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No products found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your filters</p>
            </div>
          ) : filters.view === 'table' ? (
            <ProductTable
              products={products}
              isFetching={isFetching}
              deletingIds={deletingIds}
              togglingIds={togglingIds}
              updatingStockIds={updatingStockIds}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onMarkOutOfStock={handleMarkOutOfStock}
            />
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
              {products.map((product) => {
                const img = product.media?.find((m) => m.isPrimary)?.url || product.media?.[0]?.url;
                const stock = product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
                return (
                  <div key={product.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="aspect-square bg-muted relative">
                      {img ? (
                        <img src={img} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {!product.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground/80 text-white font-medium">Inactive</span>
                        )}
                        {stock === 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground font-medium">Out of stock</span>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold text-sm">₹{parseFloat(product.price).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">{stock} in stock</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Link href={`/admin/products/${product.slug}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full h-7 text-xs">Edit</Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deletingIds.has(product.id)}
                        >
                          {deletingIds.has(product.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => filters.setPage(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => filters.setPage(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
