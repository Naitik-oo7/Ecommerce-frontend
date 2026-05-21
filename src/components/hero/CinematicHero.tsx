'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const defaultStats = [
    { value: '50K+', label: 'Happy Customers' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '24h', label: 'Fast Shipping' },
  ];
  const stats: { value: string; label: string }[] = hero?.stats || defaultStats;
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Text animation variants
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
      className="relative min-h-screen w-full overflow-hidden bg-[#F6F3EE]"
    >
      {/* Background gradient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(199, 162, 124, 0.4) 0%, transparent 70%)',
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-20 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(17, 17, 17, 0.3) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Split-screen layout */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left panel - Content */}
        <motion.div 
          className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-16 xl:px-24 py-24 lg:py-0 lg:pr-8"
          style={{ y: textY, opacity }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-xl"
          >
            {/* Eyebrow label */}
            <motion.div variants={fadeInVariants} className="mb-6">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C]">
                {hero?.eyebrow || 'New Collection 2026'}
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1 
              variants={textVariants}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-[#111111] leading-[0.95] tracking-tight mb-8"
            >
              <span className="block">{hero?.headline?.[0] || 'Crafted For'}</span>
              <span className="block text-[#6B6B6B]">{hero?.headline?.[1] || 'Modern Living'}</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p 
              variants={fadeInVariants}
              className="text-lg text-[#6B6B6B] leading-relaxed max-w-md mb-10"
            >
              {hero?.subtext || 'Timeless essentials designed with precision, comfort, and sustainable craftsmanship for the contemporary wardrobe.'}
            </motion.p>

            {/* CTAs */}
            <motion.div 
              variants={fadeInVariants}
              className="flex flex-wrap gap-4"
            >
              <Link href={hero?.ctaPrimary?.href || '/products'}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    size="lg" 
                    className="bg-[#111111] hover:bg-[#1a1a1a] text-white font-medium px-8 h-14 text-base rounded-full"
                  >
                    {hero?.ctaPrimary?.label || 'Explore Collection'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-6 h-14 text-[#111111] font-medium hover:text-[#6B6B6B] transition-colors"
              >
                <span className="w-12 h-12 rounded-full border border-[#111111]/20 flex items-center justify-center hover:border-[#111111]/40 transition-colors">
                  <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                </span>
                {hero?.ctaSecondary?.label || 'Watch Lookbook'}
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Floating stats */}
          {stats.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
              className="hidden lg:flex gap-12 mt-16 pt-8 border-t border-[#111111]/10"
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold text-[#111111]">{stat.value}</p>
                  <p className="text-sm text-[#6B6B6B] mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Right panel - Image */}
        <div className="flex-1 relative min-h-[50vh] lg:min-h-screen overflow-hidden">
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
                src={hero?.backgroundImage || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80'}
                alt="Editorial lifestyle photography"
                className="w-full h-full object-cover"
              />
              {/* Subtle overlay for text contrast if needed */}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#F6F3EE]/30 lg:to-[#F6F3EE]/50" />
            </motion.div>
          </motion.div>

          {/* Floating product card */}
          <motion.div
            initial={{ opacity: 0, x: 50, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="absolute bottom-12 left-8 lg:left-12 z-20"
          >
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl max-w-[200px]">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={newestProduct?.images?.[0] || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&q=80'}
                  alt={newestProduct?.name || 'Featured product'}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-[#111111] line-clamp-1">{newestProduct?.name || 'New Arrival'}</p>
                  <p className="text-xs text-[#6B6B6B]">
                    {newestProduct?.price
                      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(newestProduct.price))
                      : '—'}
                  </p>
                </div>
              </div>
              <Link href={newestProduct?.slug ? `/products/${newestProduct.slug}` : '/products'}>
                <span className="text-xs font-medium text-[#C7A27C] hover:text-[#111111] transition-colors cursor-pointer">
                  Shop Now →
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
          className="flex flex-col items-center gap-2 text-[#6B6B6B]"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
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
