'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Check } from 'lucide-react';

export const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section className="relative py-24 md:py-32 bg-[#0F0F0F] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#C7A27C]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#C7A27C]/5 blur-[100px]" />
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
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-6 block">
              Stay Connected
            </span>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
              Stay close to what&apos;s next.
            </h2>
            
            <p className="text-white/60 text-lg mb-10 max-w-lg mx-auto">
              Be the first to know about new collections, exclusive offers, and style inspiration.
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
                className={`h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-6 transition-all duration-300 ${
                  isFocused ? 'border-[#C7A27C] shadow-[0_0_20px_rgba(199,162,124,0.3)]' : ''
                }`}
                required
              />
            </div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                type="submit"
                disabled={isSubmitted}
                className={`h-14 px-8 rounded-full font-medium transition-all duration-300 ${
                  isSubmitted 
                    ? 'bg-green-500 hover:bg-green-500' 
                    : 'bg-[#C7A27C] hover:bg-[#b08d68] text-[#111111]'
                }`}
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
            className="text-white/40 text-sm mt-6"
          >
            Join 50,000+ subscribers. No spam, unsubscribe anytime.
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
