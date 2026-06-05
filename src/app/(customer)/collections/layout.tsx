import type { Metadata } from 'next';

const title = 'Collections';
const description =
  'Explore curated MONO collections across every corner of the modern wardrobe — shop by category.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
