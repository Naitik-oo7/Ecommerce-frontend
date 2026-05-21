'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetBlogPostBySlugQuery } from '@/services/api/blogApi';
import { useGetBlogPostsQuery } from '@/services/api/blogApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';
import { JournalCard } from '@/components/journal/JournalCard';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const formatDateShort = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function JournalArticlePage() {
  const { slug } = useParams();
  const router = useRouter();

  const { data: post, isLoading, error } = useGetBlogPostBySlugQuery(slug as string);
  const { data: relatedData } = useGetBlogPostsQuery({ limit: 4 });

  const relatedPosts = (relatedData?.data || [])
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F3EE]">
        <div className="container-mono py-20">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="animate-pulse h-8 w-32 bg-gray-200 rounded-full" />
            <div className="animate-pulse h-12 w-full bg-gray-200 rounded-xl" />
            <div className="animate-pulse h-6 w-2/3 bg-gray-200 rounded-xl" />
            <div className="animate-pulse h-[480px] w-full bg-gray-200 rounded-2xl" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse h-4 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl font-bold text-[#111111] mb-4">404</p>
          <p className="text-[#6B6B6B] mb-8">Article not found.</p>
          <Link href="/" className="text-[#C7A27C] font-medium hover:text-[#111111] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[50vh] md:h-[65vh] overflow-hidden"
      >
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/70 via-[#111111]/20 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-6 z-10">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </motion.button>
        </div>

        {/* Hero title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="container-mono max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              <span className="inline-block px-3 py-1 bg-[#C7A27C] text-white text-xs font-semibold tracking-widest uppercase rounded-full mb-4">
                {post.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                {post.title}
              </h1>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Article Body */}
      <div className="container-mono max-w-3xl py-12 md:py-16">
        {/* Meta Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-wrap items-center gap-6 text-sm text-[#6B6B6B] pb-8 mb-8 border-b border-[#E2D9CE]"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#C7A27C]" />
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#C7A27C]" />
            <span>{post.readTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#C7A27C]" />
            <span>{post.category}</span>
          </div>
        </motion.div>

        {/* Excerpt (lead paragraph) */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-xl md:text-2xl text-[#444444] leading-relaxed font-light mb-10 border-l-4 border-[#C7A27C] pl-6"
        >
          {post.excerpt}
        </motion.p>

        {/* Full Content */}
        {post.content && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="prose prose-lg max-w-none text-[#444444] leading-relaxed space-y-6"
          >
            {post.content.split('\n').map((para, i) =>
              para.trim() ? (
                <p key={i} className="text-base md:text-lg leading-relaxed text-[#444444]">
                  {para}
                </p>
              ) : null
            )}
          </motion.div>
        )}

        {/* Tags / Category Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 pt-8 border-t border-[#E2D9CE] flex items-center justify-between"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium text-[#111111] shadow-sm">
            <Tag className="h-3.5 w-3.5 text-[#C7A27C]" />
            {post.category}
          </span>
          <Link href="/" className="text-sm text-[#C7A27C] hover:text-[#111111] transition-colors font-medium">
            ← Back to Home
          </Link>
        </motion.div>
      </div>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="container-mono">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mb-10"
            >
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-3 block">
                Continue Reading
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">More Articles</h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((p, index) => (
                <JournalCard
                  key={p.id}
                  title={p.title}
                  category={p.category}
                  excerpt={p.excerpt}
                  image={p.image}
                  date={formatDateShort(p.publishedAt)}
                  readTime={p.readTime}
                  href={`/journal/${p.slug}`}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
