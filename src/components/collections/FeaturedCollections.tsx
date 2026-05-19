'use client';

import { motion } from 'framer-motion';
import { CollectionCard } from './CollectionCard';

const collections = [
  {
    title: 'Urban Essentials',
    subtitle: 'City Ready',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    href: '/products?category=streetwear',
  },
  {
    title: 'Minimal Workspace',
    subtitle: 'Work From Home',
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80',
    href: '/products?category=lifestyle',
  },
  {
    title: 'Summer Linen',
    subtitle: 'Breathe Easy',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    href: '/products?category=linen',
  },
  {
    title: 'Performance Wear',
    subtitle: 'Active Living',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
    href: '/products?category=activewear',
  },
];

export const FeaturedCollections = () => {
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
