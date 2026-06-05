import type { Metadata } from 'next';

const title = 'Wishlist';
const description = 'Save and revisit your favourite MONO pieces.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
