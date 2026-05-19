'use client';

import { useState } from 'react';
import { useGetProductsQuery, useDeleteProductMutation, useUpdateProductMutation } from '@/services/api/productsApi';
import { useGetCategoriesQuery } from '@/services/api/categoriesApi';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Loader2, Package } from 'lucide-react';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const { data: productsResponse, isLoading } = useGetProductsQuery({
    search: search || undefined,
    categoryId: categoryId || undefined,
    page,
    limit: 20,
    includeInactive: true,
  });
  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  const products = (productsResponse as any)?.data || [];
  const categories = (categoriesResponse as any)?.data || [];
  const pagination = (productsResponse as any)?.pagination;

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteProduct(id).unwrap();
    } catch {}
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleToggleActive = async (product: any) => {
    try {
      await updateProduct({ id: product.id, data: { isActive: !product.isActive } }).unwrap();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          {pagination && <p className="text-muted-foreground text-sm mt-1">{pagination.total} total products</p>}
        </div>
        <Link href="/admin/products/new">
          <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchTerm); setPage(1); } }}
                className="pl-10"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => { setSearch(searchTerm); setPage(1); }}>
              Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left p-3">Product</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Price</th>
                    <th className="text-left p-3">Stock</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p>No products found.</p>
                        <Link href="/admin/products/new">
                          <Button className="mt-3" size="sm">Add your first product</Button>
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    products.map((product: any) => (
                      <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-md overflow-hidden flex-shrink-0">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm">{product.category?.name || '—'}</td>
                        <td className="p-3 text-sm font-medium">${parseFloat(product.price).toFixed(2)}</td>
                        <td className="p-3 text-sm">
                          <span className={`${product.stock === 0 ? 'text-destructive' : product.stock <= 5 ? 'text-orange-500' : 'text-green-600'} font-medium`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleActive(product)}
                            className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                              product.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Link href={`/admin/products/${product.slug}/edit`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingIds.has(product.id)}
                            >
                              {deletingIds.has(product.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
