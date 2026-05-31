'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useGetCategoriesQuery } from '@/services/api/categoriesApi';

interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  parent?: { name: string };
}

interface CollectionItem {
  title: string;
  subtitle: string;
  image: string;
  href: string;
}

// ─── Card positions in the 3-col layout ───────────────────────────────────────
// pos 0 → left tall   (col 1, row 1–2)
// pos 1 → mid top     (col 2, row 1)
// pos 2 → mid bottom  (col 2, row 2)
// pos 3 → right tall  (col 3, row 1–2)

const GRID_STYLES: React.CSSProperties[] = [
  { gridColumn: '1', gridRow: '1 / 3' },   // left tall
  { gridColumn: '2', gridRow: '1' },        // mid top
  { gridColumn: '2', gridRow: '2' },        // mid bottom
  { gridColumn: '3', gridRow: '1 / 3' },   // right tall
];

// ─── Single collection card ────────────────────────────────────────────────────
const CollectionCard = ({
  title,
  subtitle,
  image,
  href,
  index,
}: CollectionItem & { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1], delay: index * 0.09 }}
    style={GRID_STYLES[index] ?? {}}
    className="relative overflow-hidden rounded-2xl cursor-pointer group"
  >
    <Link href={href} className="block w-full h-full">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
      </div>

      {/* Dark gradient — bottom-heavy */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.22) 45%, transparent 100%)',
        }}
      />

      {/* Text content — pinned to bottom-left */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        {/* Category label */}
        <p
          className="mb-1.5 font-semibold tracking-[0.14em] uppercase"
          style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.70)',
            fontFamily: 'var(--font-body, Jost, sans-serif)',
          }}
        >
          {subtitle}
        </p>

        {/* Title */}
        <p
          className="font-semibold leading-tight mb-3 text-white"
          style={{
            fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
            fontSize: 'clamp(1.15rem, 2vw, 1.55rem)',
          }}
        >
          {title}
        </p>

        {/* CTA */}
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide transition-all duration-300 group-hover:gap-3"
          style={{
            color: 'rgba(255,255,255,0.88)',
            fontFamily: 'var(--font-body, Jost, sans-serif)',
          }}
        >
          Explore Collection <ArrowRight className="h-3 w-3 flex-shrink-0" />
        </span>
      </div>
    </Link>
  </motion.div>
);

// ─── Loading skeleton ──────────────────────────────────────────────────────────
const Skeleton = ({ style }: { style: React.CSSProperties }) => (
  <div
    className="animate-pulse rounded-2xl"
    style={{ ...style, background: '#E8E0D4', minHeight: '260px' }}
  />
);

// ─── Static fallback data ──────────────────────────────────────────────────────
const STATIC_COLLECTIONS: (CollectionItem & { subtitle: string })[] = [
  {
    title: 'Accessories',
    subtitle: 'ACCESSORIES',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    href: '/products?category=accessories',
  },
  {
    title: "Men's Accessories",
    subtitle: "MEN'S ACCESSORIES",
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80',
    href: '/products?category=mens-accessories',
  },
  {
    title: 'Electronics',
    subtitle: 'ELECTRONICS',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    href: '/products?category=electronics',
  },
  {
    title: "Men's Clothing",
    subtitle: "MEN'S FASHION",
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80',
    href: '/products?category=mens-clothing',
  },
];

// ─── Grid renderer ─────────────────────────────────────────────────────────────
const CollectionsGrid = ({ collections }: { collections: (CollectionItem & { subtitle: string })[] }) => (
  <div
    className="grid gap-3"
    style={{
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'clamp(180px, 22vw, 290px) clamp(180px, 22vw, 290px)',
    }}
  >
    {collections.slice(0, 4).map((col, i) => (
      <CollectionCard key={col.title} {...col} index={i} />
    ))}
  </div>
);

const SkeletonGrid = () => (
  <div
    className="grid gap-3"
    style={{
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'clamp(180px, 22vw, 290px) clamp(180px, 22vw, 290px)',
    }}
  >
    {GRID_STYLES.map((style, i) => (
      <Skeleton key={i} style={style} />
    ))}
  </div>
);

// ─── Main export ───────────────────────────────────────────────────────────────
export const FeaturedCollections = () => {
  const { data: categoriesResponse, isLoading, error } = useGetCategoriesQuery({
    isFeatured: 'true',
    includeInactive: 'false',
    limit: 8,
  });

  const categories: Category[] = categoriesResponse?.data || categoriesResponse || [];

  const collections = categories.map((cat) => ({
    title: cat.name,
    subtitle: (cat.parent?.name || cat.name).toUpperCase(),
    image:
      cat.imageUrl ||
      'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    href: `/products?category=${cat.slug}`,
  }));

  return (
    <section className="py-10 md:py-14" style={{ background: '#F8F5F0' }}>
      <div className="max-w-[1320px] mx-auto px-6 md:px-12 xl:px-20">

        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
        >
          {/* Left — eyebrow + heading */}
          <div>
            <span
              className="text-xs font-semibold tracking-[0.22em] uppercase mb-4 block"
              style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Curated For You
            </span>

            <h2
              className="leading-[1.05]"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                color: '#1A1A18',
              }}
            >
              {/* "Featured" — upright weight */}
              <span className="font-bold block">Featured</span>
              {/* "Collections" — italic */}
              <span className="font-semibold italic block">Collections</span>
            </h2>
          </div>

          {/* Right — description + view all */}
          <div className="flex flex-col items-start md:items-end gap-3 md:pt-8 max-w-xs md:max-w-sm">
            <p
              className="text-sm leading-relaxed md:text-right"
              style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Discover our carefully curated collections designed for modern living and timeless style.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-300 hover:gap-3 hover:opacity-70"
              style={{
                color: '#1A1A18',
                fontFamily: 'var(--font-body, Jost, sans-serif)',
                letterSpacing: '0.04em',
              }}
            >
              View All Collections <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>

        {/* ── Grid ── */}
        {isLoading ? (
          <SkeletonGrid />
        ) : error || collections.length === 0 ? (
          <CollectionsGrid collections={STATIC_COLLECTIONS} />
        ) : (
          <CollectionsGrid collections={collections} />
        )}
      </div>
    </section>
  );
};

export default FeaturedCollections;