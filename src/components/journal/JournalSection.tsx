'use client';

import { motion } from 'framer-motion';
import { JournalCard } from './JournalCard';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const articles = [
  {
    title: 'The Future of Minimal Fashion',
    category: 'Trends',
    excerpt:
      'Exploring how sustainable practices and timeless design are reshaping the fashion industry for the better.',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    date: 'Jan 15, 2026',
    readTime: '5 min read',
    href: '/journal/future-of-minimal-fashion',
    featured: true,
  },
  {
    title: 'Building a Timeless Wardrobe',
    category: 'Style Guide',
    excerpt: 'Essential pieces every modern wardrobe needs for effortless sophistication.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80',
    date: 'Jan 10, 2026',
    readTime: '4 min read',
    href: '/journal/timeless-wardrobe',
    featured: false,
  },
  {
    title: 'Behind The Fabric',
    category: 'Sustainability',
    excerpt: 'Our journey to source the finest sustainable materials from around the world.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    date: 'Jan 5, 2026',
    readTime: '6 min read',
    href: '/journal/behind-the-fabric',
    featured: false,
  },
  {
    title: 'Seasonal Palette: Warm Neutrals',
    category: 'Style Guide',
    excerpt: 'How to style our new collection of earth tones and timeless hues.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    date: 'Dec 28, 2025',
    readTime: '3 min read',
    href: '/journal/seasonal-palette',
    featured: false,
  },
];

const featuredArticle = articles.find((a) => a.featured)!;
const secondaryArticles = articles.filter((a) => !a.featured);

export const JournalSection = () => {
  return (
    <section className="py-20 md:py-32 bg-mono-cream">
      <div className="container-mono">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16"
        >
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-mono-terracotta mb-4 block">
              The Journal
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-mono-charcoal leading-[1.1]">
              Stories & Insights
            </h2>
          </div>

          <Link href="/journal">
            <motion.span
              className="inline-flex items-center gap-2 text-mono-charcoal font-medium hover:text-mono-terracotta transition-colors cursor-pointer group"
              whileHover={{ x: 5 }}
            >
              View All Articles
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </motion.span>
          </Link>
        </motion.div>

        {/* Editorial Grid: featured left, compact list right */}
        <div className="grid md:grid-cols-[1fr_420px] lg:grid-cols-[1fr_460px] gap-10 md:gap-14 lg:gap-20 items-start">
          {/* Featured — left column */}
          <JournalCard {...featuredArticle} index={0} />

          {/* Secondary articles — right column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
            className="flex flex-col"
          >
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-mono-terracotta mb-6">
              Latest
            </p>
            <div className="flex flex-col divide-y divide-[#E2D9CE]">
              {secondaryArticles.map((article, index) => (
                <div key={article.title} className="py-6 first:pt-0 last:pb-0">
                  <JournalCard
                    {...article}
                    index={index}
                    compact
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default JournalSection;