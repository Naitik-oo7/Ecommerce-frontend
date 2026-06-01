'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  X,
  Star,
  SlidersHorizontal,
  Check,
  Sparkles,
  Leaf,
  Award,
  PackageCheck,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────

export interface ShopFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isSustainable?: boolean;
  gender?: string;
  sizes?: string[];
  materials?: string[];
  tags?: string[];
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterMeta {
  categories?: { id: number; name: string; slug?: string; count: number }[];
  materials?: { name: string; count: number }[];
  sizes?: { size: string; count: number }[];
  genders?: { gender: string; count: number }[];
  tags?: { name: string; type?: string; count: number }[];
  priceRange?: { min: number; max: number };
}

interface FilterSidebarProps {
  filters: ShopFilters;
  onChange: (filters: ShopFilters) => void;
  meta?: FilterMeta;
  productCount?: number;
  hideSort?: boolean;
}

// Sorts the backend actually supports (name, price, createdAt, avgRating).
export const SORT_OPTIONS = [
  { label: 'Featured', value: 'relevance', order: 'desc' as const },
  { label: 'Newest Arrivals', value: 'createdAt', order: 'desc' as const },
  { label: 'Price: Low to High', value: 'price', order: 'asc' as const },
  { label: 'Price: High to Low', value: 'price', order: 'desc' as const },
  { label: 'Top Rated', value: 'avgRating', order: 'desc' as const },
  { label: 'Name: A–Z', value: 'name', order: 'asc' as const },
];

const GENDER_LABELS: Record<string, string> = { men: 'Men', women: 'Women', unisex: 'Unisex' };

// Tag names already surfaced as dedicated highlight toggles — excluded from the generic Tags facet.
const RESERVED_TAGS = new Set(['bestseller', 'new-arrival', 'new arrival', 'newarrival']);

// ── Count how many facets are active ──────────────────────────────────────

export function countActiveFilters(f: ShopFilters): number {
  let n = 0;
  if (f.inStock) n++;
  if (f.isBestseller) n++;
  if (f.isNewArrival) n++;
  if (f.isSustainable) n++;
  if (f.gender) n++;
  if (f.minRating) n++;
  n += f.sizes?.length ?? 0;
  n += f.materials?.length ?? 0;
  n += f.tags?.length ?? 0;
  return n;
}

// ── Accordion shell ───────────────────────────────────────────────────────

function Section({
  title,
  count,
  onClear,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  onClear?: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#ECE7E0] last:border-0">
      <div className="flex items-center justify-between py-3.5">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mono-charcoal"
            style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
          >
            {title}
          </span>
          {!!count && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-mono-terracotta px-1 text-[9px] font-bold text-white">
              {count}
            </span>
          )}
          <ChevronDown
            className={`ml-auto h-3.5 w-3.5 text-[#C8C0B8] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4">
              {children}
              {!!count && onClear && (
                <button
                  onClick={onClear}
                  className="mt-2.5 text-[11px] font-medium text-mono-stone underline-offset-2 hover:text-mono-terracotta hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Reusable controls ─────────────────────────────────────────────────────

function ToggleRow({
  label,
  icon: Icon,
  checked,
  onToggle,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={checked}
      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] transition-all duration-150 ${
        checked
          ? 'border-mono-terracotta bg-[#FDF7F2] font-semibold text-mono-charcoal'
          : 'border-[#ECE7E0] text-mono-stone hover:border-[#D8CFC4] hover:text-mono-charcoal'
      }`}
      style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
    >
      <Icon className={`h-4 w-4 shrink-0 ${checked ? 'text-mono-terracotta' : 'text-[#B6AEA4]'}`} />
      <span className="flex-1 text-left">{label}</span>
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          checked ? 'border-mono-terracotta bg-mono-terracotta' : 'border-[#CFC7BD]'
        }`}
      >
        {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
      </span>
    </button>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={checked}
      className="group flex w-full items-center gap-2.5 py-1.5 text-left"
      style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border-2 transition-colors ${
          checked ? 'border-mono-terracotta bg-mono-terracotta' : 'border-[#CFC7BD] group-hover:border-mono-stone'
        }`}
      >
        {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
      </span>
      <span
        className={`flex-1 text-[13px] capitalize transition-colors ${
          checked ? 'font-semibold text-mono-charcoal' : 'text-mono-stone group-hover:text-mono-charcoal'
        }`}
      >
        {label}
      </span>
      {count !== undefined && <span className="text-[11px] tabular-nums text-[#C2BAB0]">{count}</span>}
    </button>
  );
}

// ── Sidebar content ───────────────────────────────────────────────────────

function FilterSidebarContent({ filters, onChange, meta, hideSort }: FilterSidebarProps) {
  const sizes = meta?.sizes ?? [];
  const materials = meta?.materials ?? [];
  const genders = (meta?.genders ?? []).filter((g) => g.gender);
  const tags = (meta?.tags ?? []).filter(
    (t) => t.name && !RESERVED_TAGS.has(t.name.toLowerCase()) && t.type !== 'sustainability'
  );

  const toggleArray = (key: 'sizes' | 'materials' | 'tags', value: string) => {
    const current = filters[key] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next.length ? next : undefined });
  };

  const sortIndex = SORT_OPTIONS.findIndex(
    (o) =>
      (o.value === 'relevance' && !filters.sortBy) ||
      (o.value === filters.sortBy && o.order === filters.sortOrder)
  );

  return (
    <div>
      {/* Sort — only rendered inside the mobile drawer */}
      {!hideSort && (
        <Section title="Sort By">
          <div className="grid grid-cols-2 gap-1.5">
            {SORT_OPTIONS.map((opt, i) => {
              const active = i === sortIndex || (sortIndex === -1 && opt.value === 'relevance');
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
                  className={`rounded-lg border px-2.5 py-2 text-[12px] transition-colors ${
                    active
                      ? 'border-mono-charcoal bg-mono-charcoal text-white'
                      : 'border-[#ECE7E0] text-mono-stone hover:border-[#D8CFC4]'
                  }`}
                  style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Highlights */}
      <Section title="Highlights" defaultOpen={false}>
        <div className="space-y-2">
          <ToggleRow
            label="In Stock Only"
            icon={PackageCheck}
            checked={!!filters.inStock}
            onToggle={() => onChange({ ...filters, inStock: filters.inStock ? undefined : true })}
          />
          <ToggleRow
            label="New Arrivals"
            icon={Sparkles}
            checked={!!filters.isNewArrival}
            onToggle={() => onChange({ ...filters, isNewArrival: filters.isNewArrival ? undefined : true })}
          />
          <ToggleRow
            label="Bestsellers"
            icon={Award}
            checked={!!filters.isBestseller}
            onToggle={() => onChange({ ...filters, isBestseller: filters.isBestseller ? undefined : true })}
          />
          <ToggleRow
            label="Sustainable"
            icon={Leaf}
            checked={!!filters.isSustainable}
            onToggle={() => onChange({ ...filters, isSustainable: filters.isSustainable ? undefined : true })}
          />
        </div>
      </Section>

      {/* Size */}
      {sizes.length > 0 && (
        <Section
          title="Size"
          count={filters.sizes?.length ?? 0}
          onClear={() => onChange({ ...filters, sizes: undefined })}
          defaultOpen={false}
        >
          <div className="flex flex-wrap gap-2">
            {sizes.map(({ size, count }) => {
              const active = filters.sizes?.includes(size) ?? false;
              return (
                <button
                  key={size}
                  onClick={() => toggleArray('sizes', size)}
                  disabled={count === 0}
                  className={`flex h-9 min-w-[44px] items-center justify-center rounded-lg border-2 px-2.5 text-[13px] font-medium uppercase transition-all duration-150 ${
                    active
                      ? 'border-mono-charcoal bg-mono-charcoal text-white'
                      : count === 0
                        ? 'cursor-not-allowed border-[#F0ECE6] text-[#D4CCC2]'
                        : 'border-[#ECE7E0] text-mono-charcoal hover:border-mono-charcoal'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Material */}
      {materials.length > 0 && (
        <Section
          title="Material"
          count={filters.materials?.length ?? 0}
          onClear={() => onChange({ ...filters, materials: undefined })}
          defaultOpen={false}
        >
          <div className="space-y-0.5">
            {materials.map(({ name, count }) => (
              <CheckRow
                key={name}
                label={name}
                count={count}
                checked={filters.materials?.includes(name) ?? false}
                onToggle={() => toggleArray('materials', name)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Gender */}
      {genders.length > 1 && (
        <Section
          title="Gender"
          count={filters.gender ? 1 : 0}
          onClear={() => onChange({ ...filters, gender: undefined })}
          defaultOpen={false}
        >
          <div className="grid grid-cols-3 gap-1.5">
            {genders.map(({ gender }) => {
              const active = filters.gender === gender;
              return (
                <button
                  key={gender}
                  onClick={() => onChange({ ...filters, gender: active ? undefined : gender })}
                  className={`rounded-lg border py-2 text-[12px] font-medium capitalize transition-colors ${
                    active
                      ? 'border-mono-charcoal bg-mono-charcoal text-white'
                      : 'border-[#ECE7E0] text-mono-stone hover:border-[#D8CFC4]'
                  }`}
                  style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                >
                  {GENDER_LABELS[gender] ?? gender}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Rating */}
      <Section
        title="Rating"
        count={filters.minRating ? 1 : 0}
        onClear={() => onChange({ ...filters, minRating: undefined })}
        defaultOpen={false}
      >
        <div className="space-y-0.5">
          {[4, 3, 2, 1].map((stars) => {
            const active = filters.minRating === stars;
            return (
              <button
                key={stars}
                onClick={() => onChange({ ...filters, minRating: active ? undefined : stars })}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                  active ? 'bg-[#FDF7F2]' : 'hover:bg-[#F6F3EE]'
                }`}
              >
                <span className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${
                        s <= stars ? 'fill-mono-terracotta text-mono-terracotta' : 'fill-[#E8E2DA] text-[#E8E2DA]'
                      }`}
                    />
                  ))}
                </span>
                <span
                  className={`text-[12px] ${active ? 'font-semibold text-mono-charcoal' : 'text-mono-stone'}`}
                  style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                >
                  &amp; up
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Tags */}
      {tags.length > 0 && (
        <Section
          title="Tags"
          count={filters.tags?.length ?? 0}
          onClear={() => onChange({ ...filters, tags: undefined })}
          defaultOpen={false}
        >
          <div className="flex flex-wrap gap-1.5">
            {tags.map(({ name, count }) => {
              const active = filters.tags?.includes(name) ?? false;
              return (
                <button
                  key={name}
                  onClick={() => toggleArray('tags', name)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                    active
                      ? 'border-mono-charcoal bg-mono-charcoal text-white'
                      : 'border-[#ECE7E0] text-mono-stone hover:border-[#D8CFC4]'
                  }`}
                  style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                >
                  {name}
                  <span className={`ml-1 ${active ? 'text-white/60' : 'text-[#C2BAB0]'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Desktop sidebar ───────────────────────────────────────────────────────

export function FilterSidebar(props: FilterSidebarProps) {
  const active = countActiveFilters(props.filters);
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-24">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-mono-stone" />
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mono-stone"
              style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Refine
            </span>
            {active > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-mono-terracotta px-1 text-[9px] font-bold text-white">
                {active}
              </span>
            )}
          </div>
          {active > 0 && (
            <button
              onClick={() => props.onChange({ sortBy: props.filters.sortBy, sortOrder: props.filters.sortOrder })}
              className="text-[11px] font-medium text-mono-stone hover:text-mono-terracotta"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl border border-[#ECE7E0] bg-white px-4 py-1 shadow-sm scrollbar-hide">
          <FilterSidebarContent {...props} hideSort />
        </div>
      </div>
    </aside>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────────────

interface MobileFilterDrawerProps extends FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterDrawer({ isOpen, onClose, ...props }: MobileFilterDrawerProps) {
  const active = countActiveFilters(props.filters);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-mono-charcoal/45 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-3xl bg-white shadow-2xl lg:hidden"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-[#E8E2DA]" />
            </div>
            <div className="flex items-center justify-between border-b border-[#ECE7E0] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-mono-charcoal" />
                <span
                  className="text-sm font-semibold uppercase tracking-wider text-mono-charcoal"
                  style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                >
                  Filters & Sort
                </span>
                {active > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-mono-terracotta px-1.5 text-[10px] font-bold text-white">
                    {active}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F6F3EE]"
              >
                <X className="h-4 w-4 text-mono-charcoal" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-1">
              <FilterSidebarContent {...props} />
            </div>

            <div className="flex items-center gap-3 border-t border-[#ECE7E0] px-5 py-3.5">
              {active > 0 && (
                <button
                  onClick={() =>
                    props.onChange({ sortBy: props.filters.sortBy, sortOrder: props.filters.sortOrder })
                  }
                  className="h-12 shrink-0 rounded-full border border-[#E5E2DD] px-5 text-sm font-medium text-mono-charcoal"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                className="h-12 flex-1 rounded-full bg-mono-charcoal text-sm font-semibold tracking-wide text-white transition-opacity hover:opacity-90"
                style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
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
