'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetCategoryTreeQuery, CategoryTreeItem } from '@/services/api/categoriesApi';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CategoryNavProps {
  scrolled?: boolean;
}

// Static nav items that always appear
const staticNavItems = [
  { label: 'ALL PRODUCTS', href: '/products', isHighlighted: false },
  { label: 'NEW IN', href: '/products?sortBy=createdAt&sortOrder=desc', isHighlighted: false },
];

// Secondary nav items
const secondaryNavItems: { label: string; href: string; isHighlighted: boolean }[] = [];

// Special promotional nav items
const promoNavItems = [
  { label: 'SALE', href: '/products?onSale=true', isHighlighted: true, color: 'text-red-500' },
];

export default function CategoryNav({ scrolled = false }: CategoryNavProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryTreeItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: categoryTree, isLoading } = useGetCategoryTreeQuery({ limit: 10 });

  const EXCLUDED = ['journal', 'about'];
  const categories = (categoryTree || []).filter(
    (c) => !EXCLUDED.includes(c.name.toLowerCase())
  );

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleNavMouseEnter = (category: CategoryTreeItem) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveCategory(category);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
      setActiveCategory(null);
    }, 200);
  };

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  if (isLoading) {
    return (
      <div className="sticky top-14 md:top-16 z-40 border-b border-border/50 bg-background">
        <div className="container-mono">
          <div className="flex items-center justify-center h-11 gap-8">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={navRef}
      className="sticky top-14 md:top-16 z-40"
      onMouseLeave={handleMouseLeave}
    >
      {/* Horizontal Category Navigation Bar */}
      <div className={cn(
        "border-b border-border/50 transition-all duration-300",
        scrolled ? "bg-background/95 backdrop-blur-sm shadow-sm" : "bg-white"
      )}>
        <div className="container-mono">
          <nav className="flex items-center justify-center h-11 overflow-x-auto scrollbar-hide">
            <ul className="flex items-center gap-1 sm:gap-2">
              {/* Static Items */}
              {staticNavItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold tracking-wider text-foreground hover:text-mono-terracotta transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}

              {/* Separator */}
              <li className="hidden sm:block px-2">
                <span className="w-px h-4 bg-border" />
              </li>

              {/* Dynamic Categories from API */}
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    onMouseEnter={() => handleNavMouseEnter(category)}
                    className={cn(
                      "flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold tracking-wider transition-colors whitespace-nowrap",
                      activeCategory?.id === category.id
                        ? "text-mono-terracotta"
                        : "text-foreground hover:text-mono-terracotta"
                    )}
                  >
                    {category.name.toUpperCase()}
                  </button>
                </li>
              ))}

              {/* Separator before secondary items */}
              {(secondaryNavItems.length > 0 || promoNavItems.length > 0) && categories.length > 0 && (
                <li className="hidden sm:block px-2">
                  <span className="w-px h-4 bg-border" />
                </li>
              )}

              {/* Secondary Links (Journal, About) */}
              {secondaryNavItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold tracking-wider text-foreground hover:text-mono-terracotta transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}

              {/* Promo/Sale Items */}
              {promoNavItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold tracking-wider transition-colors whitespace-nowrap",
                      item.color || "text-red-500 hover:text-red-600"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Full-Width Mega Menu Dropdown */}
      <AnimatePresence>
        {isDropdownOpen && activeCategory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/10"
              style={{ top: scrolled ? '115px' : '131px' }}
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Mega Menu Content */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 z-50 bg-white border-b border-border/50 shadow-xl"
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="container-mono py-8">
                <div className="grid grid-cols-12 gap-8">
                  {/* Left Column - Subcategories List */}
                  <div className="col-span-12 lg:col-span-3">
                    <h3 className="text-lg font-bold text-foreground mb-6 tracking-wide">
                      {activeCategory.name.toUpperCase()}
                    </h3>
                    <ul className="space-y-1">
                      <li>
                        <Link
                          href={`/products?category=${activeCategory.slug}`}
                          className="flex items-center py-2 text-sm font-semibold text-mono-terracotta hover:underline transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          EVERYTHING {activeCategory.name.toUpperCase()}
                        </Link>
                      </li>
                      {activeCategory.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/products?category=${child.slug}`}
                            className="flex items-center py-2 text-sm text-foreground/80 hover:text-mono-terracotta transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            {child.name.toUpperCase()}
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {/* Shop All Link */}
                    <div className="mt-6 pt-4 border-t border-border/50">
                      <Link
                        href={`/products?category=${activeCategory.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-mono-terracotta transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Shop All {activeCategory.name}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {/* Middle Columns - Additional Links (if needed) */}
                  <div className="hidden lg:block lg:col-span-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                      Trending Now
                    </h4>
                    <ul className="space-y-2">
                      <li>
                        <Link
                          href="/products?sortBy=createdAt&sortOrder=desc"
                          className="text-sm text-foreground/70 hover:text-mono-terracotta transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          New Arrivals
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/products?isBestseller=true"
                          className="text-sm text-foreground/70 hover:text-mono-terracotta transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Bestsellers
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/products?onSale=true"
                          className="text-sm text-red-500 hover:text-red-600 transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Sale
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Right Column - Featured Image */}
                  <div className="col-span-12 lg:col-span-6">
                    <Link
                      href={`/products?category=${activeCategory.slug}`}
                      className="block relative aspect-video lg:aspect-2/1 rounded-lg overflow-hidden group"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {activeCategory.imageUrl ? (
                        <Image
                          src={activeCategory.imageUrl}
                          alt={activeCategory.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-mono-cream to-mono-stone/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-mono-charcoal/30">
                            {activeCategory.name}
                          </span>
                        </div>
                      )}
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                      
                      {/* Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <p className="text-white text-sm font-medium mb-1">Explore</p>
                        <h4 className="text-white text-xl font-bold">
                          {activeCategory.name}
                        </h4>
                        {activeCategory.isFeatured && (
                          <span className="inline-block mt-2 px-2 py-1 bg-mono-terracotta text-white text-xs font-semibold rounded">
                            Featured
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Mini Promo Cards */}
                    {activeCategory.children.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {activeCategory.children.slice(0, 3).map((child) => (
                          <Link
                            key={child.id}
                            href={`/products?category=${child.slug}`}
                            className="block group"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                              {child.imageUrl ? (
                                <Image
                                  src={child.imageUrl}
                                  alt={child.name}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <span className="text-xs text-muted-foreground text-center px-2">
                                    {child.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="mt-2 text-xs font-medium text-center text-foreground group-hover:text-mono-terracotta transition-colors">
                              {child.name}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
