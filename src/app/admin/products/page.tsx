'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select className="border rounded-md px-3 py-2">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Clothing</option>
              <option>Home & Garden</option>
            </select>
            <select className="border rounded-md px-3 py-2">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Price</th>
                  <th className="text-left p-4">Stock</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No products found. Add your first product to get started.
                    </td>
                  </tr>
                ) : (
                  products.map((product: any) => (
                    <tr key={product.id} className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-md overflow-hidden">
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{product.category?.name}</td>
                      <td className="p-4">${product.price}</td>
                      <td className="p-4">{product.stock}</td>
                      <td className="p-4">
                        <button className="flex items-center gap-2 text-sm">
                          {product.isActive ? (
                            <>
                              <ToggleRight className="h-5 w-5 text-green-500" />
                              Active
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-5 w-5 text-gray-500" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
