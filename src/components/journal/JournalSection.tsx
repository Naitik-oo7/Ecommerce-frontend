'use client';

import { motion } from 'framer-motion';
import { JournalCard } from './JournalCard';
import { useGetBlogPostsQuery } from '@/services/api/blogApi';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const JournalSection = () => {
  const { data: postsData, isLoading } = useGetBlogPostsQuery({ limit: 4 });
  const posts = postsData?.data || [];

  const featuredPost = posts.find((p) => p.isFeatured) || posts[0];
  const secondaryPosts = posts.filter((p) => p !== featuredPost);

  if (isLoading) {
    return (
      <section className="py-20 md:py-32 bg-mono-cream">
        <div className="container-mono">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
            <div className="space-y-3">
              <div className="animate-pulse bg-gray-200 rounded h-3 w-24" />
              <div className="animate-pulse bg-gray-200 rounded h-12 w-72" />
              <div className="animate-pulse bg-gray-200 rounded h-4 w-80" />
            </div>
            <div className="animate-pulse bg-gray-200 rounded h-4 w-32" />
          </div>
          {/* Grid skeleton */}
          <div className="grid md:grid-cols-[1fr_420px] lg:grid-cols-[1fr_460px] gap-10 md:gap-14 lg:gap-20">
            <div className="animate-pulse bg-gray-200 rounded-2xl h-96" />
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-24" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredPost) return null;

  const toCardProps = (p: (typeof posts)[0]) => ({
    title: p.title,
    category: p.category,
    excerpt: p.excerpt,
    image: p.image,
    date: formatDate(p.publishedAt),
    readTime: p.readTime,
    href: `/journal/${p.slug}`,
  });

  const featuredArticle = toCardProps(featuredPost);
  const secondaryArticles = secondaryPosts.map(toCardProps);

  return (
    <section className="py-20 md:py-32 bg-mono-cream">
      <div className="container-mono">

        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16"
        >
          {/* Left: label + title + subtitle */}
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-mono-terracotta mb-4 block">
              The Journal
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-mono-charcoal leading-[1.1] mb-3">
              Stories &amp; Insights
            </h2>
            <p className="text-sm text-mono-warm-gray leading-relaxed max-w-xs">
              Thoughtful perspectives on style, sustainability,
              <br className="hidden md:block" /> and the craft behind every collection.
            </p>
          </div>

          {/* Right: View All link */}
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

        {/* ── Editorial Grid: featured left, compact list right ── */}
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