import type { Metadata } from 'next';

const title = 'Shopping Cart';
const description = 'Review items in your MONO shopping bag and proceed to checkout.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
