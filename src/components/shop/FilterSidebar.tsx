'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Star, SlidersHorizontal } from 'lucide-react';
import { useGetCategoriesQuery } from '@/services/api/categoriesApi';
import { PriceRangeSlider } from './PriceRangeSlider';

export interface ShopFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  onSale?: boolean;
  isBestseller?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface FilterSidebarProps {
  filters: ShopFilters;
  onChange: (filters: ShopFilters) => void;
  productCount?: number;
  hideSort?: boolean;
}

const PRICE_MIN = 0;
const PRICE_MAX = 50000;

export const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance', order: 'desc' as const },
  { label: 'Price: Low to High', value: 'price', order: 'asc' as const },
  { label: 'Price: High to Low', value: 'price', order: 'desc' as const },
  { label: 'Newest First', value: 'createdAt', order: 'desc' as const },
  { label: 'Top Rated', value: 'avgRating', order: 'desc' as const },
  { label: 'Best Sellers', value: 'totalSold', order: 'desc' as const },
];

function AccordionSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#E5E2DD] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3.5 text-left"
      >
        <span
          className="text-[10px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
        >
          {title}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          style={{ color: '#C8C0B8' }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterSidebarContent({ filters, onChange, hideSort }: FilterSidebarProps) {
  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const categories: { id: number; name: string }[] = Array.isArray(categoriesResponse)
    ? (categoriesResponse as { id: number; name: string }[])
    : ((categoriesResponse as { data?: { id: number; name: string }[] })?.data || []);

  const priceRange: [number, number] = [
    filters.minPrice ?? PRICE_MIN,
    filters.maxPrice ?? PRICE_MAX,
  ];

  const activeClass = 'bg-[#FDF8F4] text-[#1A1A18] font-semibold border-l-[#C8703A]';
  const inactiveClass = 'text-[#6B6560] hover:bg-[#F6F3EE] hover:text-[#1A1A18] border-l-transparent';
  const rowBase = 'w-full text-left px-3 py-2 text-[13px] transition-all duration-150 border-l-2';

  return (
    <div className="space-y-0">
      {/* Sort — hidden on desktop sidebar, visible in mobile drawer */}
      {!hideSort && (
        <AccordionSection title="Sort By">
          <div className="space-y-0.5">
            {SORT_OPTIONS.map((opt) => {
              const isActive =
                (filters.sortBy === opt.value && filters.sortOrder === opt.order) ||
                (!filters.sortBy && opt.value === 'relevance');
              return (
                <button
                  key={`${opt.value}-${opt.order}`}
                  onClick={() =>
                    onChange({
                      ...filters,
                      sortBy: opt.value === 'relevance' ? undefined : opt.value,
                      sortOrder: opt.value === 'relevance' ? undefined : opt.order,
                    })
                  }
                  className={`${rowBase} ${isActive ? activeClass : inactiveClass}`}
                  style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </AccordionSection>
      )}

      {/* Category */}
      <AccordionSection title="Category">
        <div className="space-y-0.5">
          <button
            onClick={() => onChange({ ...filters, categoryId: undefined })}
            className={`${rowBase} ${!filters.categoryId ? activeClass : inactiveClass}`}
            style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onChange({ ...filters, categoryId: cat.id })}
              className={`${rowBase} ${filters.categoryId === cat.id ? activeClass : inactiveClass}`}
              style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </AccordionSection>

      {/* Price Range */}
      <AccordionSection title="Price Range">
        <PriceRangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          value={priceRange}
          onChange={([minP, maxP]) =>
            onChange({
              ...filters,
              minPrice: minP === PRICE_MIN ? undefined : minP,
              maxPrice: maxP === PRICE_MAX ? undefined : maxP,
            })
          }
        />
      </AccordionSection>

      {/* Rating */}
      <AccordionSection title="Rating" defaultOpen={false}>
        <div className="space-y-0.5">
          {[0, 1, 2, 3, 4].map((stars) => {
            const label = stars === 0 ? 'Any Rating' : `${5 - stars}+ Stars`;
            const val = stars === 0 ? undefined : 5 - stars;
            const isActive = (filters.minRating ?? 0) === (val ?? 0);
            return (
              <button
                key={stars}
                onClick={() => onChange({ ...filters, minRating: val })}
                className={`${rowBase} flex items-center gap-2 ${isActive ? activeClass : inactiveClass}`}
                style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
              >
                {val ? (
                  <>
                    <span className="flex">
                      {[...Array(val)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-[#C8703A] text-[#C8703A]" />
                      ))}
                    </span>
                    <span>{label}</span>
                  </>
                ) : (
                  label
                )}
              </button>
            );
          })}
        </div>
      </AccordionSection>

      {/* Quick Filters */}
      <AccordionSection title="Quick Filters" defaultOpen={false}>
        <div className="space-y-2">
          {[
            { key: 'inStock', label: 'In Stock Only', value: filters.inStock },
            { key: 'onSale', label: 'On Sale', value: filters.onSale },
            { key: 'isBestseller', label: 'Bestsellers', value: filters.isBestseller },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() =>
                onChange({ ...filters, [item.key]: item.value ? undefined : true })
              }
              className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] transition-all duration-150 border rounded-md ${
                item.value
                  ? 'bg-[#FDF8F4] text-[#1A1A18] border-[#C8703A] font-semibold'
                  : 'border-[#E5E2DD] text-[#6B6560] hover:border-[#C8703A]/50 hover:text-[#1A1A18]'
              }`}
              style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              <span>{item.label}</span>
              <div
                className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                  item.value ? 'bg-[#C8703A] border-[#C8703A]' : 'border-[#C8C0B8]'
                }`}
              >
                {item.value && (
                  <svg className="w-2 h-2 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </AccordionSection>
    </div>
  );
}

// ── Desktop Sidebar ──────────────────────────────────────────────────────────

export function FilterSidebar(props: FilterSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5" style={{ color: '#6B6560' }} />
            <span
              className="text-[10px] font-semibold tracking-[0.16em] uppercase"
              style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Filters
            </span>
          </div>
          {props.productCount !== undefined && (
            <span
              className="text-[11px]"
              style={{ color: '#C8C0B8', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              {props.productCount} items
            </span>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-[#E8E4DE] px-4 py-1 shadow-sm">
          <FilterSidebarContent {...props} hideSort />
        </div>
      </div>
    </aside>
  );
}

// ── Mobile Drawer ────────────────────────────────────────────────────────────

interface MobileFilterDrawerProps extends FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterDrawer({ isOpen, onClose, ...props }: MobileFilterDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 right-0 bottom-0 bg-white z-50 lg:hidden flex flex-col shadow-2xl rounded-t-2xl max-h-[88vh]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: '#E8E4DE' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DE]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" style={{ color: '#1A1A18' }} />
                <span
                  className="text-sm font-semibold tracking-wider uppercase"
                  style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                >
                  Filters & Sort
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F6F3EE] transition-colors"
              >
                <X className="h-4 w-4" style={{ color: '#1A1A18' }} />
              </button>
            </div>

            {/* Scrollable content — Sort is visible in mobile */}
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <FilterSidebarContent {...props} />
            </div>

            {/* Apply button */}
            <div className="px-5 py-4 border-t border-[#E8E4DE]">
              <button
                onClick={onClose}
                className="w-full py-3.5 text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: '#1A1A18',
                  color: '#F6F3EE',
                  fontFamily: 'var(--font-body, Jost, sans-serif)',
                  letterSpacing: '0.06em',
                  borderRadius: '0.5rem',
                }}
              >
                Show {props.productCount ?? ''} Products
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
