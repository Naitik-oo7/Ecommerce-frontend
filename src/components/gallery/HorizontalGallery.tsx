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

    // Calculate scroll distance
    const scrollWidth = scrollContainer.scrollWidth - window.innerWidth;

    // Create the horizontal scroll animation
    const ctx = gsap.context(() => {
      // Pin the section and scroll horizontally
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
            // Update progress bar
            gsap.to(progress, {
              scaleX: self.progress,
              duration: 0.1,
              ease: 'none',
            });
          },
        },
      });

      // Animate items as they enter viewport
      const items = scrollContainer.querySelectorAll('.gallery-item');
      items.forEach((item, index) => {
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
    <section ref={sectionRef} className="bg-mono-charcoal text-white overflow-hidden">
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
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-mono-terracotta mb-4 block">
              The Collection
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              Explore The
              <br />
              <span className="text-white/40">Essentials</span>
            </h2>
          </div>
          <p className="text-white/60 max-w-md text-lg leading-relaxed">
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
          {/* Spacer for initial offset */}
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
                {/* Image Container */}
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

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Index number */}
                  <div className="absolute top-4 left-4 text-6xl font-bold text-white/10">
                    0{index + 1}
                  </div>

                  {/* Hover arrow */}
                  <motion.div
                    className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ scale: 0.8 }}
                    whileHover={{ scale: 1 }}
                  >
                    <ArrowRight className="h-5 w-5 text-mono-charcoal" />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <span className="text-xs font-medium tracking-wider uppercase text-mono-terracotta">
                    {item.category}
                  </span>
                  <h3 className="text-xl font-semibold text-white group-hover:text-white/80 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-lg text-white/60">{item.price}</p>
                </div>
              </motion.article>
            </Link>
          ))}

          {/* Spacer for ending */}
          <div className="w-[20vw] flex-shrink-0" />
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-8 left-6 right-6 md:left-16 md:right-16">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium tracking-wider text-white/40">01</span>
            <div className="flex-1 h-px bg-white/20 relative overflow-hidden">
              <div
                ref={progressRef}
                className="absolute inset-y-0 left-0 bg-mono-terracotta origin-left"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
            <span className="text-xs font-medium tracking-wider text-white/40">
              {String(galleryItems.length || 6).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HorizontalGallery;
