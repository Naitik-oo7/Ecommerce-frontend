'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fadeInUp } from '@/lib/animations';

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { name: string };
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

function StarRow({ rating, filled = false }: { rating: number; filled?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= rating
              ? filled
                ? 'text-amber-400 fill-amber-400'
                : 'text-mono-terracotta fill-mono-terracotta'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewsSection({ reviews, stats }: ReviewsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(6);

  if (!reviews?.length) return null;

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  return (
    <section className="container-mono py-16 border-t border-border">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-mono-charcoal mb-1">Customer Reviews</h2>
            {stats && (
              <p className="text-sm text-muted-foreground">
                Based on {stats.total} verified {stats.total === 1 ? 'review' : 'reviews'}
              </p>
            )}
          </div>
          {stats && (
            <div className="flex items-center gap-3 bg-mono-cream/60 rounded-2xl px-5 py-4 border border-border/40">
              <div className="text-center">
                <p className="text-4xl font-bold text-mono-charcoal leading-none">{stats.average.toFixed(1)}</p>
                <StarRow rating={Math.round(stats.average)} filled />
                <p className="text-xs text-muted-foreground mt-1">{stats.total} reviews</p>
              </div>
              {stats.distribution && Object.keys(stats.distribution).length > 0 && (
                <div className="space-y-1.5 ml-4 min-w-[140px]">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.distribution[star] || 0;
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-3">{star}</span>
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: (5 - star) * 0.06 }}
                            className="h-full bg-amber-400 rounded-full"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-7 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Review Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleReviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="bg-mono-cream/40 border border-border/40 rounded-2xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <StarRow rating={review.rating} />
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-mono-stone text-sm leading-relaxed mb-4 line-clamp-4">
                &ldquo;{review.comment}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-mono-charcoal/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-mono-charcoal/60" />
                  </div>
                  <span className="text-sm font-medium text-mono-charcoal">
                    {review.user?.name || 'Anonymous'}
                  </span>
                </div>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-mono-charcoal transition-colors">
                  <ThumbsUp className="h-3 w-3" />
                  Helpful
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((c) => c + 6)}
              className="border-mono-charcoal/30 text-mono-charcoal hover:bg-mono-charcoal hover:text-white rounded-xl px-8"
            >
              Load more reviews ({reviews.length - visibleCount} remaining)
            </Button>
          </div>
        )}
      </motion.div>
    </section>
  );
}
