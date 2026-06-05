import type { Metadata } from 'next';

const title = 'Privacy Policy';
const description =
  'How MONO collects, uses, and safeguards your personal data, and the rights you have over your information.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} · MONO`, description },
  twitter: { title: `${title} · MONO`, description },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
