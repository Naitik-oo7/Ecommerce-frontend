import type { Metadata } from 'next';

const title = 'Shop All Products';
const description =
  'Browse the full MONO collection — premium essentials across clothing, footwear, and accessories. Filter by category, price, and more.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
