'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface JournalCardProps {
  title: string;
  category: string;
  excerpt: string;
  image: string;
  date: string;
  readTime: string;
  href: string;
  index: number;
  featured?: boolean;
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
  featured = false 
}: JournalCardProps) => {
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
      className={`group cursor-pointer ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <Link href={href} className="block">
        {/* Image Container */}
        <div className={`relative overflow-hidden rounded-xl mb-5 ${featured ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
          <motion.div
            className="absolute inset-0"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </motion.div>
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#111111]">
              {category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
            <span>{date}</span>
            <span className="w-1 h-1 rounded-full bg-[#6B6B6B]" />
            <span>{readTime}</span>
          </div>

          {/* Title */}
          <h3 className={`font-bold text-[#111111] group-hover:text-[#C7A27C] transition-colors leading-tight ${featured ? 'text-2xl md:text-3xl' : 'text-lg'}`}>
            {title}
          </h3>

          {/* Excerpt */}
          <p className={`text-[#6B6B6B] line-clamp-2 ${featured ? 'text-base' : 'text-sm'}`}>
            {excerpt}
          </p>

          {/* Read More */}
          <div className="flex items-center gap-1 text-sm font-medium text-[#111111] opacity-0 group-hover:opacity-100 transition-opacity pt-2">
            <span>Read Article</span>
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export default JournalCard;
