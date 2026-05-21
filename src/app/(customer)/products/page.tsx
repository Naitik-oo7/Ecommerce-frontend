'use client';

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Search, X, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

import { useGetProductsQuery } from '@/services/api/productsApi';
import { useGetCategoriesQuery } from '@/services/api/categoriesApi';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation, useGetWishlistQuery } from '@/services/api/wishlistApi';
import { useAppSelector } from '@/lib/redux/hooks';

import { FilterSidebar, MobileFilterDrawer } from '@/components/shop/FilterSidebar';
import type { ShopFilters } from '@/components/shop/FilterSidebar';
import { ActiveFilterChips } from '@/components/shop/ActiveFilterChips';
import type { ActiveFilter } from '@/components/shop/ActiveFilterChips';
import { ProductGrid } from '@/components/shop/ProductGrid';

const PAGE_SIZE = 12;

// ── URL ↔ Filters helpers ──────────────────────────────────────────────────

function filtersToParams(f: ShopFilters): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.categoryId) p.categoryId = String(f.categoryId);
  if (f.minPrice !== undefined) p.minPrice = String(f.minPrice);
  if (f.maxPrice !== undefined) p.maxPrice = String(f.maxPrice);
  if (f.inStock) p.inStock = 'true';
  if (f.onSale) p.onSale = 'true';
  if (f.isBestseller) p.isBestseller = 'true';
  if (f.minRating !== undefined) p.minRating = String(f.minRating);
  if (f.sortBy) p.sortBy = f.sortBy;
  if (f.sortOrder) p.sortOrder = f.sortOrder;
  return p;
}

function paramsToFilters(sp: URLSearchParams): ShopFilters {
  const f: ShopFilters = {};
  if (sp.get('categoryId')) f.categoryId = Number(sp.get('categoryId'));
  if (sp.get('minPrice')) f.minPrice = Number(sp.get('minPrice'));
  if (sp.get('maxPrice')) f.maxPrice = Number(sp.get('maxPrice'));
  if (sp.get('inStock') === 'true') f.inStock = true;
  if (sp.get('onSale') === 'true') f.onSale = true;
  if (sp.get('isBestseller') === 'true') f.isBestseller = true;
  if (sp.get('minRating')) f.minRating = Number(sp.get('minRating'));
  if (sp.get('sortBy')) f.sortBy = sp.get('sortBy')!;
  if (sp.get('sortOrder')) f.sortOrder = sp.get('sortOrder') as 'asc' | 'desc';
  return f;
}

// ── Inner component (reads searchParams) ──────────────────────────────────

function ShopPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Filter state initialised from URL
  const [filters, setFilters] = useState<ShopFilters>(() => paramsToFilters(searchParams));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  // Infinite scroll page accumulation
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const prevFiltersRef = useRef<string>('');

  // Wishlist & cart state
  const [optimisticWishlistIds, setOptimisticWishlistIds] = useState<Set<number> | null>(null);

  // ── API Queries ──────────────────────────────────────────────────────────

  const queryParams = useMemo(() => {
    const p: Record<string, unknown> = {
      ...filters,
      limit: PAGE_SIZE,
      page,
    };
    if (searchQuery) p.search = searchQuery;
    return p;
  }, [filters, page, searchQuery]);

  const { data: productsResponse, isLoading, isFetching } = useGetProductsQuery(queryParams);

  const { data: wishlistResponse } = useGetWishlistQuery(
    {},
    { skip: !isAuthenticated }
  );

  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const categories = useMemo<{ id: number; name: string }[]>(() => {
    return Array.isArray(categoriesResponse)
      ? (categoriesResponse as { id: number; name: string }[])
      : ((categoriesResponse as { data?: { id: number; name: string }[] })?.data || []);
  }, [categoriesResponse]);

  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  // ── Derive wishlist IDs from API (optimistic overrides on toggle) ─────────

  const serverWishlistIds = useMemo<Set<number>>(() => {
    const items = (wishlistResponse as { data?: { productId?: number; product?: { id?: number }; id?: number }[] })?.data ||
      (Array.isArray(wishlistResponse) ? (wishlistResponse as { productId?: number; product?: { id?: number }; id?: number }[]) : []);
    return new Set(items.map((i) => i.productId ?? i.product?.id ?? i.id ?? 0).filter(Boolean));
  }, [wishlistResponse]);

  const wishlistIds = optimisticWishlistIds ?? serverWishlistIds;

  // ── Accumulate products for infinite scroll ──────────────────────────────

  useEffect(() => {
    const filtersKey = JSON.stringify({ filters, searchQuery });
    if (filtersKey !== prevFiltersRef.current) {
      // Filters changed — reset
      prevFiltersRef.current = filtersKey;
      setPage(1);
      setAllProducts([]);
      return;
    }

    const newItems: any[] = (productsResponse as any)?.data || [];
    const total: number = (productsResponse as any)?.pagination?.total ?? newItems.length;
    setTotalCount(total);

    if (page === 1) {
      setAllProducts(newItems); // eslint-disable-line
    } else {
      setAllProducts((prev) => {
        const existingIds = new Set(prev.map((p: any) => p.id));
        const deduped = newItems.filter((p: any) => !existingIds.has(p.id));
        return [...prev, ...deduped];
      });
    }
  }, [productsResponse, page, filters, searchQuery]);

  // ── Sync URL when filters change ─────────────────────────────────────────

  const updateFilters = useCallback(
    (newFilters: ShopFilters) => {
      setFilters(newFilters);
      setPage(1);
      setAllProducts([]);

      const params = new URLSearchParams(filtersToParams(newFilters));
      if (searchQuery) params.set('search', searchQuery);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchQuery]
  );

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      setPage(1);
      setAllProducts([]);

      const params = new URLSearchParams(filtersToParams(filters));
      if (q) params.set('search', q);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, filters]
  );

  const handleLoadMore = useCallback(() => {
    if (!isFetching) setPage((p) => p + 1);
  }, [isFetching]);

  // ── Wishlist handler ─────────────────────────────────────────────────────

  const handleToggleWishlist = useCallback(
    async (productId: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) { router.push('/login'); return; }
      try {
        if (wishlistIds.has(productId)) {
          setOptimisticWishlistIds((prev) => { const n = new Set(prev ?? wishlistIds); n.delete(productId); return n; });
          await removeFromWishlist(productId).unwrap();
        } else {
          setOptimisticWishlistIds((prev) => new Set(prev ?? wishlistIds).add(productId));
          await addToWishlist(productId).unwrap();
        }
      } catch { /* ignore */ }
    },
    [isAuthenticated, router, wishlistIds, addToWishlist, removeFromWishlist]
  );

  // ── Active filter chips ──────────────────────────────────────────────────

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = [];

    if (filters.categoryId) {
      const catName = categories.find((c) => c.id === filters.categoryId)?.name ?? `Category #${filters.categoryId}`;
      chips.push({
        key: 'categoryId',
        label: catName,
        onRemove: () => updateFilters({ ...filters, categoryId: undefined }),
      });
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const min = filters.minPrice ?? 0;
      const max = filters.maxPrice ?? 50000;
      chips.push({
        key: 'price',
        label: `₹${min.toLocaleString()} – ₹${max.toLocaleString()}`,
        onRemove: () => updateFilters({ ...filters, minPrice: undefined, maxPrice: undefined }),
      });
    }
    if (filters.inStock) {
      chips.push({ key: 'inStock', label: 'In Stock', onRemove: () => updateFilters({ ...filters, inStock: undefined }) });
    }
    if (filters.onSale) {
      chips.push({ key: 'onSale', label: 'On Sale', onRemove: () => updateFilters({ ...filters, onSale: undefined }) });
    }
    if (filters.isBestseller) {
      chips.push({ key: 'isBestseller', label: 'Bestseller', onRemove: () => updateFilters({ ...filters, isBestseller: undefined }) });
    }
    if (filters.minRating) {
      chips.push({ key: 'minRating', label: `${filters.minRating}+ Stars`, onRemove: () => updateFilters({ ...filters, minRating: undefined }) });
    }
    if (searchQuery) {
      chips.push({ key: 'search', label: `"${searchQuery}"`, onRemove: () => { setSearchInput(''); handleSearch(''); } });
    }

    return chips;
  }, [filters, searchQuery, updateFilters, handleSearch, categories]);

  const hasMore = allProducts.length < (totalCount ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-[#FAFAF8]"
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E5E2DD]">
        <div className="container-mono py-6 md:py-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-[#9B9B9B] mb-4">
            <Link href="/" className="flex items-center gap-1 hover:text-[#111111] transition-colors">
              <Home className="h-3 w-3" />
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#111111] font-medium">
              {filters.categoryId
                ? (categories.find((c) => c.id === filters.categoryId)?.name ?? 'Products')
                : 'All Products'}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-2 block">
                Collections
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#111111] leading-tight">
                {filters.categoryId
                  ? (categories.find((c) => c.id === filters.categoryId)?.name ?? 'Shop All')
                  : 'Shop All Products'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Toolbar ──────────────────────────────────────────────── */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-sm border-b border-[#E5E2DD] shadow-sm">
        <div className="container-mono py-2.5">
          <div className="flex items-center gap-3">
            {/* Mobile filter trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden flex-shrink-0 flex items-center gap-2 px-3.5 py-2 bg-[#F6F3EE] border border-[#E5E2DD] rounded-full text-xs font-medium text-[#111111] hover:border-[#C7A27C] transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilters.length > 0 && (
                <span className="w-4 h-4 bg-[#C7A27C] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {/* Product count — desktop */}
            <span className="hidden lg:block text-xs text-[#9B9B9B] shrink-0">
              {totalCount !== undefined && !isLoading
                ? `${allProducts.length} / ${totalCount} products`
                : '...'}
            </span>

            {/* Divider */}
            <div className="hidden lg:block h-4 w-px bg-[#E5E2DD]" />

            {/* Active chips row */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <ActiveFilterChips
                filters={activeFilters}
                onClearAll={() => {
                  setSearchInput('');
                  handleSearch('');
                  updateFilters({});
                }}
              />
            </div>

            {/* Search */}
            <div className="relative flex-shrink-0 w-44 md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B] pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch(searchInput);
                  if (e.key === 'Escape') { setSearchInput(''); handleSearch(''); }
                }}
                className="w-full pl-8 pr-8 py-2 bg-[#F6F3EE] rounded-full text-xs text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#C7A27C]/20 transition-shadow"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); handleSearch(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#111111] transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="container-mono py-8 md:py-10">
        <div className="flex gap-8">

          {/* Desktop Sidebar */}
          <FilterSidebar
            filters={filters}
            onChange={updateFilters}
            productCount={totalCount}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Product Grid */}
            <ProductGrid
              products={allProducts}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              isLoading={isLoading && page === 1}
              isFetchingMore={isFetching && page > 1}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              totalCount={totalCount}
              currentCount={allProducts.length}
            />
          </div>
        </div>
      </div>

      {/* ── Editorial / Discovery Sections ─────────────────────────── */}
      {!isLoading && (
        <div className="border-t border-[#E5E2DD] bg-white mt-2">
          <div className="container-mono py-12 md:py-16">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-2 block">Curated For You</span>
              <h2 className="text-xl md:text-2xl font-bold text-[#111111]">Explore Collections</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Summer Essentials', desc: 'Light, airy picks for the season', icon: '☀️', href: '/products?categoryId=&sortBy=createdAt&sortOrder=desc' },
                { title: 'Minimal Collection', desc: 'Clean lines, timeless design', icon: '◻️', href: '/products?sortBy=avgRating&sortOrder=desc' },
                { title: 'Trending This Week', desc: 'What everyone is wearing now', icon: '🔥', href: '/products?sortBy=totalSold&sortOrder=desc' },
                { title: 'Best Value', desc: 'Premium quality at great prices', icon: '✦', href: '/products?onSale=true' },
              ].map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group relative bg-[#FAFAF8] border border-[#E5E2DD] rounded-2xl p-6 hover:border-[#C7A27C] hover:bg-[#F6F3EE] transition-all duration-300 hover:shadow-md"
                >
                  <span className="text-2xl mb-3 block">{card.icon}</span>
                  <h3 className="font-semibold text-[#111111] text-sm mb-1 group-hover:text-[#C7A27C] transition-colors">{card.title}</h3>
                  <p className="text-xs text-[#6B6B6B]">{card.desc}</p>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8C8C8] group-hover:text-[#C7A27C] group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        filters={filters}
        onChange={(f) => { updateFilters(f); }}
        productCount={totalCount}
      />
    </motion.div>
  );
}

// ── Page export (wrapped in Suspense for useSearchParams) ─────────────────

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin" />
      </div>
    }>
      <ShopPageInner />
    </Suspense>
  );
}
