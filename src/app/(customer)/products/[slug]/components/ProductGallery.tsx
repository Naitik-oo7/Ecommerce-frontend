'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface GalleryImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

interface ProductGalleryProps {
  media?: { url: string; isPrimary?: boolean; alt?: string; type?: string; sortOrder?: number }[];
  imageUrls?: string[];
  productName: string;
  salePercent?: number | null;
}

function buildGalleryImages(
  media: ProductGalleryProps['media'],
  imageUrls: ProductGalleryProps['imageUrls'],
  productName: string
): GalleryImage[] {
  const fromMedia = (Array.isArray(media) ? media : [])
    .filter((m) => m?.url && (!m.type || m.type === 'image'))
    .sort((a, b) => {
      const orderA = a.sortOrder ?? 999;
      const orderB = b.sortOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0);
    })
    .map((m) => ({ url: m.url, alt: m.alt, isPrimary: m.isPrimary }));

  if (fromMedia.length > 0) return fromMedia;

  const urls = (Array.isArray(imageUrls) ? imageUrls : []).filter(Boolean);
  return urls.map((url, i) => ({
    url,
    alt: productName,
    isPrimary: i === 0,
  }));
}

export function ProductGallery({
  media,
  imageUrls,
  productName,
  salePercent,
}: ProductGalleryProps) {
  const images = useMemo(
    () => buildGalleryImages(media, imageUrls, productName),
    [media, imageUrls, productName]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const touchStartX = useRef<number>(0);

  const safeIndex = images.length ? Math.min(selectedIndex, images.length - 1) : 0;
  const currentImage = images[safeIndex];

  const goToPrev = useCallback(() => {
    setSelectedIndex((p) => (p === 0 ? images.length - 1 : p - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((p) => (p === images.length - 1 ? 0 : p + 1));
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex h-[min(40vh,320px)] w-full items-center justify-center rounded-xl bg-mono-sand/40">
        <span className="text-sm text-mono-stone">No images available</span>
      </div>
    );
  }

  const hasMultiple = images.length > 1;

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
        {/* Thumbnails — horizontal on mobile, vertical on desktop */}
        {hasMultiple && (
          <div
            className="order-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:w-[76px] lg:shrink-0 lg:max-h-[min(calc(100vh-10rem),480px)] lg:order-1"
            role="tablist"
            aria-label="Product images"
          >
            {images.map((image, idx) => (
              <button
                key={`${image.url}-${idx}`}
                type="button"
                role="tab"
                aria-selected={safeIndex === idx}
                onClick={() => setSelectedIndex(idx)}
                className={`relative shrink-0 snap-start overflow-hidden rounded-lg transition-all w-[64px] h-[80px] lg:w-[76px] lg:h-[95px] ${
                  safeIndex === idx
                    ? 'ring-2 ring-mono-charcoal ring-offset-2 opacity-100'
                    : 'opacity-55 hover:opacity-90 ring-1 ring-border/40'
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.alt || `${productName} — view ${idx + 1}`}
                  fill
                  sizes="76px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image — constrained to viewport */}
        <div className="relative flex-1 min-w-0 order-1 lg:order-2">
          <div
            className="relative flex h-[calc(100vh-8rem)] w-full items-center justify-center overflow-hidden rounded-xl bg-mono-cream ring-1 ring-border/30"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImage.url + safeIndex}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src={currentImage.url}
                  alt={currentImage.alt || productName}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-contain"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

            {salePercent && (
              <span className="absolute top-3 left-3 z-10 rounded-full bg-mono-terracotta px-2.5 py-1 text-[11px] font-bold text-white">
                −{salePercent}%
              </span>
            )}

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={goToPrev}
                  className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md transition-transform hover:scale-105 active:scale-95"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 text-mono-charcoal" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md transition-transform hover:scale-105 active:scale-95"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 text-mono-charcoal" />
                </button>
                <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white tabular-nums">
                  {safeIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
