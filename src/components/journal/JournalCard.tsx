'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface JournalCardProps {
  title: string;
  category: string;
  excerpt: string;
  image: string;
  date: string;
  readTime: string;
  href: string;
  index: number;
  compact?: boolean;
}

export const JournalCard = ({ 
  title, 
  category, 
  excerpt, 
  image, 
  date, 
  readTime, 
  href, 
  index,
  compact = false,
}: JournalCardProps) => {

  if (compact) {
    return (
      <motion.article
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] as const }}
        className="group cursor-pointer"
      >
        <Link href={href} className="flex gap-4 items-start">
          {/* Thumbnail */}
          <div className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-[#E8E0D5]">
            <motion.div
              className="absolute inset-0"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <Image src={image} alt={title} fill sizes="96px" className="object-cover" />
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-mono-terracotta">
              {category}
            </span>
            <h3 className="text-[15px] font-bold text-mono-charcoal group-hover:text-mono-terracotta transition-colors leading-snug line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-[#9A9A9A]">
              <span>{date}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-[#9A9A9A]" />
              <span>{readTime}</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
            <ArrowUpRight className="h-4 w-4 text-mono-terracotta" />
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1] as const 
      }}
      className="group cursor-pointer"
    >
      <Link href={href} className="block">
        {/* Image Container */}
        <div className="relative overflow-hidden rounded-2xl mb-5 aspect-16/10">
          <motion.div
            className="absolute inset-0"
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />

          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-mono-charcoal tracking-wide">
              {category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-[#9A9A9A]">
            <span>{date}</span>
            <span className="w-1 h-1 rounded-full bg-[#CCCCCC]" />
            <span>{readTime}</span>
          </div>

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-bold text-mono-charcoal group-hover:text-mono-terracotta transition-colors leading-tight">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="text-mono-stone line-clamp-3 text-base leading-relaxed">
            {excerpt}
          </p>

          {/* Read More */}
          <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-mono-charcoal group-hover:text-mono-terracotta transition-colors pt-1 border-b border-current pb-0.5">
            <span>Read Article</span>
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export default JournalCard;
