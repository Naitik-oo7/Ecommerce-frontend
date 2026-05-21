'use client';

import { motion } from 'framer-motion';
import { CollectionCard } from './CollectionCard';
import { useGetCategoriesQuery } from '@/services/api/categoriesApi';

interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
}

export const FeaturedCollections = () => {
  const { data: categoriesResponse, isLoading, error } = useGetCategoriesQuery({
    isFeatured: 'true',
    includeInactive: 'false',
    limit: 8,
  });

  // Extract categories array from response - handle both paginated and non-paginated formats
  const categories: Category[] = categoriesResponse?.data || categoriesResponse || [];

  // Map categories to collection format
  const collections = categories.map((category) => ({
    title: category.name,
    subtitle: category.parent?.name || 'Explore',
    image: category.imageUrl || 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    href: `/products?category=${category.slug}`,
  }));

  if (isLoading) {
    return (
      <section className="py-20 md:py-32 bg-[#F6F3EE]">
        <div className="container-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || collections.length === 0) {
    return null;
  }

  return (
    <section className="py-20 md:py-32 bg-[#F6F3EE]">
      <div className="container-mono">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="mb-12 md:mb-16"
        >
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-4 block">
            Curated For You
          </span>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#111111] leading-[1.1] max-w-2xl">
              Featured Collections
            </h2>
            <p className="text-[#6B6B6B] max-w-md md:text-right">
              Discover our carefully curated collections designed for modern living and timeless style.
            </p>
          </div>
        </motion.div>

        {/* Collection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {collections.map((collection, index) => (
            <CollectionCard
              key={collection.title}
              {...collection}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
