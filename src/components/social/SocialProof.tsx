'use client';

import { motion } from 'framer-motion';
import { Camera, Star } from 'lucide-react';
import Link from 'next/link';
import { useGetAllReviewsQuery } from '@/services/api/reviewsApi';
import { useGetProductsQuery } from '@/services/api/productsApi';

export const SocialProof = () => {
  const { data: reviewsData } = useGetAllReviewsQuery({ sortBy: 'rating', sortOrder: 'desc', limit: 3, isVerified: 'true' });
  const { data: productsData } = useGetProductsQuery({ limit: 6, sortBy: 'avgRating', sortOrder: 'desc' });

  const reviews = (reviewsData as any)?.data || [];
  const products: any[] = (productsData as any)?.data || [];

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container-mono">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-center mb-12 md:mb-16"
        >
          <span
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-4 block"
            style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
          >
            Community
          </span>
          <h2
            className="leading-[1.05] mb-4"
            style={{
              fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              fontSize: 'clamp(2rem, 3.5vw, 3rem)',
              fontWeight: 700,
              color: '#1A1A18',
            }}
          >
            Loved by Thousands
          </h2>
          <p
            className="max-w-md mx-auto text-sm leading-relaxed"
            style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
          >
            Real stories from our community of modern minimalists.
          </p>
        </motion.div>

        {/* Reviews Row */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            {reviews.map((review: any, index: number) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl p-6"
                style={{ background: '#F0ECE4' }}
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? 'fill-[#C8703A] text-[#C8703A]' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p
                    className="text-sm leading-relaxed mb-4 line-clamp-3"
                    style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                  >
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                  >
                    {review.user?.name || 'Customer'}
                  </p>
                  {review.product && (
                    <Link href={`/products/${review.product.slug}`}>
                      <span
                        className="text-xs transition-colors hover:opacity-70"
                        style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                      >
                        {review.product.name}
                      </span>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Product Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {products.slice(0, 6).map((product: any, index: number) => {
            const imgSrc = product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80';
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
                className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
              >
                <Link href={`/products/${product.slug}`}>
                  <motion.img
                    src={imgSrc}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-[#1A1A18]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4">
                    <Camera className="h-6 w-6 mb-2" />
                    <p
                      className="text-sm font-medium text-center line-clamp-1"
                      style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                    >
                      {product.name}
                    </p>
                    <p
                      className="text-xs text-white/70 mt-1"
                      style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                    >
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(product.price))}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
