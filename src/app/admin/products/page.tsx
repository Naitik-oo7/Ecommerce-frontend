'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useGetProductsQuery, useDeleteProductMutation, useUpdateProductMutation, useUpdateStockMutation } from '@/services/api/productsApi';
import { useGetCategoriesQuery } from '@/services/api/categoriesApi';
import { useGetTagsQuery } from '@/services/api/tagsApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, Package, LayoutGrid, List, ChevronLeft, ChevronRight, AlertTriangle, X, Filter } from 'lucide-react';

import { getTotalStock } from '@/lib/admin-utils';
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
    inStock: filters.statusFilter === 'out_of_stock' ? 'false' : (filters.inStock === 'true' || filters.statusFilter === 'low_stock') ? 'true' : undefined,
  });

  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const { data: tagsResponse } = useGetTagsQuery({});
  const [deleteProduct] = useDeleteProductMutation();
  const [updateStock] = useUpdateStockMutation();
  const [updateProduct] = useUpdateProductMutation();

  const { data: allProducts, pagination } = extractPaginatedData<Product>(productsResponse);
  const categories = extractData<{ id: number; name: string }[]>(categoriesResponse) ?? [];
  const allTags = extractData<{ id: number; name: string; type: string }[]>(tagsResponse) ?? [];

  const products = allProducts.filter((p) => {
    const stock = getTotalStock(p.variants);
    if (filters.statusFilter === 'active') return p.isActive;
    if (filters.statusFilter === 'inactive') return !p.isActive;
    if (filters.statusFilter === 'low_stock') return stock > 0 && p.variants?.some((v) => v.stock <= 5);
    return true;
  });

  const stats = {
    total: pagination?.total ?? allProducts.length,
    active: allProducts.filter((p) => p.isActive).length,
    inactive: allProducts.filter((p) => !p.isActive).length,
    outOfStock: allProducts.filter((p) => getTotalStock(p.variants) === 0).length,
    lowStock: allProducts.filter((p) => {
      const s = getTotalStock(p.variants);
      return s > 0 && p.variants?.some((v) => v.stock <= 5);
    }).length,
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
 
