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
      value: g?.contactAddress || '12, Pali Hill, Bandra West, Mumbai 400050',
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

  return (
    <div className="min-h-screen bg-[#F6F3EE]">

      {/* ── Hero ── */}
      <section className="bg-[#111111] py-20 md:py-28">
        <div className="container-mono text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-4 block">
              Get in Touch
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-[0.95] tracking-tight mb-6">
              We&apos;d love to<br />
              <span className="text-white/50">hear from you.</span>
            </h1>
            <p className="text-white/50 text-lg max-w-md mx-auto">
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
                  className="group flex flex-col items-center text-center p-8 border border-[#E8E0D5] rounded-2xl hover:border-[#C7A27C] hover:shadow-md transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-[#F6F3EE] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#C7A27C]/10 transition-colors">
                    <Icon className="h-5 w-5 text-[#C7A27C]" />
                  </div>
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C7A27C] mb-2">{item.label}</p>
                  <p className="text-sm text-[#444444] leading-relaxed">{item.value}</p>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Contact Form ── */}
      <section className="py-16 md:py-24 bg-[#F6F3EE]">
        <div className="container-mono max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-4 block">
              Send a Message
            </span>
            <h2 className="text-4xl font-bold text-[#111111]">Contact Form</h2>
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
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-[#111111] mb-3">Message Received!</h3>
                <p className="text-[#6B6B6B] max-w-sm mb-8">
                  Thank you for reaching out. We&apos;ll get back to you within 1–2 business days.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-8 py-3 bg-[#111111] hover:bg-[#222222] text-white font-medium rounded-full transition-colors text-sm"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {errors.form && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {errors.form}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold tracking-[0.1em] uppercase text-[#6B6B6B] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Aryan Mehta"
                      className={`w-full px-4 py-3 rounded-xl border bg-[#F6F3EE] text-[#111111] placeholder:text-[#AAAAAA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C7A27C]/40 transition-all ${errors.name ? 'border-red-400' : 'border-[#E8E0D5]'}`}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-[0.1em] uppercase text-[#6B6B6B] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="aryan@example.com"
                      className={`w-full px-4 py-3 rounded-xl border bg-[#F6F3EE] text-[#111111] placeholder:text-[#AAAAAA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C7A27C]/40 transition-all ${errors.email ? 'border-red-400' : 'border-[#E8E0D5]'}`}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-[0.1em] uppercase text-[#6B6B6B] mb-2">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border bg-[#F6F3EE] text-[#111111] text-sm focus:outline-none focus:ring-2 focus:ring-[#C7A27C]/40 transition-all ${errors.subject ? 'border-red-400' : 'border-[#E8E0D5]'}`}
                  >
                    <option value="">Select a subject…</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-[0.1em] uppercase text-[#6B6B6B] mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us how we can help…"
                    className={`w-full px-4 py-3 rounded-xl border bg-[#F6F3EE] text-[#111111] placeholder:text-[#AAAAAA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C7A27C]/40 transition-all resize-none ${errors.message ? 'border-red-400' : 'border-[#E8E0D5]'}`}
                  />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#111111] hover:bg-[#222222] disabled:bg-[#888888] text-white font-semibold rounded-full transition-colors text-sm cursor-pointer disabled:cursor-not-allowed"
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
