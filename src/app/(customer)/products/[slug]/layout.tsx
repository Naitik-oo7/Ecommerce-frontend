import type { Metadata } from 'next';

interface PdpMedia {
  url: string;
  isPrimary?: boolean;
  type?: string;
}
interface PdpProduct {
  name?: string;
  description?: string;
  media?: PdpMedia[];
}

async function fetchProduct(slug: string): Promise<PdpProduct | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555';
    const res = await fetch(`${base}/api/v1/products/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as PdpProduct;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product?.name) {
    return { title: 'Product' };
  }

  const description = (product.description || `Shop ${product.name} at MONO.`).slice(0, 160);
  const image = product.media?.find((m) => m.isPrimary)?.url || product.media?.[0]?.url;

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} · MONO`,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      title: `${product.name} · MONO`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
