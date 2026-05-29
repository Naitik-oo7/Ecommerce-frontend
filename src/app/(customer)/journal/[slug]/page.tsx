'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetBlogPostBySlugQuery } from '@/services/api/blogApi';
import { useGetBlogPostsQuery } from '@/services/api/blogApi';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
      <div className="min-h-screen" style={{ background: '#F0ECE4' }}>
        <div className="max-w-[720px] mx-auto px-6 py-24 space-y-8">
          <div className="animate-pulse h-3 w-20 rounded-full" style={{ background: 'rgba(200,112,58,0.3)' }} />
          <div className="animate-pulse h-14 w-full rounded" style={{ background: 'rgba(26,26,24,0.1)' }} />
          <div className="animate-pulse h-6 w-2/3 rounded" style={{ background: 'rgba(26,26,24,0.1)' }} />
          <div className="animate-pulse h-[520px] w-full rounded" style={{ background: 'rgba(26,26,24,0.1)' }} />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse h-4 rounded" style={{ background: 'rgba(26,26,24,0.08)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0ECE4' }}>
        <div className="text-center">
          <p className="font-playfair text-8xl font-bold mb-4" style={{ color: '#1A1A18' }}>
            404
          </p>
          <p className="text-sm mb-8" style={{ color: '#6B6560', letterSpacing: '0.04em' }}>
            This article could not be found.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-60"
            style={{ color: '#C8703A', letterSpacing: '0.06em' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F0ECE4' }}>

      {/* ── Full-bleed hero image ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative h-[60vh] md:h-[75vh] overflow-hidden"
      >
        <Image src={post.image} alt={post.title} fill className="object-cover" />

        {/* gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(26,26,24,0.85) 0%, rgba(26,26,24,0.2) 50%, transparent 100%)' }}
        />

        {/* back button */}
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => router.back()}
          className="absolute top-8 left-8 z-10 flex items-center gap-2 text-white text-sm font-medium transition-opacity hover:opacity-70"
          style={{ letterSpacing: '0.06em' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </motion.button>

        {/* category + title over image */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-10 md:pb-16">
          <div className="max-w-[820px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30, clipPath: 'inset(100% 0 0 0)' }}
              animate={{ opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' }}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className="inline-block text-xs font-semibold tracking-[0.2em] uppercase mb-5"
                style={{ color: '#C8703A' }}
              >
                {post.category}
              </span>
              <h1
                className="font-playfair leading-[1.05] text-white"
                style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', fontWeight: 700 }}
              >
                {post.title}
              </h1>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Article body ── */}
      <div className="max-w-[720px] mx-auto px-6 md:px-0 py-14 md:py-20">

        {/* meta row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="flex flex-wrap items-center gap-8 pb-10 mb-10 text-sm"
          style={{ borderBottom: '1px solid rgba(26,26,24,0.12)', color: '#6B6560' }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: '#C8703A' }} />
            {formatDate(post.publishedAt)}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: '#C8703A' }} />
            {post.readTime}
          </div>
        </motion.div>

        {/* lead / excerpt — italic Playfair like hero's italic line */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="font-playfair text-xl md:text-2xl leading-relaxed mb-12"
          style={{
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#1A1A18',
            borderLeft: '3px solid #C8703A',
            paddingLeft: '1.5rem',
          }}
        >
          {post.excerpt}
        </motion.p>

        {/* body content */}
        {post.content && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7 }}
            className="space-y-6"
          >
            {post.content.split('\n').map((para, i) =>
              para.trim() ? (
                <p
                  key={i}
                  className="text-base md:text-[17px] leading-[1.85]"
                  style={{ color: '#3A3832' }}
                >
                  {para}
                </p>
              ) : null
            )}
          </motion.div>
        )}

        {/* footer row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-14 pt-10 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(26,26,24,0.12)' }}
        >
          <span
            className="text-xs font-semibold tracking-[0.2em] uppercase px-4 py-2"
            style={{ color: '#C8703A', border: '1px solid rgba(200,112,58,0.35)' }}
          >
            {post.category}
          </span>

          <Link
            href="/journal"
            className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-60"
            style={{ color: '#1A1A18', letterSpacing: '0.06em' }}
          >
            All Articles <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>

      {/* ── Related articles ── */}
      {relatedPosts.length > 0 && (
        <section className="py-20 md:py-28" style={{ background: '#1A1A18' }}>
          <div className="container-mono">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mb-12"
            >
              <span
                className="text-xs font-semibold tracking-[0.2em] uppercase mb-4 block"
                style={{ color: '#C8703A' }}
              >
                Continue Reading
              </span>
              <h2
                className="font-playfair"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 700, color: '#F0ECE4' }}
              >
                More from the Journal
              </h2>
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
