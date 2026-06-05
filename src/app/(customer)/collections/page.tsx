'use client';

import { motion } from 'framer-motion';
import { useGetCategoryTreeQuery, type CategoryTreeItem } from '@/services/api/categoriesApi';
import { CollectionCard } from '@/components/collections/CollectionCard';

// Fallback imagery for categories that have no imageUrl set.
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80';

export default function CollectionsPage() {
  const { data, isLoading } = useGetCategoryTreeQuery();
  const categories: CategoryTreeItem[] = Array.isArray(data) ? data : [];

  return (
    <div className="min-h-screen" style={{ background: '#F6F3EE' }}>
      {/* ── Hero ── */}
      <section className="py-20 md:py-28" style={{ background: '#1A1A18' }}>
        <div className="container-mono text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-4 block"
              style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Shop by Category
            </span>
            <h1
              className="text-white leading-[1.05] mb-6"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                fontWeight: 700,
              }}
            >
              Our Collections
            </h1>
            <p
              className="text-lg max-w-md mx-auto"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Explore curated edits across every corner of the MONO wardrobe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="py-16 md:py-24">
        <div className="container-mono">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-2xl animate-pulse"
                  style={{ background: '#E2D9CE' }}
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p
              className="text-center text-sm py-16"
              style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              No collections available yet. Check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((category, i) => (
                <CollectionCard
                  key={category.id}
                  index={i}
                  title={category.name}
                  subtitle={category.name.toUpperCase()}
                  image={category.imageUrl || FALLBACK_IMAGE}
                  href={`/products?categoryId=${category.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
