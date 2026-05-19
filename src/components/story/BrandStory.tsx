'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const BrandStory = () => {
  return (
    <section className="py-20 md:py-32 bg-white overflow-hidden">
      <div className="container-mono">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-6 block">
              Our Philosophy
            </span>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#111111] leading-[1.1] mb-8">
              Designed with intention.
              <br />
              <span className="text-[#6B6B6B]">Built to last.</span>
            </h2>

            <div className="space-y-6 text-[#6B6B6B] leading-relaxed mb-10">
              <p>
                Every piece in our collection is thoughtfully designed and meticulously crafted. 
                We partner with artisans who share our commitment to excellence, ensuring each 
                garment meets our uncompromising standards.
              </p>
              <p>
                From fabric selection to final stitching, we maintain the highest standards. 
                Because you deserve clothing that feels as good as it looks—pieces that become 
                more cherished with every wear.
              </p>
            </div>

            <Link href="/about">
              <motion.span 
                className="inline-flex items-center gap-2 text-[#111111] font-medium hover:text-[#C7A27C] transition-colors cursor-pointer group"
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
                src="https://images.unsplash.com/photo-1558618047-f4b5110f757d?w=800&q=80"
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
                src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80"
                alt="Fabric detail"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              className="absolute top-1/2 left-[10%] transform -translate-y-1/2 bg-[#111111] text-white rounded-xl p-5 shadow-2xl z-20"
            >
              <p className="text-3xl font-bold">12+</p>
              <p className="text-xs text-white/70 mt-1">Years of Excellence</p>
            </motion.div>
          </div>
        </div>

        {/* Material Icons Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-[#111111]/10"
        >
          {[
            { label: 'Organic Cotton', desc: 'Sustainably sourced' },
            { label: 'Linen Blend', desc: 'Breathable comfort' },
            { label: 'Recycled Wool', desc: 'Eco-conscious warmth' },
            { label: 'Silk Touch', desc: 'Luxurious feel' },
          ].map((item, index) => (
            <div key={item.label} className="text-center">
              <p className="font-semibold text-[#111111] mb-1">{item.label}</p>
              <p className="text-sm text-[#6B6B6B]">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BrandStory;
