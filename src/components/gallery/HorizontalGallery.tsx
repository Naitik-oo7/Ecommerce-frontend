'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useGetProductsQuery } from '@/services/api/productsApi';
import type { Product } from '@/types/product';

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

function formatPrice(price: number): string {
  if (isNaN(price)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

export const HorizontalGallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const { data: productsData, isLoading } = useGetProductsQuery({ limit: 6 });
  const rawProducts: Product[] = Array.isArray(productsData)
    ? productsData
    : productsData?.data || [];

  const galleryItems: GalleryItem[] = rawProducts.map((p) => ({
    id: p.id,
    image: p.images?.[0] || FALLBACK_IMAGE,
    category: p.category?.name || 'Collection',
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

    // Recomputed on every refresh so it stays correct after images load / resize.
    const getScrollWidth = () =>
      Math.max(0, scrollContainer.scrollWidth - window.innerWidth);

    const ctx = gsap.context(() => {
      const scrollTween = gsap.to(scrollContainer, {
        x: () => -getScrollWidth(),
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: () => `+=${getScrollWidth()}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(progress, { scaleX: self.progress });
          },
        },
      });

      // Reveal each card as it slides into the viewport DURING the horizontal
      // scroll. Because the horizontal movement isn't a native scroll, the
      // per-card triggers must use `containerAnimation: scrollTween` — that's
      // GSAP's supported way to fire on horizontal position. (The earlier
      // single `once` reveal fired before the pin engaged, so cards 4-6 were
      // off-screen, got cleared, and then never re-revealed until the end.)
      //
      // We animate `.gallery-reveal` (a plain div), NOT `.gallery-item` —
      // framer-motion owns the transform on `.gallery-item` (whileHover), and
      // two libraries writing the same transform left cards stuck hidden.
      const items = scrollContainer.querySelectorAll<HTMLElement>('.gallery-item');
      items.forEach((item) => {
        const reveal = item.querySelector<HTMLElement>('.gallery-reveal');
        if (!reveal) return;
        gsap.fromTo(
          reveal,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            // Let ScrollTrigger resolve the at-rest state from the card's
            // position FIRST. Without this, fromTo force-renders opacity:0 on
            // every card up front — so cards already on-screen (whose trigger
            // already passed) stay invisible until the very end of the scroll.
            immediateRender: false,
            scrollTrigger: {
              trigger: item,
              containerAnimation: scrollTween,
              // Reveal well before the card reaches center and keep it shown.
              start: 'left 95%',
              end: 'left 60%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, section);

    // Images load after mount with no intrinsic height until then, so the
    // pinned scroll distance is measured wrong (Lenis caches it) → the section
    // pins on black and only resolves at the end. Refresh once each image loads.
    const imgs = Array.from(scrollContainer.querySelectorAll('img'));
    const refresh = () => ScrollTrigger.refresh();
    const pending = imgs.filter((img) => !img.complete);
    pending.forEach((img) => {
      img.addEventListener('load', refresh, { once: true });
      img.addEventListener('error', refresh, { once: true });
    });
    // Also refresh once after first paint to settle initial layout/fonts.
    const raf = requestAnimationFrame(refresh);

    return () => {
      cancelAnimationFrame(raf);
      pending.forEach((img) => {
        img.removeEventListener('load', refresh);
        img.removeEventListener('error', refresh);
      });
      ctx.revert();
    };
  }, [isLoading, galleryItems.length]);

  return (
    <section ref={sectionRef} className="overflow-hidden" style={{ background: '#1A1A18' }}>
      {/* Section Header */}
      <div className="container-mono py-10 md:py-14">
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
          className="flex items-center gap-6 md:gap-10 px-6 md:px-16 h-full"
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
                <div className="gallery-reveal">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-6 bg-white/5">
                  <motion.div
                    className="absolute inset-0"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 70vw, (max-width: 1024px) 35vw, 25vw"
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
                className="absolute inset-y-0 left-0 right-0 origin-left"
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
