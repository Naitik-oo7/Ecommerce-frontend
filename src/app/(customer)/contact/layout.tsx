import type { Metadata } from 'next';

const title = 'Contact';
const description =
  'Get in touch with the MONO team — questions about an order, our products, or anything else. We’re here to help.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
