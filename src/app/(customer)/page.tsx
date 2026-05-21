'use client';

import { useState } from 'react';
import { useGetProductsQuery } from '@/services/api/productsApi';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '@/services/api/wishlistApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { useRouter } from 'next/navigation';

// Premium Components
import { CinematicHero } from '@/components/hero/CinematicHero';
import { TrustMarquee } from '@/components/trust/TrustMarquee';
import { FeaturedCollections } from '@/components/collections/FeaturedCollections';
import { BestSellers } from '@/components/products/BestSellers';
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
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());

  const { data: productsData, isLoading } = useGetProductsQuery({
    isBestseller: 'true',
    sortBy: 'avgRating',
    sortOrder: 'desc',
    limit: 8,
  });

  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const products = (productsData as any)?.data || [];

  const handleToggleWishlist = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      if (wishlistIds.has(productId)) {
        await removeFromWishlist(productId).unwrap();
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await addToWishlist(productId).unwrap();
        setWishlistIds((prev) => new Set(prev).add(productId));
      }
    } catch {}
  };

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
        onToggleWishlist={handleToggleWishlist}
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
