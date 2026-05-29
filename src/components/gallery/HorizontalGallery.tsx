'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useGetProductsQuery } from '@/services/api/productsApi';

gsap.registerPlugin(ScrollTrigger);

interface GalleryItem {
  id: number;
  image: string;
  category: string;
  title: string;
  price: string;
  link: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80';

function formatPrice(price: any): string {
  const num = parseFloat(price);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
}

export const HorizontalGallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const { data: productsData, isLoading } = useGetProductsQuery({ limit: 6 });
  const rawProducts: any[] = (productsData as any)?.data || [];

  const galleryItems: GalleryItem[] = rawProducts.map((p: any) => ({
    id: p.id,
    image: p.images?.[0] || FALLBACK_IMAGE,
    category: p.category?.name || p.categoryName || 'Collection',
    title: p.name,
    price: formatPrice(p.price),
    link: `/products/${p.slug}`,
  }));

  useEffect(() => {
    if (isLoading || galleryItems.length === 0) return;

    const container = containerRef.current;
    const scrollContainer = scrollContainerRef.current;
    const progress = progressRef.current;
    const section = sectionRef.current;

    if (!container || !scrollContainer || !progress || !section) return;

    const scrollWidth = scrollContainer.scrollWidth - window.innerWidth;

    const ctx = gsap.context(() => {
      const scrollTween = gsap.to(scrollContainer, {
        x: () => -scrollWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: () => `+=${scrollWidth}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.to(progress, {
              scaleX: self.progress,
              duration: 0.1,
              ease: 'none',
            });
          },
        },
      });

      const items = scrollContainer.querySelectorAll('.gallery-item');
      items.forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 50, rotateY: 15 },
          {
            opacity: 1,
            y: 0,
            rotateY: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: item,
              containerAnimation: scrollTween,
              start: 'left 80%',
              end: 'left 50%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, [isLoading, galleryItems.length]);

  return (
    <section ref={sectionRef} className="overflow-hidden" style={{ background: '#1A1A18' }}>
      {/* Section Header */}
      <div className="container-mono py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-4 block"
              style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              The Collection
            </span>
            <h2
              className="leading-[1.05]"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2.2rem, 4vw, 3.8rem)',
                fontWeight: 700,
                color: '#F6F3EE',
              }}
            >
              Explore The
              <br />
              <em className="font-normal italic" style={{ color: 'rgba(246,243,238,0.35)' }}>Essentials</em>
            </h2>
          </div>
          <p
            className="max-w-md text-lg leading-relaxed"
            style={{ color: 'rgba(246,243,238,0.55)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
          >
            A curated selection of timeless pieces designed to elevate your everyday wardrobe with
            intention and quality.
          </p>
        </motion.div>
      </div>

      {/* Horizontal Scroll Container */}
      <div ref={containerRef} className="relative h-screen">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-6 md:gap-10 px-6 md:px-16 h-full will-change-transform"
          style={{ width: 'fit-content' }}
        >
          <div className="w-[10vw] md:w-[20vw] flex-shrink-0" />

          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[70vw] md:w-[35vw] lg:w-[25vw] animate-pulse"
                >
                  <div className="aspect-[3/4] rounded-lg bg-white/10 mb-6" />
                  <div className="space-y-3">
                    <div className="h-3 w-20 rounded bg-white/10" />
                    <div className="h-5 w-3/4 rounded bg-white/10" />
                    <div className="h-4 w-16 rounded bg-white/10" />
                  </div>
                </div>
              ))
            : galleryItems.map((item, index) => (
            <Link key={item.id} href={item.link}>
              <motion.article
                className="gallery-item relative flex-shrink-0 w-[70vw] md:w-[35vw] lg:w-[25vw] group cursor-pointer"
                whileHover={{ y: -10 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-6 bg-white/5">
                  <motion.div
                    className="absolute inset-0"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="absolute top-4 left-4 text-6xl font-bold text-white/10"
                    style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}>
                    0{index + 1}
                  </div>

                  <motion.div
                    className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ scale: 0.8 }}
                    whileHover={{ scale: 1 }}
                  >
                    <ArrowRight className="h-5 w-5" style={{ color: '#1A1A18' }} />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <span
                    className="text-xs font-medium tracking-wider uppercase"
                    style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                  >
                    {item.category}
                  </span>
                  <h3
                    className="text-xl font-semibold group-hover:opacity-70 transition-opacity"
                    style={{ color: '#F6F3EE', fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-lg"
                    style={{ color: 'rgba(246,243,238,0.55)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                  >
                    {item.price}
                  </p>
                </div>
              </motion.article>
            </Link>
          ))}

          <div className="w-[20vw] flex-shrink-0" />
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-8 left-6 right-6 md:left-16 md:right-16">
          <div className="flex items-center gap-4">
            <span
              className="text-xs font-medium tracking-wider"
              style={{ color: 'rgba(246,243,238,0.35)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              01
            </span>
            <div className="flex-1 h-px relative overflow-hidden" style={{ background: 'rgba(246,243,238,0.15)' }}>
              <div
                ref={progressRef}
                className="absolute inset-y-0 left-0 origin-left"
                style={{ background: '#C8703A', transform: 'scaleX(0)' }}
              />
            </div>
            <span
              className="text-xs font-medium tracking-wider"
              style={{ color: 'rgba(246,243,238,0.35)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              {String(galleryItems.length || 6).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HorizontalGallery;
