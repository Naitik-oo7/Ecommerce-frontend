import type { Metadata } from 'next';

const title = 'About';
const description =
  'Discover the MONO story — our philosophy of intentional design, sustainable craftsmanship, and timeless essentials built to last.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
