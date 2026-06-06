'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useGetSettingQuery } from '@/services/api/settingsApi';
import { useGetProductsQuery } from '@/services/api/productsApi';

/* ── tiny hook: smooth mouse parallax ── */
import { useMouseParallax } from '@/hooks/useMouseParallax';

export const CinematicHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useMouseParallax({ intensity: 15, smoothing: 0.08 });

  const { data: heroSettings, isLoading: heroLoading } = useGetSettingQuery('hero');
  const { data: newestProductData } = useGetProductsQuery({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 1,
  });

  const hero = heroSettings as any;
  const newestProduct = (newestProductData as any)?.data?.[0] || null;

  const FALLBACK_HERO_IMAGE =
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80';
  // Only resolve the image source once the hero setting has loaded — this avoids
  // painting the static fallback first and then swapping to the dynamic image.
  const heroImage = heroLoading ? null : hero?.backgroundImage || FALLBACK_HERO_IMAGE;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const textY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  /* ── animation variants ── */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.3 },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 60, clipPath: 'inset(100% 0 0 0)' },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: 'inset(0% 0 0 0)',
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section
      ref={containerRef}
      className="relative -mt-14 md:-mt-16 pt-14 md:pt-16 min-h-[calc(100svh-3.5rem)] md:min-h-[calc(100svh-4rem)] lg:h-[calc(100dvh-4rem)] w-full overflow-hidden flex flex-col"
      style={{ background: '#F0ECE4' }}
    >
      {/* ── ambient glow ── */}
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

      {/* ── split layout ── */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row">

        {/* ── LEFT: text panel ── */}
        <motion.div
          className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-12 md:py-16 lg:py-0 lg:pr-8"
          style={{ y: textY }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-lg"
          >
            {/* eyebrow */}
            <motion.div variants={fadeInVariants} className="mb-6">
              <span
                className="text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
              >
                {hero?.eyebrow || 'New Season Collection'}
              </span>
            </motion.div>

            {/* headline */}
            <motion.h1 variants={textVariants} className="mb-8" style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}>
              <span
                className="block leading-[1.05]"
                style={{ fontSize: 'clamp(2.8rem, 5vw, 4.8rem)', fontWeight: 700, color: '#1A1A18' }}
              >
                {hero?.headline?.[0] || 'Designed for'}
              </span>
              <span
                className="block leading-[1.05]"
                style={{ fontSize: 'clamp(2.8rem, 5vw, 4.8rem)', fontWeight: 700, color: '#1A1A18' }}
              >
                {hero?.headline?.[1] || 'modern living.'}
              </span>
              <em
                className="block leading-[1.05]"
                style={{
                  fontSize: 'clamp(2.8rem, 5vw, 4.8rem)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: '#1A1A18',
                }}
              >
                {hero?.headline?.[2] || 'Crafted to last.'}
              </em>
            </motion.h1>

            {/* subtext */}
            <motion.p
              variants={fadeInVariants}
              className="text-base leading-relaxed max-w-sm mb-10"
              style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              {hero?.subtext || 'Timeless essentials with premium materials and meticulous craftsmanship.'}
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInVariants} className="flex flex-wrap gap-3">
              <Link href={hero?.ctaPrimary?.href || '/products/men'}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 text-white text-sm font-medium px-7 h-12 transition-colors"
                  style={{
                    background: '#1A1A18',
                    fontFamily: 'var(--font-body, Jost, sans-serif)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {hero?.ctaPrimary?.label || 'Shop Men'}
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>

              <Link href={hero?.ctaSecondary?.href || '/products/women'}>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#1A1A18', color: '#fff' }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 text-sm font-medium px-7 h-12 border transition-colors"
                  style={{
                    background: 'transparent',
                    color: '#1A1A18',
                    borderColor: '#1A1A18',
                    fontFamily: 'var(--font-body, Jost, sans-serif)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {hero?.ctaSecondary?.label || 'Shop Women'}
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── RIGHT: image panel ── */}
        <div className="flex-1 relative h-[45vh] lg:h-auto overflow-hidden">
          <motion.div className="absolute inset-0">
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
              {heroImage && (
                <img
                  src={heroImage}
                  alt="Editorial lifestyle"
                  className="w-full h-full object-cover object-top"
                />
              )}
              {/* left-edge fade to match hero bg */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to right, rgba(240,236,228,0.45) 0%, transparent 35%)',
                }}
              />
            </motion.div>
          </motion.div>

          {/* ── Floating product card ── */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="absolute bottom-10 right-8 z-20"
          >
            <div
              className="relative p-4 shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(12px)',
                minWidth: '220px',
              }}
            >
              {/* + pill */}
              <div
                className="absolute -top-3.5 -right-3.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-lg leading-none select-none cursor-pointer"
                style={{ background: '#1A1A18' }}
              >
                +
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-14 h-16 flex-shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ background: '#E8E0D4' }}
                >
                  {newestProduct?.images?.[0] ? (
                    <img
                      src={newestProduct.images[0]}
                      alt={newestProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 opacity-30" style={{ color: '#8A7E60' }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                  >
                    {newestProduct?.name || 'Linen Overshirt'}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: '#9E9890', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                  >
                    {newestProduct?.color || newestProduct?.variant || 'Natural Beige'}
                  </p>
                  <p
                    className="text-sm font-bold mt-1"
                    style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                  >
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
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer hover:opacity-70"
                  style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)', letterSpacing: '0.04em' }}
                >
                  Shop Now <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

  
    </section>
  );
};

export default CinematicHero;