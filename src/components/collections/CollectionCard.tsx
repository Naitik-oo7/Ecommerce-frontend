'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface CollectionCardProps {
  title: string;
  subtitle: string;
  image: string;
  href: string;
  index: number;
}

export const CollectionCard = ({ title, subtitle, image, href, index }: CollectionCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia?.('(hover: none)').matches ?? false);
  }, []);

  // Overlay controls visible on hover, focus, or touch devices.
  // Image zoom/pan stays on isHovered only so touch cards don't sit permanently zoomed.
  const reveal = isHovered || isFocused || isTouch;

  // Mouse position tracking for image pan effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for mouse movement
  const springConfig = { damping: 20, stiffness: 300 };
  const panX = useSpring(mouseX, springConfig);
  const panY = useSpring(mouseY, springConfig);

  // Transform mouse position to image pan (opposite direction for parallax feel)
  const imageX = useTransform(panX, [-0.5, 0.5], [15, -15]);
  const imageY = useTransform(panY, [-0.5, 0.5], [15, -15]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1] as const
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFocused(false); }}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl cursor-pointer"
    >
      <Link href={href} className="block w-full h-full">
        {/* Background Image with Zoom + Pan */}
        <motion.div 
          className="absolute inset-0 will-change-transform"
          animate={{ scale: isHovered ? 1.12 : 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          style={{
            x: isHovered ? imageX : 0,
            y: isHovered ? imageY : 0,
          }}
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover scale-110"
          />
        </motion.div>

        {/* Gradient Overlay - intensifies on hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
          animate={{ opacity: isHovered ? 0.9 : 0.7 }}
          transition={{ duration: 0.4 }}
        />

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
          >
            <motion.span
              className="text-xs font-medium tracking-[0.15em] uppercase text-white/70 mb-2 block"
              animate={{
                y: reveal ? -4 : 0,
                opacity: reveal ? 1 : 0.7
              }}
              transition={{ duration: 0.3 }}
            >
              {subtitle}
            </motion.span>
            <motion.h3
              className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight"
              animate={{ y: reveal ? -8 : 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
            >
              {title}
            </motion.h3>

            {/* Reveal on hover / focus / touch */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: reveal ? 1 : 0,
                y: reveal ? 0 : 20
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              aria-hidden={!reveal}
              style={{ pointerEvents: reveal ? 'auto' : 'none' }}
              className="flex items-center gap-2 text-white/90 font-medium text-sm"
            >
              <span>Explore Collection</span>
              <motion.div
                animate={{ x: reveal ? 4 : 0, y: reveal ? -4 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowUpRight className="h-4 w-4" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Animated border glow on hover/focus/touch */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-white/0"
          animate={{
            borderColor: reveal ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0)',
            boxShadow: reveal
              ? '0 0 40px rgba(199, 162, 124, 0.2), inset 0 0 40px rgba(255,255,255,0.05)'
              : '0 0 0 rgba(0,0,0,0)'
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Corner accent */}
        <motion.div
          className="absolute top-4 right-4 w-8 h-8"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: reveal ? 1 : 0,
            scale: reveal ? 1 : 0,
            rotate: reveal ? 0 : -45
          }}
          transition={{ duration: 0.3 }}
        >
          <ArrowUpRight className="w-full h-full text-white/50" />
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default CollectionCard;
