'use client';

import { useGetProductsQuery } from '@/services/api/productsApi';
import { useWishlist } from '@/hooks/useWishlist';
import { extractData } from '@/lib/api-utils';

// Premium Components
import { CinematicHero } from '@/components/hero/CinematicHero';
import { TrustMarquee } from '@/components/trust/TrustMarquee';
import { FeaturedCollections } from '@/components/collections/FeaturedCollections';
import { BestSellers } from '@/components/products';
import { BrandStory } from '@/components/story/BrandStory';
import { HorizontalGallery } from '@/components/gallery/HorizontalGallery';
import { JournalSection } from '@/components/journal/JournalSection';
import { SocialProof } from '@/components/social/SocialProof';
import { NewsletterSection } from '@/components/newsletter/NewsletterSection';

// ============================================
// MONO Premium Homepage
// Minimal Luxury E-commerce Experience
// ============================================

export default function HomePage() {
  const { data: productsData, isLoading } = useGetProductsQuery({
    isBestseller: 'true',
    sortBy: 'avgRating',
    sortOrder: 'desc',
    limit: 8,
  });

  const { wishlistIds, toggleWishlist } = useWishlist();

  const products = extractData<{
    id: number;
    name: string;
    slug: string;
    price: string;
    comparePrice?: string;
    stock: number;
    images?: string[];
    category?: { name: string };
    avgRating?: number;
    reviewCount?: number;
  }[]>(productsData) ?? [];

  return (
    <div className="min-h-screen">
      {/* 1. Cinematic Hero - Split Screen with Mouse Parallax */}
      <CinematicHero />

      {/* 2. Trust Marquee - Animated infinite scroll */}
      <TrustMarquee />

      {/* 3. Featured Collections - Editorial Cards */}
      <FeaturedCollections />

      {/* 4. Best Sellers - Premium Product Grid */}
      <BestSellers
        products={products}
        wishlistIds={wishlistIds}
        onToggleWishlist={toggleWishlist}
        isLoading={isLoading}
      />

      {/* 5. Brand Story - Two Column with Parallax Images */}
      <BrandStory />

      {/* 5.5 WOW Section - Horizontal Scroll Gallery (GSAP ScrollTrigger) */}
      <HorizontalGallery />

      {/* 6. Journal / Editorial Section */}
      <JournalSection />

      {/* 7. Social Proof - Instagram-style Grid */}
      <SocialProof />

      {/* 8. Newsletter - Cinematic Dark Section */}
      <NewsletterSection />
    </div>
  );
}
