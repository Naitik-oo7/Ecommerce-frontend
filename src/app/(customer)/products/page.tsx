'use client';

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Search, X, ChevronRight, Home, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

import { useGetProductsQuery } from '@/services/api/productsApi';
import { useGetCategoriesQuery } from '@/services/api/categoriesApi';
import { useWishlist } from '@/hooks/useWishlist';

import {
  FilterSidebar,
  MobileFilterDrawer,
  ActiveFilterChips,
  ProductGrid,
  SORT_OPTIONS,
  type ShopFilters,
  type ActiveFilter,
} from '@/components/shop';

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

  const { wishlistIds, toggleWishlist } = useWishlist();

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

  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const categories = useMemo<{ id: number; name: string }[]>(() => {
    return Array.isArray(categoriesResponse)
      ? (categoriesResponse as { id: number; name: string }[])
      : ((categoriesResponse as { data?: { id: number; name: string }[] })?.data || []);
  }, [categoriesResponse]);

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
      className="min-h-screen"
      style={{ background: '#F6F3EE' }}
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ background: '#F0ECE4', borderBottom: '1px solid #E2D9CE' }}>
        <div className="container-mono pt-8 pb-6 md:pt-10 md:pb-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 mb-5" style={{ fontSize: '11px', color: '#C8C0B8', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
            <Link href="/" className="flex items-center gap-1 hover:text-mono-charcoal transition-colors">
              <Home className="h-3 w-3" />
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span style={{ color: '#1A1A18', fontWeight: 600 }}>
              {filters.categoryId
                ? (categories.find((c) => c.id === filters.categoryId)?.name ?? 'Products')
                : 'All Products'}
            </span>
          </nav>

          {/* Title block */}
          <div className="mb-6">
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-2 block"
              style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Collections
            </span>
            <h1
              className="leading-tight"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(1.6rem, 2.8vw, 2.2rem)',
                fontWeight: 700,
                color: '#1A1A18',
              }}
            >
              {filters.categoryId
                ? (categories.find((c) => c.id === filters.categoryId)?.name ?? 'Shop All')
                : (
                  <>
                    Shop{' '}
                    <em className="font-normal italic" style={{ color: '#6B6560' }}>
                      all products
                    </em>
                  </>
                )}
            </h1>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => updateFilters({ ...filters, categoryId: undefined })}
              className="shrink-0 px-4 py-1.5 text-xs font-medium rounded-full border transition-all duration-200"
              style={{
                fontFamily: 'var(--font-body, Jost, sans-serif)',
                letterSpacing: '0.04em',
                ...(filters.categoryId === undefined
                  ? { background: '#1A1A18', color: '#F6F3EE', borderColor: '#1A1A18' }
                  : { background: 'transparent', color: '#6B6560', borderColor: '#D4CCC4' }),
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateFilters({ ...filters, categoryId: cat.id })}
                className="shrink-0 px-4 py-1.5 text-xs font-medium rounded-full border transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-body, Jost, sans-serif)',
                  letterSpacing: '0.04em',
                  ...(filters.categoryId === cat.id
                    ? { background: '#1A1A18', color: '#F6F3EE', borderColor: '#1A1A18' }
                    : { background: 'transparent', color: '#6B6560', borderColor: '#D4CCC4' }),
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky Toolbar ──────────────────────────────────────────────── */}
      <div className="sticky top-16 z-20 backdrop-blur-sm border-b border-[#E5E2DD]" style={{ background: 'rgba(246,243,238,0.96)' }}>
        <div className="container-mono py-2.5">
          <div className="flex items-center gap-3">
            {/* Mobile filter trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden shrink-0 flex items-center gap-2 px-3.5 py-2 bg-mono-cream border border-[#E5E2DD] rounded-full text-xs font-medium text-mono-charcoal hover:border-mono-terracotta transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilters.length > 0 && (
                <span className="w-4 h-4 bg-mono-terracotta text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {/* Product count — desktop */}
            <span className="hidden lg:block text-xs shrink-0" style={{ color: '#C8C0B8', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
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
            <div className="relative shrink-0 w-36 md:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mono-stone pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch(searchInput);
                  if (e.key === 'Escape') { setSearchInput(''); handleSearch(''); }
                }}
                className="w-full pl-8 pr-8 py-2 bg-mono-cream rounded-full text-xs text-mono-charcoal placeholder:text-[#C8C0B8] focus:outline-none focus:ring-2 focus:ring-mono-terracotta/20 transition-shadow"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); handleSearch(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mono-stone hover:text-mono-charcoal transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Sort dropdown — desktop only */}
            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0" style={{ color: '#6B6560' }} />
              <select
                value={
                  SORT_OPTIONS.findIndex(
                    (o) =>
                      (o.value === 'relevance' && !filters.sortBy) ||
                      (o.value === filters.sortBy && o.order === filters.sortOrder)
                  ).toString()
                }
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  const opt = SORT_OPTIONS[idx];
                  updateFilters({
                    ...filters,
                    sortBy: opt.value === 'relevance' ? undefined : opt.value,
                    sortOrder: opt.value === 'relevance' ? undefined : opt.order,
                  });
                }}
                className="text-xs border-0 bg-transparent focus:outline-none cursor-pointer"
                style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
              >
                {SORT_OPTIONS.map((opt, i) => (
                  <option key={i} value={i}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
              onToggleWishlist={toggleWishlist}
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
        <div className="border-t mt-2" style={{ borderColor: '#E8E4DE', background: '#F0ECE4' }}>
          <div className="container-mono py-12 md:py-16">
            <div className="text-center mb-10">
              <span
                className="text-xs font-semibold tracking-[0.2em] uppercase mb-3 block"
                style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
              >
                Curated For You
              </span>
              <h2
                className="leading-[1.05]"
                style={{
                  fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                  fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
                  fontWeight: 700,
                  color: '#1A1A18',
                }}
              >
                Explore Collections
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Summer Essentials', desc: 'Light, airy picks for the season', href: '/products?sortBy=createdAt&sortOrder=desc' },
                { title: 'Minimal Collection', desc: 'Clean lines, timeless design', href: '/products?sortBy=avgRating&sortOrder=desc' },
                { title: 'Trending This Week', desc: 'What everyone is wearing now', href: '/products?sortBy=totalSold&sortOrder=desc' },
                { title: 'Best Value', desc: 'Premium quality at great prices', href: '/products?onSale=true' },
              ].map((card, i) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group relative p-6 border rounded-2xl transition-all duration-300 hover:shadow-md hover:border-mono-terracotta"
                  style={{ background: '#F6F3EE', borderColor: '#E2D9CE' }}
                >
                  <span
                    className="text-xs font-bold tracking-widest uppercase mb-3 block"
                    style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3
                    className="font-semibold text-sm mb-1"
                    style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-xs" style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
                    {card.desc}
                  </p>
                  <ChevronRight
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: '#C8C0B8' }}
                  />
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F3EE' }}>
        <div className="w-8 h-8 border-2 border-mono-charcoal/20 border-t-mono-charcoal rounded-full animate-spin" />
      </div>
    }>
      <ShopPageInner />
    </Suspense>
  );
}
