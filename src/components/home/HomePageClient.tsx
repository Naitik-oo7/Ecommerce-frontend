'use client';

import { useGetProductsQuery } from '@/services/api/productsApi';
import { useWishlist } from '@/hooks/useWishlist';
import { extractData } from '@/lib/api-utils';
import type { Product } from '@/types';

import { CinematicHero } from '@/components/hero/CinematicHero';
import { TrustMarquee } from '@/components/trust/TrustMarquee';
import { FeaturedCollections } from '@/components/collections/FeaturedCollections';
import { BestSellers } from '@/components/products';
import { BrandStory } from '@/components/story/BrandStory';
import { HorizontalGallery } from '@/components/gallery/HorizontalGallery';
import { JournalSection } from '@/components/journal/JournalSection';
import { SocialProof } from '@/components/social/SocialProof';
import { NewsletterSection } from '@/components/newsletter/NewsletterSection';

export default function HomePageClient() {
  const { data: productsData, isLoading } = useGetProductsQuery({
    isBestseller: 'true',
    sortBy: 'avgRating',
    sortOrder: 'desc',
    limit: 8,
  });

  const { wishlistIds, toggleWishlist } = useWishlist();
  const products = extractData<Product[]>(productsData) ?? [];

  return (
    <div className="min-h-screen">
      <CinematicHero />
      <TrustMarquee />
      <FeaturedCollections />
      <BestSellers
        products={products}
        wishlistIds={wishlistIds}
        onToggleWishlist={toggleWishlist}
        isLoading={isLoading}
      />
      <BrandStory />
      <HorizontalGallery />
      <JournalSection />
      <SocialProof />
      <NewsletterSection />
    </div>
  );
}
