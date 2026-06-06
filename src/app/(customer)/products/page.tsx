"use client";

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { SlidersHorizontal, Search, X, ChevronRight, Home, ArrowUpDown, LayoutGrid, Rows3, ChevronDown } from "lucide-react";
import Link from "next/link";

import { useGetProductsQuery, useGetFilterMetadataQuery } from "@/services/api/productsApi";
import { useGetCategoriesQuery } from "@/services/api/categoriesApi";
import { useWishlist } from "@/hooks/useWishlist";
import type { Product } from "@/types";

import {
  FilterSidebar,
  MobileFilterDrawer,
  ActiveFilterChips,
  ProductGrid,
  QuickViewModal,
  SORT_OPTIONS,
  type ShopFilters,
  type ActiveFilter,
  type FilterMeta,
} from "@/components/shop";

const GENDER_LABELS: Record<string, string> = { men: "Men", women: "Women", unisex: "Unisex" };

type ViewMode = "grid" | "list";

// 30 = LCM of the grid column counts (2 / 3 / 5), so a full page fills every
// breakpoint with zero orphan slots. Also a healthier first load on wide screens
// (6 full rows at xl) than the previous 12.
const PAGE_SIZE = 30;

// ── URL ↔ Filters helpers ──────────────────────────────────────────────────

function buildSearchParams(f: ShopFilters, search?: string): URLSearchParams {
  const p = new URLSearchParams();
  if (f.categoryId) p.set("categoryId", String(f.categoryId));
  if (f.minPrice !== undefined) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice !== undefined) p.set("maxPrice", String(f.maxPrice));
  if (f.inStock) p.set("inStock", "true");
  if (f.isBestseller) p.set("isBestseller", "true");
  if (f.isNewArrival) p.set("isNewArrival", "true");
  if (f.isSustainable) p.set("isSustainable", "true");
  if (f.gender) p.set("gender", f.gender);
  if (f.minRating !== undefined) p.set("minRating", String(f.minRating));
  f.sizes?.forEach((s) => p.append("sizes", s));
  f.materials?.forEach((m) => p.append("materials", m));
  f.tags?.forEach((t) => p.append("tags", t));
  if (f.sortBy) p.set("sortBy", f.sortBy);
  if (f.sortOrder) p.set("sortOrder", f.sortOrder);
  if (search) p.set("search", search);
  return p;
}

function paramsToFilters(sp: URLSearchParams): ShopFilters {
  const f: ShopFilters = {};
  if (sp.get("categoryId")) f.categoryId = Number(sp.get("categoryId"));
  if (sp.get("minPrice")) f.minPrice = Number(sp.get("minPrice"));
  if (sp.get("maxPrice")) f.maxPrice = Number(sp.get("maxPrice"));
  if (sp.get("inStock") === "true") f.inStock = true;
  if (sp.get("isBestseller") === "true") f.isBestseller = true;
  if (sp.get("isNewArrival") === "true") f.isNewArrival = true;
  if (sp.get("isSustainable") === "true") f.isSustainable = true;
  if (sp.get("gender")) f.gender = sp.get("gender")!;
  if (sp.get("minRating")) f.minRating = Number(sp.get("minRating"));
  const sizes = sp.getAll("sizes");
  if (sizes.length) f.sizes = sizes;
  const materials = sp.getAll("materials");
  if (materials.length) f.materials = materials;
  const tags = sp.getAll("tags");
  if (tags.length) f.tags = tags;
  if (sp.get("sortBy")) f.sortBy = sp.get("sortBy")!;
  if (sp.get("sortOrder")) f.sortOrder = sp.get("sortOrder") as "asc" | "desc";
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
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  // View mode + quick view
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sortOpen, setSortOpen] = useState(false);

  // Infinite scroll page accumulation
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const prevFiltersRef = useRef<string>("");
  const sortRef = useRef<HTMLDivElement>(null);

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
  const categories = useMemo<{ id: number; name: string; slug: string }[]>(() => {
    return Array.isArray(categoriesResponse) ?
        (categoriesResponse as { id: number; name: string; slug: string }[])
      : (categoriesResponse as { data?: { id: number; name: string; slug: string }[] })?.data || [];
  }, [categoriesResponse]);

  const unwrapMeta = (resp: unknown): FilterMeta => {
    const m = (resp as { data?: FilterMeta } | FilterMeta) ?? {};
    return ((m as { data?: FilterMeta }).data ?? m) as FilterMeta;
  };

  // Faceted metadata (price/size/material/etc.) — scoped to the current category + search.
  const metaParams = useMemo(() => {
    const p: Record<string, unknown> = {};
    if (filters.categoryId) p.categoryId = filters.categoryId;
    if (searchQuery) p.search = searchQuery;
    return p;
  }, [filters.categoryId, searchQuery]);
  const { data: metaResponse } = useGetFilterMetadataQuery(metaParams);
  const meta = useMemo<FilterMeta>(() => unwrapMeta(metaResponse), [metaResponse]);

  // Category counts for the header pills — scoped to search only so they stay stable.
  const pillMetaParams = useMemo(() => (searchQuery ? { search: searchQuery } : {}), [searchQuery]);
  const { data: pillMetaResponse } = useGetFilterMetadataQuery(pillMetaParams);
  const categoryCounts = useMemo(() => {
    const map = new Map<number, number>();
    unwrapMeta(pillMetaResponse).categories?.forEach((c) => map.set(c.id, c.count));
    return map;
  }, [pillMetaResponse]);

  // ── Accumulate products for infinite scroll ──────────────────────────────

  useEffect(() => {
    const filtersKey = JSON.stringify({ filters, searchQuery });
    // updateFilters/handleSearch already stamp the ref and clear state synchronously.
    // If there's still a mismatch (e.g. on first mount), stamp and bail — the next
    // render with fresh productsResponse will fall through to the accumulation below.
    if (filtersKey !== prevFiltersRef.current) {
      prevFiltersRef.current = filtersKey;
      return;
    }

    // While a page-1 request is in flight, RTK Query still hands back the
    // PREVIOUS query's cached data. Committing it here causes a flash of the old
    // category's products before the new ones arrive. Skip until it settles.
    if (page === 1 && isFetching) return;

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
  }, [productsResponse, isFetching, page, filters, searchQuery]);

  // ── Sync URL when filters change ─────────────────────────────────────────

  const updateFilters = useCallback(
    (newFilters: ShopFilters) => {
      // Stamp the ref immediately so the accumulation effect sees a match
      // the very next time it fires (avoids the double-reset on revisiting a category).
      prevFiltersRef.current = JSON.stringify({ filters: newFilters, searchQuery });
      setFilters(newFilters);
      setPage(1);
      setAllProducts([]);
      // Start the new result set from the top — don't strand the user mid-scroll.
      window.scrollTo({ top: 0, behavior: "smooth" });

      const params = buildSearchParams(newFilters, searchQuery);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchQuery],
  );

  // ── Sync filters FROM the URL whenever it changes ────────────────────────
  // The URL is the source of truth: nav clicks (e.g. ?category=women) and
  // browser back/forward all change searchParams, and this re-derives the
  // filter state from it. Resolves the ?category=<slug> alias to a categoryId.
  useEffect(() => {
    const next = paramsToFilters(searchParams);

    // Resolve the ?category=<slug> alias used by the nav links.
    const slug = searchParams.get("category");
    if (slug && !next.categoryId) {
      const match = categories.find((c) => c.slug === slug);
      if (match) {
        next.categoryId = match.id;
      } else if (categories.length === 0) {
        // Categories not loaded yet — wait for them before committing.
        return;
      }
    }

    const nextSearch = searchParams.get("search") || "";

    // Only act when the URL actually differs from current state, to avoid loops
    // (updateFilters itself writes to the URL). Compare via canonical params so
    // key order can't cause a false "changed".
    const sameFilters =
      buildSearchParams(next).toString() === buildSearchParams(filters).toString();
    const sameSearch = nextSearch === searchQuery;
    if (sameFilters && sameSearch) return;

    // Reset pagination + accumulated products and scroll back to the top.
    prevFiltersRef.current = JSON.stringify({ filters: next, searchQuery: nextSearch });
    setFilters(next);
    setSearchQuery(nextSearch);
    setSearchInput(nextSearch);
    setPage(1);
    setAllProducts([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams, categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(
    (q: string) => {
      prevFiltersRef.current = JSON.stringify({ filters, searchQuery: q });
      setSearchQuery(q);
      setPage(1);
      setAllProducts([]);
      window.scrollTo({ top: 0, behavior: "smooth" });

      const params = buildSearchParams(filters, q);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, filters],
  );

  const handleLoadMore = useCallback(() => {
    if (!isFetching) setPage((p) => p + 1);
  }, [isFetching]);

  // Debounced live search — fires as the user types, without losing Enter-to-search.
  useEffect(() => {
    if (searchInput === searchQuery) return;
    const t = setTimeout(() => handleSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput, searchQuery, handleSearch]);

  // ── Active filter chips ──────────────────────────────────────────────────

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = [];

    if (filters.categoryId) {
      const catName = categories.find((c) => c.id === filters.categoryId)?.name ?? `Category #${filters.categoryId}`;
      chips.push({
        key: "categoryId",
        label: catName,
        onRemove: () => updateFilters({ ...filters, categoryId: undefined }),
      });
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const min = filters.minPrice ?? meta.priceRange?.min ?? 0;
      const max = filters.maxPrice ?? meta.priceRange?.max ?? 50000;
      chips.push({
        key: "price",
        label: `₹${Math.round(min).toLocaleString()} – ₹${Math.round(max).toLocaleString()}`,
        onRemove: () => updateFilters({ ...filters, minPrice: undefined, maxPrice: undefined }),
      });
    }
    if (filters.inStock) {
      chips.push({
        key: "inStock",
        label: "In Stock",
        onRemove: () => updateFilters({ ...filters, inStock: undefined }),
      });
    }
    if (filters.isNewArrival) {
      chips.push({
        key: "isNewArrival",
        label: "New Arrivals",
        onRemove: () => updateFilters({ ...filters, isNewArrival: undefined }),
      });
    }
    if (filters.isBestseller) {
      chips.push({
        key: "isBestseller",
        label: "Bestseller",
        onRemove: () => updateFilters({ ...filters, isBestseller: undefined }),
      });
    }
    if (filters.isSustainable) {
      chips.push({
        key: "isSustainable",
        label: "Sustainable",
        onRemove: () => updateFilters({ ...filters, isSustainable: undefined }),
      });
    }
    if (filters.gender) {
      chips.push({
        key: "gender",
        label: GENDER_LABELS[filters.gender] ?? filters.gender,
        onRemove: () => updateFilters({ ...filters, gender: undefined }),
      });
    }
    filters.sizes?.forEach((size) => {
      chips.push({
        key: `size-${size}`,
        label: `Size ${size}`,
        onRemove: () => updateFilters({ ...filters, sizes: filters.sizes?.filter((s) => s !== size) }),
      });
    });
    filters.materials?.forEach((mat) => {
      chips.push({
        key: `material-${mat}`,
        label: mat,
        onRemove: () => updateFilters({ ...filters, materials: filters.materials?.filter((m) => m !== mat) }),
      });
    });
    filters.tags?.forEach((tag) => {
      chips.push({
        key: `tag-${tag}`,
        label: tag,
        onRemove: () => updateFilters({ ...filters, tags: filters.tags?.filter((t) => t !== tag) }),
      });
    });
    if (filters.minRating) {
      chips.push({
        key: "minRating",
        label: `${filters.minRating}★ & up`,
        onRemove: () => updateFilters({ ...filters, minRating: undefined }),
      });
    }
    if (searchQuery) {
      chips.push({
        key: "search",
        label: `"${searchQuery}"`,
        onRemove: () => {
          setSearchInput("");
          handleSearch("");
        },
      });
    }

    return chips;
  }, [filters, searchQuery, updateFilters, handleSearch, categories, meta]);

  useEffect(() => {
    if (!sortOpen) return;
    function handleOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [sortOpen]);

  const activeSortIdx = SORT_OPTIONS.findIndex(
    (o) =>
      (o.value === "relevance" && !filters.sortBy) ||
      (o.value === filters.sortBy && o.order === filters.sortOrder),
  );

  const hasMore = allProducts.length < (totalCount ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen"
      style={{ background: "#F6F3EE" }}
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ background: "#F0ECE4", borderBottom: "1px solid #E2D9CE" }}>
        <div className="container-plp py-4 md:py-5">
          <div className="flex items-baseline gap-3">
            {/* Breadcrumb inline with title */}
            <nav
              className="flex items-center gap-1.5 shrink-0"
              style={{ fontSize: "11px", color: "#C8C0B8", fontFamily: "var(--font-body, Jost, sans-serif)" }}
            >
              <Link href="/" className="flex items-center gap-1 hover:text-mono-charcoal transition-colors">
                <Home className="h-3 w-3" />
              </Link>
              <ChevronRight className="h-3 w-3" />
            </nav>
            <h1
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: "clamp(1.1rem, 1.8vw, 1.35rem)",
                fontWeight: 700,
                color: "#1A1A18",
                lineHeight: 1.2,
              }}
            >
              {filters.categoryId
                ? (categories.find((c) => c.id === filters.categoryId)?.name ?? "Products")
                : "All Products"}
            </h1>
            {totalCount !== undefined && !isLoading && (
              <span
                className="shrink-0"
                style={{ fontSize: "12px", color: "#C8C0B8", fontFamily: "var(--font-body, Jost, sans-serif)" }}
              >
                {totalCount} products
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky Toolbar ──────────────────────────────────────────────── */}
      <div
        className="sticky top-16 z-40 backdrop-blur-sm border-b border-[#E5E2DD]"
        style={{ background: "rgba(246,243,238,0.96)" }}
      >
        <div className="container-plp py-2.5">
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
            <span
              className="hidden lg:block text-xs shrink-0"
              style={{ color: "#C8C0B8", fontFamily: "var(--font-body, Jost, sans-serif)" }}
            >
              {totalCount !== undefined && !isLoading ? `${allProducts.length} / ${totalCount} products` : "..."}
            </span>

            {/* Divider */}
            <div className="hidden lg:block h-4 w-px bg-[#E5E2DD]" />

            {/* Active chips row */}
            <div className="with-sidebar flex-1 min-w-0 overflow-hidden">
              {" "}
              <ActiveFilterChips
                filters={activeFilters}
                onClearAll={() => {
                  setSearchInput("");
                  handleSearch("");
                  updateFilters({ sortBy: filters.sortBy, sortOrder: filters.sortOrder });
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
                  if (e.key === "Enter") handleSearch(searchInput);
                  if (e.key === "Escape") {
                    setSearchInput("");
                    handleSearch("");
                  }
                }}
                className="w-full pl-8 pr-8 py-2 bg-mono-cream rounded-full text-xs text-mono-charcoal placeholder:text-[#C8C0B8] focus:outline-none focus:ring-2 focus:ring-mono-terracotta/20 transition-shadow"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    handleSearch("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mono-stone hover:text-mono-charcoal transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Sort dropdown — desktop only */}
            <div ref={sortRef} className="hidden lg:block relative shrink-0">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-[#E5E2DD] bg-mono-cream px-3.5 py-1.5 hover:border-mono-terracotta transition-colors"
              >
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-mono-stone" />
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mono-stone whitespace-nowrap"
                  style={{ fontFamily: "var(--font-body, Jost, sans-serif)" }}
                >
                  Sort:
                </span>
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  style={{ color: "#1A1A18", fontFamily: "var(--font-body, Jost, sans-serif)" }}
                >
                  {SORT_OPTIONS[activeSortIdx]?.label ?? "Featured"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-mono-stone transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
                />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[192px] rounded-xl border border-[#E5E2DD] bg-white py-1 shadow-lg overflow-hidden">
                  {SORT_OPTIONS.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        updateFilters({
                          ...filters,
                          sortBy: opt.value === "relevance" ? undefined : opt.value,
                          sortOrder: opt.value === "relevance" ? undefined : opt.order,
                        });
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-[#F6F3EE] ${
                        i === activeSortIdx
                          ? "font-semibold text-mono-terracotta bg-[#F6F3EE]"
                          : "font-medium text-mono-charcoal"
                      }`}
                      style={{ fontFamily: "var(--font-body, Jost, sans-serif)" }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle — grid / list */}
            <div className="hidden sm:flex items-center gap-0.5 shrink-0 rounded-full border border-[#E5E2DD] bg-mono-cream p-0.5">
              {[
                { mode: "grid" as const, Icon: LayoutGrid, label: "Grid view" },
                { mode: "list" as const, Icon: Rows3, label: "List view" },
              ].map(({ mode, Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  aria-label={label}
                  aria-pressed={viewMode === mode}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                    viewMode === mode ? "bg-mono-charcoal text-white" : "text-mono-stone hover:text-mono-charcoal"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="container-plp py-8 md:py-10">
        <div className="flex gap-4 lg:gap-6">
          {/* Desktop Sidebar */}
          <FilterSidebar
            filters={filters}
            onChange={updateFilters}
            meta={meta}
            productCount={totalCount}
            categories={categories}
            categoryCounts={categoryCounts}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Product Grid */}
            <ProductGrid
              products={allProducts}
              view={viewMode}
              wishlistIds={wishlistIds}
              onToggleWishlist={toggleWishlist}
              onQuickView={setQuickViewProduct}
              isLoading={page === 1 && (isLoading || isFetching)}
              isFetchingMore={isFetching && page > 1}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              totalCount={totalCount}
            />
          </div>
        </div>
      </div>

      {/* ── Editorial / Discovery Sections ─────────────────────────── */}
      {!isLoading && (
        <div className="border-t mt-2" style={{ borderColor: "#E8E4DE", background: "#F0ECE4" }}>
          <div className="container-plp py-12 md:py-16">
            <div className="text-center mb-10">
              <span
                className="text-xs font-semibold tracking-[0.2em] uppercase mb-3 block"
                style={{ color: "#C8703A", fontFamily: "var(--font-body, Jost, sans-serif)" }}
              >
                Curated For You
              </span>
              <h2
                className="leading-[1.05]"
                style={{
                  fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                  fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)",
                  fontWeight: 700,
                  color: "#1A1A18",
                }}
              >
                Explore Collections
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "New Arrivals", desc: "Fresh drops, just landed", href: "/products?isNewArrival=true" },
                {
                  title: "Top Rated",
                  desc: "Highest-reviewed favourites",
                  href: "/products?sortBy=avgRating&sortOrder=desc",
                },
                { title: "Bestsellers", desc: "What everyone is loving now", href: "/products?isBestseller=true" },
                { title: "Sustainable Edit", desc: "Consciously made pieces", href: "/products?isSustainable=true" },
              ].map((card, i) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group relative p-6 border rounded-2xl transition-all duration-300 hover:shadow-md hover:border-mono-terracotta"
                  style={{ background: "#F6F3EE", borderColor: "#E2D9CE" }}
                >
                  <span
                    className="text-xs font-bold tracking-widest uppercase mb-3 block"
                    style={{ color: "#C8703A", fontFamily: "var(--font-body, Jost, sans-serif)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className="font-semibold text-sm mb-1"
                    style={{ color: "#1A1A18", fontFamily: "var(--font-body, Jost, sans-serif)" }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-xs" style={{ color: "#6B6560", fontFamily: "var(--font-body, Jost, sans-serif)" }}>
                    {card.desc}
                  </p>
                  <ChevronRight
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: "#C8C0B8" }}
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
        onChange={(f) => {
          updateFilters(f);
        }}
        meta={meta}
        productCount={totalCount}
        categories={categories}
        categoryCounts={categoryCounts}
      />

      {/* Quick View modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
        isInWishlist={quickViewProduct ? wishlistIds.has(quickViewProduct.id) : false}
        onToggleWishlist={toggleWishlist}
      />
    </motion.div>
  );
}

// ── Page export (wrapped in Suspense for useSearchParams) ─────────────────

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F3EE" }}>
          <div className="w-8 h-8 border-2 border-mono-charcoal/20 border-t-mono-charcoal rounded-full animate-spin" />
        </div>
      }
    >
      <ShopPageInner />
    </Suspense>
  );
}
