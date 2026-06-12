'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Check } from 'lucide-react';
import { useSubscribeMutation } from '@/services/api/newsletterApi';
import { useGetSettingQuery } from '@/services/api/settingsApi';

export const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [subscribe, { isLoading }] = useSubscribeMutation();
  const { data: generalData } = useGetSettingQuery('general');
  const g = generalData as { newsletterHeadline?: string; newsletterSubtext?: string } | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await subscribe({ email }).unwrap();
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 3000);
    } catch {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section className="relative py-12 md:py-18 lg:py-24 overflow-hidden" style={{ background: '#0F0F0F' }}>
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'rgba(200,112,58,0.08)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(200,112,58,0.04)' }} />
      </div>

      <div className="container-mono relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-6 block"
              style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Stay Connected
            </span>

            <h2
              className="leading-[1.05] text-white mb-6"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2.2rem, 4vw, 3.8rem)',
                fontWeight: 700,
              }}
            >
              {g?.newsletterHeadline || "Stay close to what’s next."}
            </h2>

            <p
              className="text-lg mb-10 max-w-lg mx-auto"
              style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              {g?.newsletterSubtext || 'Be the first to know about new collections, exclusive offers, and style inspiration.'}
            </p>
          </motion.div>

          {/* Newsletter Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <div className="relative flex-1">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-6 transition-all duration-300 focus-visible:ring-0 focus-visible:ring-offset-0 ${
                  isFocused ? 'border-[#C8703A] shadow-[0_0_20px_rgba(200,112,58,0.25)]' : ''
                }`}
                style={{ fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                required
              />
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isSubmitted || isLoading}
                className={`h-14 px-8 rounded-full font-medium transition-all duration-300 ${
                  isSubmitted
                    ? 'bg-green-500 hover:bg-green-500'
                    : 'bg-[#C8703A] hover:bg-[#b5632f] text-white'
                }`}
                style={{ fontFamily: 'var(--font-body, Jost, sans-serif)', letterSpacing: '0.06em' }}
              >
                {isSubmitted ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Subscribed
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Trust Text */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm mt-6"
            style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
          >
            Join 50,000+ subscribers. No spam, unsubscribe anytime.
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
