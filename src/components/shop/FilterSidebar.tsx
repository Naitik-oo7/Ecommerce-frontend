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
}

const PRICE_MIN = 0;
const PRICE_MAX = 50000;

const SORT_OPTIONS = [
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
        className="flex items-center justify-between w-full py-3 text-left group"
      >
        <span className="text-xs font-semibold text-[#111111] tracking-[0.1em] uppercase">
          {title}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#9B9B9B] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
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
            <div className="pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterSidebarContent({ filters, onChange }: FilterSidebarProps) {
  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const categories: { id: number; name: string }[] = Array.isArray(categoriesResponse)
    ? (categoriesResponse as { id: number; name: string }[])
    : ((categoriesResponse as { data?: { id: number; name: string }[] })?.data || []);

  const priceRange: [number, number] = [
    filters.minPrice ?? PRICE_MIN,
    filters.maxPrice ?? PRICE_MAX,
  ];

  return (
    <div className="space-y-0">
      {/* Sort */}
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
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all duration-150 border-l-2 ${
                  isActive
                    ? 'bg-[#F6F3EE] text-[#111111] font-semibold border-l-[#C7A27C]'
                    : 'text-[#6B6B6B] hover:bg-[#F6F3EE]/60 hover:text-[#111111] border-l-transparent'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </AccordionSection>

      {/* Category */}
      <AccordionSection title="Category">
        <div className="space-y-0.5">
          <button
            onClick={() => onChange({ ...filters, categoryId: undefined })}
            className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all duration-150 border-l-2 ${
              !filters.categoryId
                ? 'bg-[#F6F3EE] text-[#111111] font-semibold border-l-[#C7A27C]'
                : 'text-[#6B6B6B] hover:bg-[#F6F3EE]/60 hover:text-[#111111] border-l-transparent'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onChange({ ...filters, categoryId: cat.id })}
              className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all duration-150 border-l-2 ${
                filters.categoryId === cat.id
                  ? 'bg-[#F6F3EE] text-[#111111] font-semibold border-l-[#C7A27C]'
                  : 'text-[#6B6B6B] hover:bg-[#F6F3EE]/60 hover:text-[#111111] border-l-transparent'
              }`}
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

      {/* Min Rating */}
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
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all duration-150 flex items-center gap-2 border-l-2 ${
                  isActive
                    ? 'bg-[#F6F3EE] text-[#111111] font-semibold border-l-[#C7A27C]'
                    : 'text-[#6B6B6B] hover:bg-[#F6F3EE]/60 hover:text-[#111111] border-l-transparent'
                }`}
              >
                {val ? (
                  <>
                    <span className="flex">
                      {[...Array(val)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-[#C7A27C] text-[#C7A27C]"
                        />
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

      {/* Quick Toggles */}
      <AccordionSection title="Quick Filters" defaultOpen={false}>
        <div className="space-y-1.5">
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-150 border ${
                item.value
                  ? 'bg-[#F6F3EE] text-[#111111] border-[#C7A27C] font-semibold'
                  : 'border-[#E5E2DD] text-[#6B6B6B] hover:border-[#C7A27C]/60 hover:text-[#111111]'
              }`}
            >
              <span>{item.label}</span>
              <div
                className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                  item.value ? 'bg-[#C7A27C] border-[#C7A27C]' : 'border-[#C8C8C8]'
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
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B6B6B]" />
            <h2 className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-[0.12em]">Filters</h2>
          </div>
          {props.productCount !== undefined && (
            <span className="text-[11px] text-[#9B9B9B]">{props.productCount} items</span>
          )}
        </div>
        <div className="bg-white rounded-xl border border-[#E5E2DD] px-4 py-2 shadow-sm">
          <FilterSidebarContent {...props} />
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
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 right-0 bottom-0 bg-white z-50 lg:hidden flex flex-col shadow-2xl rounded-t-2xl max-h-[85vh]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[#E5E2DD] rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E2DD]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#111111]" />
                <h2 className="text-sm font-semibold text-[#111111] uppercase tracking-wider">Filters</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F6F3EE] transition-colors"
              >
                <X className="h-4 w-4 text-[#111111]" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <FilterSidebarContent {...props} />
            </div>

            {/* Apply button */}
            <div className="px-5 py-4 border-t border-[#E5E2DD]">
              <button
                onClick={onClose}
                className="w-full bg-[#111111] text-white py-3 rounded-full font-medium text-sm hover:bg-[#1a1a1a] transition-colors"
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
