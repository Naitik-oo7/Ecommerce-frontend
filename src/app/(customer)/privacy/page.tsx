'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ChevronRight, Home, Mail } from 'lucide-react';

const LAST_UPDATED = 'May 21, 2026';

const sections = [
  {
    id: 'introduction',
    title: '1. Introduction',
    content: `Welcome to MONO Curated ("MONO", "we", "us", or "our"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase from us.\n\nPlease read this policy carefully. By using our services, you agree to the practices described here. If you disagree, please discontinue use of our platform.`,
  },
  {
    id: 'data-collected',
    title: '2. Information We Collect',
    subsections: [
      {
        title: 'Information You Provide Directly',
        items: [
          'Account details: name, email address, and password when you register',
          'Profile information: display name, optional avatar',
          'Shipping addresses: street, city, state, pincode, country',
          'Payment information: processed securely via Razorpay — we never store raw card data',
          'Communications: messages you send to our support team',
        ],
      },
      {
        title: 'Information Collected Automatically',
        items: [
          'Device and browser type, operating system, IP address',
          'Pages visited, time spent, referring URLs (via server logs)',
          'Cart and wishlist activity',
          'Cookie identifiers and session tokens (see Section 5)',
        ],
      },
    ],
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    items: [
      'To process and fulfil your orders, including shipping and payment confirmations',
      'To manage your account, authenticate sessions, and keep it secure',
      'To send transactional emails (order updates, shipping notifications)',
      'To personalise your shopping experience and product recommendations',
      'To respond to customer support requests',
      'To detect, prevent, and address fraud or security issues',
      'To comply with applicable legal obligations',
      'To improve our website, services, and product offerings through analytics',
    ],
  },
  {
    id: 'sharing',
    title: '4. How We Share Your Information',
    content: `We do not sell your personal data. We share information only in the following limited circumstances:`,
    items: [
      'Service Providers: Trusted vendors who assist in operating our platform (e.g., hosting, email delivery, analytics). They are bound by data processing agreements.',
      'Payment Processors: Razorpay processes all payments. Their Privacy Policy governs data they collect. We only receive transaction confirmation and an order reference.',
      'Shipping Partners: We share your name and address with courier services to fulfil deliveries.',
      'Legal Requirements: We may disclose information if required by law, court order, or to protect rights and safety.',
      'Business Transfers: In the event of a merger or acquisition, your data may be transferred as part of business assets.',
    ],
  },
  {
    id: 'cookies',
    title: '5. Cookies & Tracking',
    content: `We use cookies and similar technologies to enhance your experience. Here is what we use:`,
    subsections: [
      {
        title: 'Essential Cookies',
        items: [
          'Authentication tokens (JWT) stored in localStorage to keep you logged in',
          'Session cookies required for the shopping cart and checkout to function',
        ],
      },
      {
        title: 'Analytics Cookies',
        items: [
          'Aggregate usage data to understand which pages are popular and improve navigation',
          'No personally identifiable information is sent to analytics providers',
        ],
      },
    ],
    footer: 'You can control cookies through your browser settings. Disabling essential cookies may affect site functionality.',
  },
  {
    id: 'third-party',
    title: '6. Third-Party Services',
    content: `Our platform integrates with the following third-party services. Please review their respective privacy policies:`,
    items: [
      'Razorpay (Payment Processing) — razorpay.com/privacy',
      'Cloudinary / Image CDN (Product Images) — for optimised image delivery',
      'Email service provider — for transactional notifications',
    ],
    footer: 'We are not responsible for the privacy practices of third-party websites linked from our platform.',
  },
  {
    id: 'retention',
    title: '7. Data Retention',
    content: `We retain your personal data for as long as your account is active or as needed to provide services. Specifically:\n\n- Account data is retained while your account exists and for 2 years after deletion for legal compliance.\n- Order records are retained for 7 years as required by Indian financial regulations.\n- You may request deletion of your account at any time (see Section 8). Note that some data may be retained for legal obligations.`,
  },
  {
    id: 'your-rights',
    title: '8. Your Rights',
    content: `Depending on your jurisdiction, you may have the following rights regarding your personal data:`,
    items: [
      'Access: Request a copy of the personal data we hold about you',
      'Correction: Ask us to correct inaccurate or incomplete information',
      'Deletion: Request deletion of your personal data ("right to be forgotten")',
      'Portability: Receive your data in a structured, machine-readable format',
      'Objection: Object to processing of your data for direct marketing',
      'Withdraw Consent: Withdraw consent at any time where we rely on it',
    ],
    footer: 'To exercise any of these rights, contact us at privacy@mono.com. We will respond within 30 days.',
  },
  {
    id: 'security',
    title: '9. Security',
    content: `We implement industry-standard security measures including:\n\n- HTTPS encryption for all data in transit\n- Hashed passwords (bcrypt) — we never store plain-text passwords\n- JWT tokens with expiry for authentication\n- Regular security audits and dependency updates\n\nWhile we take all reasonable precautions, no method of internet transmission is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    id: 'children',
    title: '10. Children\'s Privacy',
    content: `Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such data, please contact us and we will delete it promptly.`,
  },
  {
    id: 'changes',
    title: '11. Changes to This Policy',
    content: `We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. When we make material changes, we will notify you via email or a prominent notice on our website. The "Last Updated" date at the top of this page indicates when the policy was last revised.\n\nYour continued use of our services after any changes constitutes acceptance of the revised policy.`,
  },
  {
    id: 'contact',
    title: '12. Contact Us',
    content: `If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact our Privacy team:`,
    contact: true,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-[#FAFAF8]"
    >
      {/* Hero */}
      <div className="bg-white border-b border-[#E5E2DD]">
        <div className="container-mono py-10 md:py-16">
          <nav className="flex items-center gap-1.5 text-xs text-[#9B9B9B] mb-6">
            <Link href="/" className="flex items-center gap-1 hover:text-[#111111] transition-colors">
              <Home className="h-3 w-3" />
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#111111] font-medium">Privacy Policy</span>
          </nav>

          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-[#C7A27C]/10 flex items-center justify-center flex-shrink-0 mt-1">
              <Shield className="h-6 w-6 text-[#C7A27C]" />
            </div>
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C7A27C] mb-2 block">
                Legal
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-[#111111] leading-tight mb-2">
                Privacy Policy
              </h1>
              <p className="text-sm text-[#6B6B6B]">Last updated: {LAST_UPDATED}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container-mono py-10 md:py-16">
        <div className="flex gap-12 items-start">

          {/* Sticky TOC — desktop */}
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#9B9B9B] mb-4">Contents</p>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-[#6B6B6B] hover:text-[#C7A27C] transition-colors py-1 border-l-2 border-transparent hover:border-[#C7A27C] pl-3"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 max-w-2xl">
            {/* Intro callout */}
            <div className="bg-[#C7A27C]/8 border border-[#C7A27C]/20 rounded-2xl p-5 mb-10 text-sm text-[#4A3728] leading-relaxed">
              <strong className="font-semibold">Your privacy matters to us.</strong> MONO Curated is committed to transparency about how we handle your data. This document explains your rights and our responsibilities in plain language.
            </div>

            <div className="space-y-12">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-lg font-bold text-[#111111] mb-4 pb-2 border-b border-[#E5E2DD]">
                    {section.title}
                  </h2>

                  {section.content && (
                    <p className="text-sm text-[#4A4A4A] leading-relaxed mb-4 whitespace-pre-line">
                      {section.content}
                    </p>
                  )}

                  {section.items && (
                    <ul className="space-y-2 mb-4">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-[#4A4A4A] leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C7A27C] flex-shrink-0 mt-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.subsections && section.subsections.map((sub, si) => (
                    <div key={si} className="mb-5">
                      <h3 className="text-sm font-semibold text-[#111111] mb-2">{sub.title}</h3>
                      <ul className="space-y-2">
                        {sub.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-[#4A4A4A] leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C7A27C] flex-shrink-0 mt-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {section.footer && (
                    <p className="text-xs text-[#6B6B6B] italic mt-3">{section.footer}</p>
                  )}

                  {section.contact && (
                    <div className="bg-white border border-[#E5E2DD] rounded-2xl p-6 mt-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-full bg-[#C7A27C]/10 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-[#C7A27C]" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#111111]">MONO Privacy Team</p>
                          <a href="mailto:privacy@mono.com" className="text-sm text-[#C7A27C] hover:underline">privacy@mono.com</a>
                        </div>
                      </div>
                      <p className="text-sm text-[#6B6B6B] leading-relaxed">
                        We aim to respond to all inquiries within <strong className="text-[#111111]">30 days</strong>. For urgent matters related to data breaches or security, please mark your email as <em>URGENT</em>.
                      </p>
                      <div className="mt-4 pt-4 border-t border-[#E5E2DD]">
                        <p className="text-xs text-[#9B9B9B]">
                          MONO Curated · India · Governed by the Information Technology Act, 2000 and applicable data protection regulations.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Bottom nav */}
            <div className="mt-16 pt-8 border-t border-[#E5E2DD] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
              <p className="text-[#9B9B9B]">© {new Date().getFullYear()} MONO Curated. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="/contact" className="text-[#C7A27C] hover:underline">Contact Us</Link>
                <Link href="/" className="text-[#6B6B6B] hover:text-[#111111] transition-colors">Back to Shop</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
