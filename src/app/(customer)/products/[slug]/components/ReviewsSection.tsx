'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
}

export function ReviewsSection({ reviews, stats }: ReviewsSectionProps) {
  if (!reviews?.length) return null;

  return (
    <section className="container-mono py-16 border-t border-border">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-editorial text-2xl text-mono-charcoal">
            Customer Reviews
          </h2>
          {stats && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 text-mono-terracotta fill-mono-terracotta" />
                <span className="font-semibold">{stats.average.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">({stats.total} reviews)</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((review) => (
            <Card key={review.id} className="bg-mono-cream/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'text-mono-terracotta fill-mono-terracotta'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-mono-stone mb-4">{review.comment}</p>
                <p className="text-sm text-muted-foreground">
                  {review.user?.name || 'Anonymous'} -{' '}
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
