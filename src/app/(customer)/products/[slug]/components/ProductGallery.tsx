'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface ProductGalleryProps {
  media: { url: string; isPrimary?: boolean; alt?: string }[];
  productName: string;
}

export function ProductGallery({ media, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const touchStartX = useRef<number>(0);

  const images = media?.length ? media : [];
  const currentImage = images[selectedIndex];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const goToPrev = () => setSelectedIndex((p) => (p === 0 ? images.length - 1 : p - 1));
  const goToNext = () => setSelectedIndex((p) => (p === images.length - 1 ? 0 : p + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goToNext(); else goToPrev();
    }
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No images available</span>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* Vertical thumbnail strip — desktop only */}
      {images.length > 1 && (
        <div className="hidden md:flex flex-col gap-2 w-16 shrink-0">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-200 ${
                selectedIndex === idx
                  ? 'border-mono-terracotta ring-1 ring-mono-terracotta/30'
                  : 'border-transparent hover:border-mono-stone/40'
              }`}
              aria-label={`View image ${idx + 1}`}
            >
              <img
                src={image.url}
                alt={`${productName} ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image area */}
      <div className="flex-1 space-y-3">
        <div
          className={`relative aspect-[4/5] bg-[#F6F3EE] rounded-2xl overflow-hidden group select-none ${
            isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => { setIsZoomed(false); setMousePos({ x: 50, y: 50 }); }}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedIndex}
              src={currentImage.url}
              alt={currentImage.alt || productName}
              className="w-full h-full object-cover"
              style={{
                transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
                transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                transition: isZoomed ? 'transform-origin 0s' : 'transform 0.35s ease',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
          </AnimatePresence>

          {/* Counter pill */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
          )}

          {/* Zoom indicator */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            {isZoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:scale-105 active:scale-95"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4 text-mono-charcoal" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:scale-105 active:scale-95"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4 text-mono-charcoal" />
              </button>
            </>
          )}
        </div>

        {/* Mobile dot indicators */}
        {images.length > 1 && (
          <div className="flex md:hidden justify-center gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`rounded-full transition-all duration-200 ${
                  idx === selectedIndex
                    ? 'w-5 h-1.5 bg-mono-terracotta'
                    : 'w-1.5 h-1.5 bg-muted-foreground/30'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
