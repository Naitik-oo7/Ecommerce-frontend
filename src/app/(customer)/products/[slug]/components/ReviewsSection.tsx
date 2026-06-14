'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Star, ThumbsUp, User, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { name: string };
  images?: string[];
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

interface ReviewsSectionProps {
  reviews: Review[];
  stats?: ReviewStats;
  inline?: boolean;
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${
            i <= rating ? 'text-amber-400 fill-amber-400' : 'text-mono-sand'
          }`}
        />
      ))}
    </div>
  );
}

function ImageLightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5 text-white" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </>
      )}

      {/* Full-screen lightbox: intrinsic-size, viewport-capped — not a next/image fill case. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx]}
        alt={`Review photo ${idx + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <p className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm">
          {idx + 1} / {images.length}
        </p>
      )}
    </div>
  );
}

export function ReviewsSection({ reviews, stats, inline = false }: ReviewsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(inline ? 4 : 6);
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null);

  if (!reviews?.length) return null;

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  const content = (
    <>
      <div className={`flex flex-col lg:flex-row gap-8 ${inline ? 'mb-8' : 'mb-10'}`}>
        {stats && (
          <div className="lg:w-64 shrink-0 flex flex-col items-center lg:items-start p-6 rounded-2xl bg-mono-cream/80 border border-border/30">
            <p className="text-5xl font-bold text-mono-charcoal leading-none tabular-nums">
              {stats.average.toFixed(1)}
            </p>
            <StarRow rating={Math.round(stats.average)} size="md" />
            <p className="text-sm text-mono-stone mt-2">
              {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
            </p>
            {stats.distribution && Object.keys(stats.distribution).length > 0 && (
              <div className="w-full mt-6 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution[star] || 0;
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-mono-stone w-3 tabular-nums">{star}</span>
                      <div className="flex-1 h-2 bg-mono-sand/60 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: (5 - star) * 0.05 }}
                          className="h-full bg-amber-400 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-mono-stone w-8 text-right tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 grid sm:grid-cols-2 gap-4">
          {visibleReviews.map((review, idx) => (
            <motion.article
              key={review.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              className="bg-white border border-border/40 rounded-2xl p-5 hover:border-border transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <StarRow rating={review.rating} />
                <time
                  dateTime={review.createdAt}
                  className="text-xs text-mono-stone shrink-0"
                >
                  {new Date(review.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>

              {review.comment && (
                <p className="text-mono-charcoal/90 text-sm leading-relaxed mb-3 line-clamp-5">
                  {review.comment}
                </p>
              )}

              {/* Review images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {review.images.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setLightbox({ images: review.images!, idx: i })}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/60 hover:border-mono-terracotta/50 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-mono-terracotta/40"
                    >
                      <Image src={url} alt={`Review photo ${i + 1}`} fill sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-mono-sand flex items-center justify-center">
                    <User className="h-4 w-4 text-mono-stone" />
                  </div>
                  <span className="text-sm font-medium text-mono-charcoal">
                    {review.user?.name || 'Verified buyer'}
                  </span>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-mono-stone hover:text-mono-charcoal transition-colors"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Helpful
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((c) => c + (inline ? 4 : 6))}
            className="rounded-full px-8 border-border hover:bg-mono-charcoal hover:text-white hover:border-mono-charcoal"
          >
            Show more reviews ({reviews.length - visibleCount} left)
          </Button>
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <ImageLightbox
            images={lightbox.images}
            startIndex={lightbox.idx}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </>
  );

  if (inline) return <div>{content}</div>;

  return (
    <section className="container-mono py-16 border-t border-border">
      <h2 className="text-2xl font-bold text-mono-charcoal mb-2">Customer reviews</h2>
      <p className="text-sm text-mono-stone mb-10">What shoppers are saying</p>
      {content}
    </section>
  );
}
