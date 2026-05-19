'use client';

import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

const socialImages = [
  {
    src: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80',
    user: '@minimalist_style',
    product: 'Linen Blazer',
  },
  {
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    user: '@urban_dweller',
    product: 'Cotton Tee',
  },
  {
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    user: '@slowfashion',
    product: 'Wool Coat',
  },
  {
    src: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&q=80',
    user: '@essentials_only',
    product: 'Cashmere Sweater',
  },
  {
    src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
    user: '@modernwardrobe',
    product: 'Silk Scarf',
  },
  {
    src: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80',
    user: '@curated_living',
    product: 'Linen Shirt',
  },
];

export const SocialProof = () => {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container-mono">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-4 block">
            Community
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#111111] leading-[1.1] mb-4">
            Share Your Style
          </h2>
          <p className="text-[#6B6B6B] max-w-md mx-auto">
            Tag @monostore to be featured. Join our community of modern minimalists.
          </p>
        </motion.div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {socialImages.map((item, index) => (
            <motion.div
              key={item.user}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.05,
                ease: [0.16, 1, 0.3, 1] as const 
              }}
              className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
            >
              <motion.img
                src={item.src}
                alt={`${item.user}'s style`}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.6 }}
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-[#111111]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4">
                <Camera className="h-6 w-6 mb-2" />
                <p className="text-sm font-medium">{item.user}</p>
                <p className="text-xs text-white/70 mt-1">Shop {item.product}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
