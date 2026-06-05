import type { Metadata } from 'next';

const title = 'Order Confirmed';
const description = 'Your MONO order has been placed successfully.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function OrderPlacedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
