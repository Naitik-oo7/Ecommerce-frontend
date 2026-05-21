'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGetProductsQuery, useDeleteProductMutation, useUpdateProductMutation } from '@/services/api/productsApi';
import { useGetCategoriesQuery } from '@/services/api/categoriesApi';
import { useGetTagsQuery } from '@/services/api/tagsApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Search, Edit, Trash2, Loader2, Package, LayoutGrid,
  List, ChevronLeft, ChevronRight, AlertTriangle, TrendingDown,
  CheckCircle2, XCircle, Filter, X, Star,
} from 'lucide-react';
import Link from 'next/link';

const getTotalStock = (variants: any[] = []) =>
  variants.reduce((sum, v) => sum + (v.stock || 0), 0);

const getPrimaryImage = (media: any[] = []) => {
  const primary = media?.find((m: any) => m.isPrimary);
  return primary?.url || media?.[0]?.url;
};

const formatPrice = (price: any) => {
  const n = parseFloat(price);
  return isNaN(n) ? '—' : `₹${n.toFixed(2)}`;
};

const StockBadge = ({ stock, variants }: { stock: number; variants: any[] }) => {
  const hasLow = variants?.some((v: any) => v.stock <= 5 && v.stock > 0);
  if (stock === 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
        <XCircle className="h-3 w-3" /> Out of stock
      </span>
    );
  if (hasLow)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
        <AlertTriangle className="h-3 w-3" /> Low ({stock})
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
      <CheckCircle2 className="h-3 w-3" /> {stock}
    </span>
  );
};

const StatusToggle = ({ product, onToggle }: { product: any; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    title={product.isActive ? 'Click to deactivate' : 'Click to activate'}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      product.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        product.isActive ? 'translate-x-4' : 'translate-x-0.5'
      }`}
    />
  </button>
);

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'low_stock' | 'out_of_stock'>('all');
  const [genderFilter, setGenderFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [inStock, setInStock] = useState('');
  const [minRating, setMinRating] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [toggleError, setToggleError] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  const isLowStock = statusFilter === 'low_stock';
  const isOutOfStock = statusFilter === 'out_of_stock';

  const { data: productsResponse, isLoading, isFetching } = useGetProductsQuery({
    search: search || undefined,
    categoryId: categoryId || undefined,
    page,
    limit: view === 'grid' ? 12 : 15,
    includeInactive: (statusFilter === 'inactive' || statusFilter === 'all') ? 'true' : undefined,
    gender: genderFilter || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    sortBy,
    sortOrder,
    inStock: isOutOfStock ? 'false' : (inStock === 'true' || isLowStock) ? 'true' : undefined,
    minRating: minRating || undefined,
    tags: tagFilter.length > 0 ? tagFilter : undefined,
  });
  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const { data: tagsResponse } = useGetTagsQuery({});
  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  const allProducts: any[] = (productsResponse as any)?.data || [];
  const categories: any[] = (categoriesResponse as any)?.data || [];
  const allTags: { id: number; name: string; type: string }[] = Array.isArray(tagsResponse)
    ? (tagsResponse as { id: number; name: string; type: string }[])
    : ((tagsResponse as { data?: { id: number; name: string; type: string }[] })?.data || []);
  const pagination = (productsResponse as any)?.pagination;

  const products = allProducts.filter((p) => {
    const stock = getTotalStock(p.variants);
    if (statusFilter === 'active') return p.isActive;
    if (statusFilter === 'inactive') return !p.isActive;
    if (statusFilter === 'low_stock') return stock > 0 && p.variants?.some((v: any) => v.stock <= 5);
    return true;
  });

  const stats = {
    total: pagination?.total ?? allProducts.length,
    active: allProducts.filter((p) => p.isActive).length,
    inactive: allProducts.filter((p) => !p.isActive).length,
    outOfStock: allProducts.filter((p) => getTotalStock(p.variants) === 0).length,
    lowStock: allProducts.filter((p) => {
      const s = getTotalStock(p.variants);
      return s > 0 && p.variants?.some((v: any) => v.stock <= 5);
    }).length,
  };

  const handleDelete = useCallback(async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try { await deleteProduct(id).unwrap(); } catch {}
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, [deleteProduct]);

  const handleToggleActive = useCallback(async (product: any) => {
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

  const clearFilters = () => {
    setSearch(''); setSearchTerm(''); setCategoryId(''); setGenderFilter('');
    setStatusFilter('all'); setMinPrice(''); setMaxPrice('');
    setSortBy('createdAt'); setSortOrder('desc'); setInStock(''); setMinRating('');
    setTagFilter([]);
    setPage(1);
  };
  const hasActiveFilters = !!(search || categoryId || genderFilter || statusFilter !== 'all' || minPrice || maxPrice || inStock || minRating || sortBy !== 'createdAt' || tagFilter.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination?.total ?? allProducts.length} products total
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground', bg: 'bg-card', icon: Package, active: statusFilter === 'all', key: 'all' as const },
          { label: 'Active', value: stats.active, color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle2, active: statusFilter === 'active', key: 'active' as const },
          { label: 'Low Stock', value: stats.lowStock, color: 'text-orange-700', bg: 'bg-orange-50', icon: TrendingDown, active: statusFilter === 'low_stock', key: 'low_stock' as const },
          { label: 'Out of Stock', value: stats.outOfStock, color: 'text-destructive', bg: 'bg-destructive/5', icon: XCircle, active: statusFilter === 'out_of_stock', key: 'out_of_stock' as const },
        ].map(({ label, value, color, bg, icon: Icon, active, key }) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(key); setPage(1); }}
            className={`${bg} rounded-xl border p-4 text-left transition-all hover:shadow-sm ${active ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </button>
        ))}
      </div>

      {/* Toggle error banner */}
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
                placeholder="Search by name, description or SKU…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" />}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}

            <div className="ml-auto flex items-center gap-1 border rounded-lg p-0.5">
              <button
                onClick={() => setView('table')}
                className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t space-y-3">
              <div className="flex flex-wrap gap-3">
                {/* Category */}
                <select
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                  className="border rounded-md px-3 py-1.5 text-sm bg-background h-9 min-w-[160px]"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                {/* Gender */}
                <select
                  value={genderFilter}
                  onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
                  className="border rounded-md px-3 py-1.5 text-sm bg-background h-9 min-w-[120px]"
                >
                  <option value="">All Genders</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                </select>

                {/* Stock */}
                <select
                  value={inStock}
                  onChange={(e) => { setInStock(e.target.value); setPage(1); }}
                  className="border rounded-md px-3 py-1.5 text-sm bg-background h-9 min-w-[130px]"
                >
                  <option value="">Any Stock</option>
                  <option value="true">In Stock Only</option>
                </select>

                {/* Min Rating */}
                <select
                  value={minRating}
                  onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
                  className="border rounded-md px-3 py-1.5 text-sm bg-background h-9 min-w-[140px]"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4★ &amp; above</option>
                  <option value="3">3★ &amp; above</option>
                  <option value="2">2★ &amp; above</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="border rounded-md px-3 py-1.5 text-sm bg-background h-9 min-w-[150px]"
                >
                  <option value="createdAt">Sort: Newest</option>
                  <option value="name">Sort: Name</option>
                  <option value="price">Sort: Price</option>
                  <option value="avgRating">Sort: Rating</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
                  className="border rounded-md px-3 py-1.5 text-sm bg-background h-9 min-w-[110px]"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground font-medium shrink-0">Tags:</span>
                  {allTags.map((tag) => {
                    const active = tagFilter.includes(tag.name);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setTagFilter((prev) =>
                            prev.includes(tag.name) ? prev.filter((t) => t !== tag.name) : [...prev, tag.name]
                          );
                          setPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                        }`}
                      >
                        {tag.name}
                        {tag.type === 'sustainability' && ' 🌱'}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Price Range */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium shrink-0">Price range:</span>
                <Input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  className="h-8 w-28 text-sm"
                  min={0}
                />
                <span className="text-muted-foreground text-sm">—</span>
                <Input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  className="h-8 w-28 text-sm"
                  min={0}
                />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading products…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters ? 'Try adjusting your filters.' : 'Get started by adding your first product.'}
                </p>
              </div>
              {!hasActiveFilters && (
                <Link href="/admin/products/new">
                  <Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" />Add Product</Button>
                </Link>
              )}
            </div>
          ) : view === 'table' ? (
            <div className={`overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Price</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Rating</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Stock</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product: any) => {
                    const stock = getTotalStock(product.variants);
                    const img = getPrimaryImage(product.media);
                    return (
                      <tr key={product.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                              {img ? (
                                <img src={img} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.slug}</p>
                              {product.tags?.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {product.tags.slice(0, 2).map((tag: any) => (
                                    <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground/70 font-medium">
                                      {tag.name}
                                    </span>
                                  ))}
                                  {product.tags.length > 2 && (
                                    <span className="text-[10px] text-muted-foreground">+{product.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium">
                            {product.category?.name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold">{formatPrice(product.price)}</p>
                            {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
                              <p className="text-xs text-muted-foreground line-through">{formatPrice(product.comparePrice)}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {product.avgRating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium">{parseFloat(product.avgRating).toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StockBadge stock={stock} variants={product.variants || []} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {togglingIds.has(product.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <StatusToggle product={product} onToggle={() => handleToggleActive(product)} />
                            )}
                            <span className={`text-xs font-medium ${product.isActive ? 'text-green-700' : 'text-muted-foreground'}`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/products/${product.slug}/edit`}>
                              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                                <Edit className="h-3 w-3" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(product.id, product.name)}
                              disabled={deletingIds.has(product.id)}
                            >
                              {deletingIds.has(product.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
              {products.map((product: any) => {
                const stock = getTotalStock(product.variants);
                const img = getPrimaryImage(product.media);
                return (
                  <div key={product.id} className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
                    <div className="relative aspect-square bg-muted">
                      {img ? (
                        <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {!product.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/70 text-white font-medium">Inactive</span>
                        )}
                        {stock === 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-white font-medium">Out of stock</span>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Link href={`/admin/products/${product.slug}/edit`}>
                          <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs">
                            <Edit className="h-3 w-3" /> Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deletingIds.has(product.id)}
                        >
                          {deletingIds.has(product.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate mb-2">{product.category?.name || '—'}</p>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{formatPrice(product.price)}</p>
                        <StockBadge stock={stock} variants={product.variants || []} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{pagination.totalPages}</span>
                <span className="ml-2 text-xs">({pagination.total} total)</span>
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                  return pageNum <= pagination.totalPages ? (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ) : null;
                })}
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
