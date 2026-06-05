'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useSubmitContactMutation } from '@/services/api/contactApi';
import { useGetSettingQuery } from '@/services/api/settingsApi';

export default function ContactPage() {
  const { data: generalData } = useGetSettingQuery('general');
  const g = generalData as { contactEmail?: string; contactPhone?: string; contactAddress?: string } | undefined;

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: g?.contactEmail || 'hello@mono.com',
      href: `mailto:${g?.contactEmail || 'hello@mono.com'}`,
    },
    {
      icon: Phone,
      label: 'Phone',
      value: g?.contactPhone || '+91 98765 43210',
      href: `tel:${(g?.contactPhone || '+91 98765 43210').replace(/\s/g, '')}`,
    },
    {
      icon: MapPin,
      label: 'Address',
      value: g?.contactAddress || 'MONO Studio, Level 4, Indiranagar, Bengaluru 560038',
      href: 'https://maps.google.com',
    },
  ];

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitContact, { isLoading }] = useSubmitContactMutation();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.subject.trim() || form.subject.trim().length < 3) errs.subject = 'Subject must be at least 3 characters.';
    if (!form.message.trim() || form.message.trim().length < 10) errs.message = 'Message must be at least 10 characters.';
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    try {
      await submitContact(form).unwrap();
      setSubmitted(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setErrors({ form: apiError?.data?.message || 'Something went wrong. Please try again.' });
    }
  };

  const subjects = [
    'Order Inquiry',
    'Return & Exchange',
    'Product Question',
    'Shipping & Delivery',
    'Payment Issue',
    'Feedback',
    'Other',
  ];

  const INPUT_STYLE = { background: '#F6F3EE', color: '#1A1A18', fontFamily: 'var(--font-body, Jost, sans-serif)' };
  const LABEL_STYLE = { color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' };
  const INPUT_BASE = 'w-full px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8703A]/30 transition-all';

  return (
    <div className="min-h-screen" style={{ background: '#F6F3EE' }}>

      {/* ── Hero ── */}
      <section className="py-20 md:py-28" style={{ background: '#1A1A18' }}>
        <div className="container-mono text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-4 block"
              style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Get in Touch
            </span>
            <h1
              className="text-white leading-[1.05] mb-6"
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                fontWeight: 700,
              }}
            >
              We&apos;d love to
              <br />
              <em className="font-normal italic" style={{ color: 'rgba(255,255,255,0.4)' }}>hear from you.</em>
            </h1>
            <p
              className="text-lg max-w-md mx-auto"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Whether you have a question about an order, our products, or just want to say hello — we&apos;re here.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Contact Info Cards ── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-mono">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactInfo.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={item.label}
                  href={item.href}
                  target={item.icon === MapPin ? '_blank' : undefined}
                  rel={item.icon === MapPin ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="group flex flex-col items-center text-center p-8 border rounded-2xl hover:shadow-md transition-all duration-300"
                  style={{ borderColor: '#E8E0D5' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors"
                    style={{ background: '#F0ECE4' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: '#C8703A' }} />
                  </div>
                  <p
                    className="text-xs font-semibold tracking-[0.15em] uppercase mb-2"
                    style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
                  >
                    {item.label}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
                    {item.value}
                  </p>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Contact Form ── */}
      <section className="py-16 md:py-24" style={{ background: '#F6F3EE' }}>
        <div className="container-mono max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-4 block"
              style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
            >
              Send a Message
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
              Contact Form
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-sm p-8 md:p-12"
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center text-center py-10"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: '#F0ECE4' }}>
                  <CheckCircle className="h-8 w-8" style={{ color: '#C8703A' }} />
                </div>
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{ color: '#1A1A18', fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}
                >
                  Message Received!
                </h3>
                <p className="max-w-sm mb-8 text-sm" style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}>
                  Thank you for reaching out. We&apos;ll get back to you within 1–2 business days.
                </p>
                <motion.button
                  onClick={() => setSubmitted(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    background: '#1A1A18',
                    color: '#F6F3EE',
                    fontFamily: 'var(--font-body, Jost, sans-serif)',
                    letterSpacing: '0.06em',
                  }}
                >
                  Send Another Message
                </motion.button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {errors.form && (
                  <div className="p-4 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
                    {errors.form}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold tracking-[0.1em] uppercase mb-2" style={LABEL_STYLE}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Aryan Mehta"
                      className={`${INPUT_BASE} ${errors.name ? 'border-red-400' : 'border-[#E8E0D5]'}`}
                      style={INPUT_STYLE}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-[0.1em] uppercase mb-2" style={LABEL_STYLE}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="aryan@example.com"
                      className={`${INPUT_BASE} ${errors.email ? 'border-red-400' : 'border-[#E8E0D5]'}`}
                      style={INPUT_STYLE}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-[0.1em] uppercase mb-2" style={LABEL_STYLE}>
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className={`${INPUT_BASE} ${errors.subject ? 'border-red-400' : 'border-[#E8E0D5]'}`}
                    style={INPUT_STYLE}
                  >
                    <option value="">Select a subject…</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-[0.1em] uppercase mb-2" style={LABEL_STYLE}>
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us how we can help…"
                    className={`${INPUT_BASE} resize-none ${errors.message ? 'border-red-400' : 'border-[#E8E0D5]'}`}
                    style={INPUT_STYLE}
                  />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-4 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    background: '#1A1A18',
                    color: '#F6F3EE',
                    fontFamily: 'var(--font-body, Jost, sans-serif)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

    </div>
  );
}
