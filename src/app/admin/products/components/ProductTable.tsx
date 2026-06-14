'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, Trash2, Archive, Star, Package } from 'lucide-react';
import { getTotalStock, getPrimaryImage, formatPrice } from '@/lib/admin-utils';
import { StockBadge, StatusToggle } from '@/components/admin/StatusBadges';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  comparePrice?: string;
  avgRating: number;
  isActive: boolean;
  media: { url: string; isPrimary: boolean }[];
  variants: { id: number; stock: number }[];
  category?: { name: string };
  tags?: { id: number; name: string }[];
}

interface ProductTableProps {
  products: Product[];
  isFetching: boolean;
  deletingIds: Set<number>;
  togglingIds: Set<number>;
  updatingStockIds: Set<number>;
  onDelete: (id: number, name: string) => void;
  onToggleActive: (product: Product) => void;
  onMarkOutOfStock: (product: Product) => void;
}

export function ProductTable({
  products,
  isFetching,
  deletingIds,
  togglingIds,
  updatingStockIds,
  onDelete,
  onToggleActive,
  onMarkOutOfStock,
}: ProductTableProps) {
  return (
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
          {products.map((product) => {
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
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {product.tags.slice(0, 2).map((tag) => (
                            <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground/70 font-medium">
                              {tag.name}
                            </span>
                          ))}
                          {product.tags && product.tags.length > 2 && (
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
                      <span className="text-xs font-medium">{product.avgRating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StockBadge stock={stock} variants={product.variants} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {togglingIds.has(product.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <StatusToggle isActive={product.isActive} onToggle={() => onToggleActive(product)} />
                    )}
                    <span className={`text-xs font-medium ${product.isActive ? 'text-mono-sage' : 'text-muted-foreground'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {stock > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs text-mono-terracotta hover:text-mono-terracotta hover:bg-mono-terracotta/8"
                        onClick={() => onMarkOutOfStock(product)}
                        disabled={updatingStockIds.has(product.id)}
                      >
                        {updatingStockIds.has(product.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Archive className="h-3 w-3" />}
                        Out of Stock
                      </Button>
                    )}
                    <Link href={`/admin/products/${product.slug}/edit`}>
                      <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                        <Edit className="h-3 w-3" /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(product.id, product.name)}
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
  );
}
