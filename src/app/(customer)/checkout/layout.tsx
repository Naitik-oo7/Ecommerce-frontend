import type { Metadata } from 'next';

const title = 'Checkout';
const description = 'Complete your MONO order — shipping, payment, and order review.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
