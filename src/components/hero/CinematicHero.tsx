'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useMouseParallax } from '@/hooks/useMouseParallax';
import Link from 'next/link';
import { useGetSettingQuery } from '@/services/api/settingsApi';
import { useGetProductsQuery } from '@/services/api/productsApi';

export const CinematicHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useMouseParallax({ intensity: 15, smoothing: 0.08 });

  const { data: heroSettings } = useGetSettingQuery('hero');
  const { data: newestProductData } = useGetProductsQuery({ sortBy: 'createdAt', sortOrder: 'desc', limit: 1 });

  const hero = heroSettings as any;
  const newestProduct = (newestProductData as any)?.data?.[0] || null;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3,
      },
    },
  };

  const textVariants = {
    hidden: {
      opacity: 0,
      y: 60,
      clipPath: 'inset(100% 0 0 0)',
    },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: 'inset(0% 0 0 0)',
      transition: {
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-[#F5F0E8]"
    >
      {/* Subtle ambient light */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[140px]"
          style={{
            background: 'radial-gradient(circle, rgba(199,162,124,0.5) 0%, transparent 70%)',
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
      </div>

      {/* Split layout */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">

        {/* ── Left panel ── */}
        <motion.div
          className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-24 lg:py-0 lg:pr-8"
          style={{ y: textY, opacity }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-lg"
          >
            {/* Eyebrow */}
            <motion.div variants={fadeInVariants} className="mb-6">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C]">
                {hero?.eyebrow || 'New Season Collection'}
              </span>
            </motion.div>

            {/* Headline — serif, mixed upright + italic */}
            <motion.h1
              variants={textVariants}
              className="mb-8 font-playfair"
            >
              <span
                className="block text-[#111111] leading-[1.05]"
                style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 700 }}
              >
                {hero?.headline?.[0] || 'Designed for'}
              </span>
              <span
                className="block text-[#111111] leading-[1.05]"
                style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 700 }}
              >
                {hero?.headline?.[1] || 'modern living.'}
              </span>
              <em
                className="block text-[#111111] leading-[1.05]"
                style={{
                  fontSize: 'clamp(2.8rem, 6vw, 5rem)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                }}
              >
                {hero?.headline?.[2] || 'Crafted to last.'}
              </em>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeInVariants}
              className="text-base text-[#777777] leading-relaxed max-w-sm mb-10"
            >
              {hero?.subtext ||
                'Timeless essentials with premium materials and meticulous craftsmanship.'}
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInVariants} className="flex flex-wrap gap-3">
              <Link href={hero?.ctaPrimary?.href || '/products/men'}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 bg-[#111111] text-white text-sm font-medium px-7 h-12 rounded-md transition-colors hover:bg-[#2a2a2a]"
                >
                  {hero?.ctaPrimary?.label || 'Shop Men'}
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>

              <Link href={hero?.ctaSecondary?.href || '/products/women'}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 bg-transparent text-[#111111] text-sm font-medium px-7 h-12 rounded-md border border-[#111111] transition-colors hover:bg-[#111111]/5"
                >
                  {hero?.ctaSecondary?.label || 'Shop Women'}
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── Right panel — image ── */}
        <div className="flex-1 relative min-h-[55vh] lg:min-h-screen overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{ scale: imageScale }}
          >
            <motion.div
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as const, delay: 0.2 }}
              className="w-full h-full"
              style={{
                transform: `translate(${mousePosition.x * -0.3}px, ${mousePosition.y * -0.3}px)`,
                transition: 'transform 0.5s ease-out',
              }}
            >
              <img
                src={
                  hero?.backgroundImage ||
                  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80'
                }
                alt="Editorial lifestyle photography"
                className="w-full h-full object-cover"
              />
              {/* Left-side fade so content bleeds into the image naturally */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#F5F0E8]/40 via-transparent to-transparent" />
            </motion.div>
          </motion.div>

          {/* Floating product card */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="absolute bottom-10 right-8 z-20"
          >
            <div className="relative bg-white/92 backdrop-blur-md rounded-2xl p-4 shadow-2xl w-[200px]">
              {/* + button */}
              <div className="absolute -top-3 -right-3 w-7 h-7 bg-[#111111] rounded-full flex items-center justify-center text-white text-base leading-none select-none">
                +
              </div>

              <div className="flex items-center gap-3 mb-3">
                <img
                  src={
                    newestProduct?.images?.[0] ||
                    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&q=80'
                  }
                  alt={newestProduct?.name || 'Featured product'}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111111] truncate">
                    {newestProduct?.name || 'Linen Overshirt'}
                  </p>
                  <p className="text-xs text-[#999999] mt-0.5">
                    {newestProduct?.color || newestProduct?.variant || 'Natural Beige'}
                  </p>
                  <p className="text-sm font-bold text-[#111111] mt-1">
                    {newestProduct?.price
                      ? new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(Number(newestProduct.price))
                      : '$129.00'}
                  </p>
                </div>
              </div>

              <Link href={newestProduct?.slug ? `/products/${newestProduct.slug}` : '/products'}>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#C7A27C] hover:text-[#111111] transition-colors cursor-pointer">
                  Shop Now
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 hidden lg:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 text-[#999999]"
        >
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-[#111111]/20 relative overflow-hidden">
            <motion.div
              animate={{ y: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-full h-1/2 bg-[#111111]"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CinematicHero;