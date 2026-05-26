export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  stock: number;
  isActive: boolean;
  isBestseller?: boolean;
  avgRating?: number;
  reviewCount?: number;
  media: ProductMedia[];
  category?: ProductCategory;
  variants: ProductVariant[];
  tags?: ProductTag[];
  /** Derived from media[] by productsApi transformResponse — always set after API fetch */
  images?: string[];
}

export interface ProductMedia {
  id?: number;
  url: string;
  isPrimary?: boolean;
  type?: 'image' | 'video';
  alt?: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug?: string;
}

export interface ProductVariant {
  id: number;
  size: string;
  color: string;
  colorHex?: string;
  stock: number;
  price: number;
  sku: string;
}

export interface ProductTag {
  id: number;
  name: string;
  type?: string;
}

export interface ShopFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  isBestseller?: boolean;
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
