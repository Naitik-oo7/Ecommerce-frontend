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
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-4 block">
            Community
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#111111] leading-[1.1] mb-4">
            What Our Customers Say
          </h2>
          <p className="text-[#6B6B6B] max-w-md mx-auto">
            Real reviews from our community of modern minimalists.
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
                className="bg-[#F6F3EE] rounded-2xl p-6"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? 'fill-[#C7A27C] text-[#C7A27C]' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-[#6B6B6B] text-sm leading-relaxed mb-4 line-clamp-3">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#111111]">{review.user?.name || 'Customer'}</p>
                  {review.product && (
                    <Link href={`/products/${review.product.slug}`}>
                      <span className="text-xs text-[#C7A27C] hover:text-[#111111] transition-colors">
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
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-[#111111]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4">
                    <Camera className="h-6 w-6 mb-2" />
                    <p className="text-sm font-medium text-center line-clamp-1">{product.name}</p>
                    <p className="text-xs text-white/70 mt-1">
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
