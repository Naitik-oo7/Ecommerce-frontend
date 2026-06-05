import type { Metadata } from 'next';
import HomePageClient from '@/components/home/HomePageClient';

const title = 'Home';
const description =
  'Discover MONO — curated essentials for the modern wardrobe. Shop bestsellers, explore collections, and find timeless pieces crafted with care.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function HomePage() {
  return <HomePageClient />;
}
