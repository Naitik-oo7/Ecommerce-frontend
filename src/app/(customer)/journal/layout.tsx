import type { Metadata } from 'next';

const title = 'The Journal';
const description =
  'Stories, style guides, and sustainability notes from MONO — insights for the modern, conscious wardrobe.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
