'use client';

import { useState, useMemo } from 'react';
import { useGetBlogPostsQuery } from '@/services/api/blogApi';
import { Search, BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { JournalCard } from '@/components/journal/JournalCard';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const CATEGORIES = ['All', 'Fashion', 'Lifestyle', 'Sustainability', 'Trends', 'Styling'];

export default function JournalPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data: postsResponse, isLoading } = useGetBlogPostsQuery({
    page,
    limit: 9,
    category: category || undefined,
  });

  const pagination = postsResponse
    ? { total: postsResponse.total, totalPages: postsResponse.totalPages }
    : undefined;

  const filteredPosts = useMemo(() => {
    const posts = postsResponse?.data || [];
    if (!search) return posts;
    const term = search.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(term) ||
        post.excerpt.toLowerCase().includes(term) ||
        post.category.toLowerCase().includes(term)
    );
  }, [postsResponse, search]);

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
              The Journal
            </span>
            <h1
              className="leading-[1.05] text-white mb-6"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                fontWeight: 700,
              }}
            >
              Stories &amp; Insights
              <br />
              <em className="font-normal italic" style={{ color: 'rgba(255,255,255,0.4)' }}>
                for the conscious wardrobe.
              </em>
            </h1>
            <p
              className="text-lg max-w-md mx-auto"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Style, sustainability, and the craft behind every collection.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Sticky Filter Bar ── */}
      <div
        className="sticky z-20 border-b"
        style={{
          top: '3.5rem',
          background: 'rgba(246,243,238,0.96)',
          backdropFilter: 'blur(8px)',
          borderColor: '#E2D9CE',
        }}
      >
        <div className="container-mono py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
            {CATEGORIES.map((cat) => {
              const isActive = cat === 'All' ? !category : category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat === 'All' ? '' : cat); setPage(1); }}
                  className="flex-shrink-0 px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-body, Jost, sans-serif)',
                    letterSpacing: '0.04em',
                    background: isActive ? '#1A1A18' : 'transparent',
                    color: isActive ? '#F6F3EE' : '#6B6560',
                    border: `1px solid ${isActive ? '#1A1A18' : '#C8C0B8'}`,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex-shrink-0 w-full sm:w-52">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
              style={{ color: '#9B9B9B' }}
            />
            <input
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-8 py-2 text-xs rounded-full focus:outline-none transition-all"
              style={{
                background: '#EDE9E3',
                color: '#1A1A18',
                fontFamily: 'var(--font-body, Jost, sans-serif)',
                border: '1px solid #DDD8D0',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#9B9B9B' }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Articles ── */}
      <div className="container-mono py-12 md:py-16">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-14">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] rounded-2xl mb-5" style={{ background: '#E2D9CE' }} />
                <div className="space-y-3">
                  <div className="h-3 rounded w-16" style={{ background: '#E2D9CE' }} />
                  <div className="h-6 rounded w-3/4" style={{ background: '#E2D9CE' }} />
                  <div className="h-4 rounded w-full" style={{ background: '#E2D9CE' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: '#C8C0B8' }} />
            <h3
              className="text-xl font-semibold mb-2"
              style={{
                color: '#1A1A18',
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              }}
            >
              No articles found
            </h3>
            <p
              className="mb-6 text-sm"
              style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              {search || category ? 'Try adjusting your filters' : 'Check back soon for new content'}
            </p>
            {(search || category) && (
              <button
                onClick={() => { setSearch(''); setCategory(''); setPage(1); }}
                className="px-6 py-2.5 text-sm font-medium rounded-full transition-colors hover:opacity-80"
                style={{
                  background: '#1A1A18',
                  color: '#F6F3EE',
                  fontFamily: 'var(--font-body, Jost, sans-serif)',
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p
              className="text-sm mb-10"
              style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              <span className="font-medium" style={{ color: '#1A1A18' }}>{filteredPosts.length}</span>
              {' '}of{' '}
              <span className="font-medium" style={{ color: '#1A1A18' }}>{pagination?.total || 0}</span>
              {' '}articles
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-14">
              {filteredPosts.map((post, index) => (
                <JournalCard
                  key={post.id}
                  title={post.title}
                  category={post.category}
                  excerpt={post.excerpt}
                  image={post.image}
                  date={formatDate(post.publishedAt)}
                  readTime={post.readTime}
                  href={`/journal/${post.slug}`}
                  index={index}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && !search && (
          <div className="flex items-center justify-center gap-3 mt-16">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1 || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full border transition-colors disabled:opacity-40 hover:border-[#1A1A18]"
              style={{
                color: '#1A1A18',
                borderColor: '#C8C0B8',
                fontFamily: 'var(--font-body, Jost, sans-serif)',
              }}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum =
                  Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                return pageNum <= pagination.totalPages ? (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className="w-9 h-9 text-xs font-medium rounded-full transition-all hover:opacity-80"
                    style={{
                      background: pageNum === page ? '#1A1A18' : 'transparent',
                      color: pageNum === page ? '#F6F3EE' : '#6B6560',
                      border: `1px solid ${pageNum === page ? '#1A1A18' : '#C8C0B8'}`,
                      fontFamily: 'var(--font-body, Jost, sans-serif)',
                    }}
                  >
                    {pageNum}
                  </button>
                ) : null;
              })}
            </div>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full border transition-colors disabled:opacity-40 hover:border-[#1A1A18]"
              style={{
                color: '#1A1A18',
                borderColor: '#C8C0B8',
                fontFamily: 'var(--font-body, Jost, sans-serif)',
              }}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
