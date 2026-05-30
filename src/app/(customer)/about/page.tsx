'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Gem, Heart, Globe } from 'lucide-react';
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

const values = [
  {
    icon: Gem,
    title: 'Uncompromising Quality',
    desc: 'We work only with premium materials and skilled artisans who meet our exacting standards at every step of production.',
  },
  {
    icon: Leaf,
    title: 'Sustainable Practices',
    desc: 'From organic fabrics to carbon-neutral shipping, every decision we make considers our impact on the planet.',
  },
  {
    icon: Heart,
    title: 'Made With Care',
    desc: 'Each piece is crafted with intention — designed to outlast trends and become a permanent part of your wardrobe.',
  },
  {
    icon: Globe,
    title: 'Responsible Sourcing',
    desc: 'We partner with certified ethical suppliers across the globe, ensuring fair wages and safe working conditions.',
  },
];

const milestones = [
  { year: '2012', event: 'Founded in a small studio in Mumbai with a vision for mindful luxury.' },
  { year: '2015', event: 'Launched our first sustainable linen collection — sold out in 72 hours.' },
  { year: '2018', event: 'Achieved carbon-neutral shipping across all domestic orders.' },
  { year: '2021', event: 'Expanded internationally, shipping to 40+ countries.' },
  { year: '2024', event: 'Reached 50,000 customers and certified B-Corp status.' },
  { year: '2026', event: 'Launched our digital flagship — a new chapter in conscious fashion.' },
];

const team = [
  {
    name: 'Aryan Mehta',
    role: 'Founder & Creative Director',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    quote: 'Fashion should feel like a choice, not a compromise.',
  },
  {
    name: 'Priya Sharma',
    role: 'Head of Sustainability',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    quote: 'Every thread we choose is a vote for the world we want.',
  },
  {
    name: 'Rohan Das',
    role: 'Lead Designer',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    quote: 'Simplicity is the ultimate sophistication.',
  },
];

const EYEBROW = 'text-xs font-semibold tracking-[0.2em] uppercase mb-4 block';
const EYEBROW_STYLE = { color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' };
const BODY_STYLE = { color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' };

export default function AboutPage() {
  const { data: storyData } = useGetSettingQuery('brand_story');
  const { data: valuesData } = useGetSettingQuery('our_values');
  const s = (storyData as typeof defaultStory | undefined) || defaultStory;
  const dynamicValues = (valuesData as typeof values | undefined) || values;

  return (
    <div className="min-h-screen" style={{ background: '#F6F3EE' }}>

      {/* ── Hero ── */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <motion.img
          src={s.image1}
          alt="About MONO"
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,26,24,0.78) 0%, rgba(26,26,24,0.28) 55%, transparent 100%)' }} />
        <div className="absolute inset-0 flex items-end">
          <div className="container-mono pb-16 md:pb-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className={EYEBROW} style={EYEBROW_STYLE}>
                {s.eyebrow}
              </span>
              <h1
                className="text-white leading-[1.05]"
                style={{
                  fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                  fontSize: 'clamp(2.8rem, 6vw, 5rem)',
                  fontWeight: 700,
                }}
              >
                {s.headline}
                <br />
                <em className="font-normal italic" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.subheadline}</em>
              </h1>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-8" style={{ background: '#1A1A18' }}>
        <div className="container-mono">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50K+', label: 'Happy Customers' },
              { value: '12+', label: 'Years of Craft' },
              { value: '40+', label: 'Countries' },
              { value: '100%', label: 'Ethical Sourcing' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <p
                  className="text-3xl md:text-4xl font-bold text-white mb-1"
                  style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}
                >
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container-mono">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className={EYEBROW} style={EYEBROW_STYLE}>
                Our Story
              </span>
              <h2
                className="leading-[1.05] mb-8"
                style={{
                  fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                  fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                  fontWeight: 700,
                  color: '#1A1A18',
                }}
              >
                Born from a belief that<br />
                <em className="font-normal italic" style={{ color: '#6B6560' }}>less is more.</em>
              </h2>
              <div className="space-y-5 leading-relaxed text-base" style={BODY_STYLE}>
                <p>{s.body1}</p>
                <p>{s.body2}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-[480px]"
            >
              <div className="absolute top-0 right-0 w-[80%] h-[70%] rounded-2xl overflow-hidden shadow-2xl">
                <img src={s.image1} alt="Craftsmanship" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 left-0 w-[55%] h-[50%] rounded-2xl overflow-hidden shadow-xl">
                <img src={s.image2} alt="Materials" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-1/2 left-[12%] -translate-y-1/2 text-white p-5 shadow-2xl z-10" style={{ background: '#1A1A18' }}>
                <p
                  className="text-3xl font-bold"
                  style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}
                >
                  {s.stat.value}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
                  {s.stat.label}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Our Values ── */}
      <section className="py-20 md:py-32" style={{ background: '#F6F3EE' }}>
        <div className="container-mono">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className={EYEBROW} style={EYEBROW_STYLE}>
              What We Stand For
            </span>
            <h2
              className="leading-[1.05]"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 700,
                color: '#1A1A18',
              }}
            >
              Our Values
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dynamicValues.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="bg-white rounded-2xl p-8 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: '#F0ECE4' }}>
                    <Icon className="h-6 w-6" style={{ color: '#C8703A' }} />
                  </div>
                  <h3
                    className="text-base font-bold mb-3"
                    style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                  >
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={BODY_STYLE}>
                    {v.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Materials ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-mono">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <span className={EYEBROW} style={EYEBROW_STYLE}>
              What We Use
            </span>
            <h2
              className="leading-[1.05]"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 700,
                color: '#1A1A18',
              }}
            >
              Our Materials
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {s.materials.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="text-center p-6 rounded-2xl border transition-colors hover:border-[#C8703A]"
                style={{ borderColor: '#E8E0D5' }}
              >
                <p className="font-bold mb-1" style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
                  {m.label}
                </p>
                <p className="text-sm" style={BODY_STYLE}>{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-20 md:py-32" style={{ background: '#F6F3EE' }}>
        <div className="container-mono max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className={EYEBROW} style={EYEBROW_STYLE}>
              How We Got Here
            </span>
            <h2
              className="leading-[1.05]"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 700,
                color: '#1A1A18',
              }}
            >
              Our Journey
            </h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-[60px] top-0 bottom-0 w-px md:left-1/2" style={{ background: '#E2D9CE' }} />
            <div className="space-y-10">
              {milestones.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className={`flex items-start gap-8 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className={`flex-1 pb-2 pl-20 md:pl-0 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <span
                      className="text-xs font-bold tracking-widest uppercase"
                      style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                    >
                      {m.year}
                    </span>
                    <p className="mt-1 leading-relaxed text-sm" style={BODY_STYLE}>{m.event}</p>
                  </div>
                  <div className="absolute left-[52px] mt-1 md:static md:flex-shrink-0 md:flex md:items-start md:justify-center md:w-8">
                    <div className="w-4 h-4 rounded-full border-4 border-[#F6F3EE] shadow-sm mt-1" style={{ background: '#C8703A' }} />
                  </div>
                  <div className="hidden md:block flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container-mono">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className={EYEBROW} style={EYEBROW_STYLE}>
              The People Behind MONO
            </span>
            <h2
              className="leading-[1.05]"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 700,
                color: '#1A1A18',
              }}
            >
              Meet the Team
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="text-center group"
              >
                <div className="relative w-48 h-48 mx-auto mb-6 rounded-2xl overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-[#1A1A18]/0 group-hover:bg-[#1A1A18]/15 transition-colors duration-300" />
                </div>
                <h3
                  className="text-lg font-bold mb-1"
                  style={{ color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                >
                  {member.name}
                </h3>
                <p
                  className="text-sm font-medium mb-3"
                  style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                >
                  {member.role}
                </p>
                <p className="text-sm italic" style={BODY_STYLE}>&ldquo;{member.quote}&rdquo;</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28" style={{ background: '#1A1A18' }}>
        <div className="container-mono text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className={EYEBROW} style={EYEBROW_STYLE}>
              Join the Movement
            </span>
            <h2
              className="leading-[1.05] text-white mb-6"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                fontWeight: 700,
              }}
            >
              Wear What You Believe In.
            </h2>
            <p className="text-lg max-w-lg mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
              Explore our latest collection of thoughtfully crafted essentials.
            </p>
            <Link href="/products">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-10 py-4 text-sm font-medium cursor-pointer transition-opacity hover:opacity-80"
                style={{
                  background: '#F6F3EE',
                  color: '#1A1A18',
                  fontFamily: 'var(--font-body, Jost, sans-serif)',
                  letterSpacing: '0.06em',
                }}
              >
                Shop the Collection
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
