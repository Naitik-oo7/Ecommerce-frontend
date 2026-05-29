'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useGetSettingQuery } from '@/services/api/settingsApi';

const defaultStory = {
  eyebrow: 'Our Philosophy',
  headline: 'Designed with intention.',
  subheadline: 'Built to last.',
  body1: 'Every piece in our collection is thoughtfully designed and meticulously crafted. We partner with artisans who share our commitment to excellence, ensuring each garment meets our uncompromising standards.',
  body2: 'From fabric selection to final stitching, we maintain the highest standards. Because you deserve clothing that feels as good as it looks—pieces that become more cherished with every wear.',
  image1: 'https://images.unsplash.com/photo-1558618047-f4b5110f757d?w=800&q=80',
  image2: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80',
  stat: { value: '12+', label: 'Years of Excellence' },
  materials: [
    { label: 'Organic Cotton', desc: 'Sustainably sourced' },
    { label: 'Linen Blend', desc: 'Breathable comfort' },
    { label: 'Recycled Wool', desc: 'Eco-conscious warmth' },
    { label: 'Silk Touch', desc: 'Luxurious feel' },
  ],
};

export const BrandStory = () => {
  const { data: storyData } = useGetSettingQuery('brand_story');
  const s = (storyData as typeof defaultStory | undefined) || defaultStory;

  return (
    <section className="py-20 md:py-32 overflow-hidden" style={{ background: '#F0ECE4' }}>
      <div className="container-mono">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-6 block"
              style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              {s.eyebrow}
            </span>

            <h2
              className="leading-[1.05] mb-8"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                color: '#1A1A18',
              }}
            >
              <span className="font-bold block">{s.headline}</span>
              <em className="font-normal italic block" style={{ color: '#6B6560' }}>
                {s.subheadline}
              </em>
            </h2>

            <div
              className="space-y-6 leading-relaxed mb-10 text-sm"
              style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              <p>{s.body1}</p>
              <p>{s.body2}</p>
            </div>

            <Link href="/about">
              <motion.span
                className="inline-flex items-center gap-2 font-medium transition-colors cursor-pointer group hover:opacity-70"
                style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)', letterSpacing: '0.04em' }}
                whileHover={{ x: 5 }}
              >
                Discover Our Story
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </motion.span>
            </Link>
          </motion.div>

          {/* Right Column - Images */}
          <div className="relative h-[500px] lg:h-[600px]">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
              className="absolute top-0 right-0 w-[85%] h-[75%] rounded-2xl overflow-hidden shadow-2xl"
            >
              <motion.img
                src={s.image1}
                alt="Craftsmanship"
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>

            {/* Secondary Floating Image */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
              className="absolute bottom-0 left-0 w-[55%] h-[45%] rounded-2xl overflow-hidden shadow-xl z-10"
            >
              <img
                src={s.image2}
                alt="Fabric detail"
                className="w-full h-full object-fill"
              />
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              className="absolute top-1/2 left-[10%] transform -translate-y-1/2 text-white p-5 shadow-2xl z-20"
              style={{ background: '#1A1A18' }}
            >
              <p
                className="text-3xl font-bold"
                style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}
              >
                {s.stat.value}
              </p>
              <p
                className="text-xs text-white/70 mt-1"
                style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
              >
                {s.stat.label}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Material Icons Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12"
          style={{ borderTop: '1px solid rgba(26,26,24,0.12)' }}
        >
          {s.materials.map((item) => (
            <div key={item.label} className="text-center">
              <p
                className="font-semibold mb-1"
                style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
              >
                {item.label}
              </p>
              <p
                className="text-sm"
                style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BrandStory;
