import type { Metadata } from 'next';

const title = 'Notifications';
const description = 'Stay up to date with order updates, offers, and account alerts from MONO.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
