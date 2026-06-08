'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetCategoryTreeQuery, CategoryTreeItem } from '@/services/api/categoriesApi';
import { useGetProductsQuery } from '@/services/api/productsApi';
import { cn } from '@/lib/utils';
import {
  ShoppingCart, User, Menu, X, Heart, Package,
  LogOut, Settings, Bell, Search, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryNavProps {
  // Auth / user
  isAuthenticated: boolean;
  user?: { name?: string; email?: string; avatar?: string; role?: string } | null;
  // Counts
  cartCount: number;
  unreadCount: number;
  // Notifications
  notifications: any[];
  // Callbacks
  onSearch: (query: string) => void;
  onLogout: () => void;
  onNotificationClick: (n: any) => void;
  onMarkAllRead: () => void;
  // State
  scrolled?: boolean;
}

// ─── Static nav items ─────────────────────────────────────────────────────────

const staticNavItems = [
  { label: 'ALL PRODUCTS', href: '/products' },
  { label: 'NEW IN', href: '/products?sortBy=createdAt&sortOrder=desc' },
];

const promoNavItems = [
  { label: 'SALE', href: '/products?onSale=true', color: 'text-red-500' },
];

const EXCLUDED = ['journal', 'about'];

const formatINR = (value: number | string | null | undefined): string => {
  const n = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  return `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CategoryNav({
  isAuthenticated,
  user,
  cartCount,
  unreadCount,
  notifications,
  onSearch,
  onLogout,
  onNotificationClick,
  onMarkAllRead,
  scrolled = false,
}: CategoryNavProps) {
  // Category dropdown
  const [activeCategory, setActiveCategory] = useState<CategoryTreeItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Header UI state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Adaptive category fit — render only as many categories as fit the row.
  const centerNavRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const [visibleCatCount, setVisibleCatCount] = useState(99);

  const { data: categoryTree, isLoading } = useGetCategoryTreeQuery({
    limit: 10,
    withProducts: true,
    productsPerCategory: 4,
  });
  const categories = (categoryTree || []).filter(
    (c) => !EXCLUDED.includes(c.name.toLowerCase())
  );

  // Wishlist count (hook handles auth + fetching internally)
  const { count: wishlistCount } = useWishlist({ skip: !isAuthenticated });

  // Live typeahead search — debounce the input before querying the API.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: searchData, isFetching: isSearching } = useGetProductsQuery(
    { search: debouncedQuery, limit: 6 },
    { skip: debouncedQuery.length < 2 },
  );
  const searchResults = ((searchData as { data?: any[] } | undefined)?.data ?? []) as any[];

  // Close the search overlay on Escape regardless of which element has focus.
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  // Cleanup timeout
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node))
        setNotificationsOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Measure how many category items fit in the available row and trim the rest.
  const catKey = categories.map((c) => c.id).join(',');
  useEffect(() => {
    const compute = () => {
      const nav = centerNavRef.current;
      const measure = measureRef.current;
      if (!nav || !measure) return;
      const avail = nav.clientWidth - 8; // small safety margin
      let fixed = 0;
      const catWidths: number[] = [];
      Array.from(measure.children).forEach((el) => {
        const li = el as HTMLElement;
        const w = li.getBoundingClientRect().width + 4; // + gap-1
        if (li.dataset.kind === 'cat') catWidths.push(w);
        else fixed += w;
      });
      let remaining = avail - fixed;
      let count = 0;
      for (const w of catWidths) {
        if (remaining - w < 0) break;
        remaining -= w;
        count++;
      }
      setVisibleCatCount(count);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (centerNavRef.current) ro.observe(centerNavRef.current);
    return () => ro.disconnect();
  }, [catKey]);

  // Category hover / focus
  const handleNavMouseEnter = (category: CategoryTreeItem) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveCategory(category);
    setIsDropdownOpen(true);
  };
  const handleNavFocus = (category: CategoryTreeItem) => {
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setActiveCategory(null);
    }
  };

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const dropdownMenu = {
    hidden: { opacity: 0, scale: 0.96, y: -6 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
    exit:    { opacity: 0, scale: 0.96, y: -6, transition: { duration: 0.14 } },
  };

  return (
    <>
      {/* ── Single unified navbar ─────────────────────────────────────────── */}
      <motion.div
        ref={navRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 border-b border-border/50 transition-all duration-300 will-change-transform',
          scrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm' : 'bg-white'
        )}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center h-14 md:h-16 gap-4 px-2 md:px-4">

            {/* ── LEFT: Logo ──────────────────────────────────────────────── */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <motion.span
                className="text-2xl md:text-3xl font-bold tracking-tight text-mono-charcoal"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <span className="tracking-[-0.08em]">M</span>
                <span className="tracking-[-0.02em]">ONO</span>
              </motion.span>
              <span className="text-[10px] font-medium text-mono-stone tracking-widest uppercase hidden sm:inline">
                Curated
              </span>
            </Link>

            {/* ── CENTER: Category nav ─────────────────────────────────────── */}
            <nav ref={centerNavRef} className="hidden md:flex flex-1 items-center justify-center overflow-hidden">
              {/* Hidden measurer: full item set, off-screen, used to compute fit */}
              <ul
                ref={measureRef}
                aria-hidden
                className="absolute -left-[9999px] top-0 flex items-center gap-1 pointer-events-none invisible"
              >
                {staticNavItems.map((item) => (
                  <li key={`m-${item.label}`} data-kind="fixed" className="px-2 lg:px-4 py-2 text-xs lg:text-sm font-semibold tracking-wider whitespace-nowrap">
                    {item.label}
                  </li>
                ))}
                <li data-kind="fixed" className="px-2"><span className="block w-px h-4" /></li>
                {categories.map((category) => (
                  <li key={`m-${category.id}`} data-kind="cat" className="px-2 lg:px-4 py-2 text-xs lg:text-sm font-semibold tracking-wider whitespace-nowrap">
                    {category.name.toUpperCase()}
                  </li>
                ))}
                {promoNavItems.length > 0 && (
                  <li data-kind="fixed" className="px-2"><span className="block w-px h-4" /></li>
                )}
                {promoNavItems.map((item) => (
                  <li key={`m-${item.label}`} data-kind="fixed" className="px-2 lg:px-4 py-2 text-xs lg:text-sm font-bold tracking-wider whitespace-nowrap">
                    {item.label}
                  </li>
                ))}
              </ul>

              <ul className="flex items-center gap-1">
                {staticNavItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center px-2 lg:px-4 py-2 text-xs lg:text-sm font-semibold tracking-wider text-foreground hover:text-mono-terracotta transition-colors whitespace-nowrap"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}

                <li className="px-2"><span className="block w-px h-4 bg-border" /></li>

                {isLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <li key={`cat-skel-${i}`} className="px-2 lg:px-4 py-2">
                        <span className="block h-4 w-16 bg-muted animate-pulse rounded" />
                      </li>
                    ))
                  : null}

                {categories.slice(0, visibleCatCount).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/products?category=${category.slug}`}
                      onMouseEnter={() => handleNavMouseEnter(category)}
                      onFocus={() => handleNavFocus(category)}
                      className={cn(
                        'flex items-center px-2 lg:px-4 py-2 text-xs lg:text-sm font-semibold tracking-wider transition-colors whitespace-nowrap',
                        activeCategory?.id === category.id
                          ? 'text-mono-terracotta'
                          : 'text-foreground hover:text-mono-terracotta'
                      )}
                    >
                      {category.name.toUpperCase()}
                    </Link>
                  </li>
                ))}

                {promoNavItems.length > 0 && (
                  <li className="px-2"><span className="block w-px h-4 bg-border" /></li>
                )}

                {promoNavItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-2 lg:px-4 py-2 text-xs lg:text-sm font-bold tracking-wider transition-colors whitespace-nowrap',
                        item.color ?? 'text-red-500 hover:text-red-600'
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* ── RIGHT: Action icons ──────────────────────────────────────── */}
            <div className="flex items-center gap-1 md:gap-2 ml-auto shrink-0">

              {/* Search */}
              <Button
                variant="ghost" size="icon"
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex text-foreground/70 hover:text-foreground hover:bg-muted/50"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              {isAuthenticated && (
                <div className="relative" ref={notificationsRef}>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="relative text-foreground/70 hover:text-foreground hover:bg-muted/50"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute -top-0.5 -right-0.5 bg-mono-terracotta text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                        <motion.div
                          variants={dropdownMenu} initial="hidden" animate="visible" exit="exit"
                          className="fixed left-2 right-2 top-14 z-50 w-auto sm:absolute sm:left-auto sm:right-0 sm:top-10 sm:w-80 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-muted/30">
                            <p className="font-semibold text-sm">Notifications</p>
                            {unreadCount > 0 && (
                              <button onClick={onMarkAllRead} className="text-xs text-mono-terracotta hover:underline font-medium">
                                Mark all read
                              </button>
                            )}
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-8 text-center">
                                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">No notifications</p>
                              </div>
                            ) : (
                              notifications.map((n: any, i: number) => (
                                <motion.button
                                  key={n.id}
                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  onClick={() => onNotificationClick(n)}
                                  className={cn(
                                    'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0',
                                    !n.isRead && 'bg-mono-terracotta/5'
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                                      n.type === 'success' ? 'bg-green-500' :
                                      n.type === 'warning' ? 'bg-yellow-500' :
                                      n.type === 'error'   ? 'bg-mono-rose'  : 'bg-blue-500'
                                    )} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{n.title}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                                      <p className="text-[10px] text-muted-foreground mt-1">
                                        {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </p>
                                    </div>
                                    {!n.isRead && <div className="w-1.5 h-1.5 bg-mono-terracotta rounded-full flex-shrink-0 mt-1" />}
                                  </div>
                                </motion.button>
                              ))
                            )}
                          </div>
                          <div className="border-t border-border/50 px-4 py-2 bg-muted/30">
                            <Link href="/notifications" className="text-sm text-mono-terracotta hover:underline block text-center font-medium"
                              onClick={() => setNotificationsOpen(false)}>
                              View all
                            </Link>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Wishlist */}
              {isAuthenticated && (
                <Link href="/wishlist" className="relative">
                  <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}>
                    <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground hover:bg-muted/50" aria-label="Wishlist">
                      <Heart className="h-5 w-5" />
                      {wishlistCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }} animate={{ scale: 1 }} key={wishlistCount}
                          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          className="absolute -top-0.5 -right-0.5 bg-mono-rose text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center"
                        >
                          {wishlistCount > 9 ? '9+' : wishlistCount}
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>
                </Link>
              )}

              {/* Cart */}
              <Link href="/cart" className="relative">
                <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}>
                  <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground hover:bg-muted/50" aria-label="Cart">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }} key={cartCount}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                        className="absolute -top-0.5 -right-0.5 bg-mono-charcoal text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center"
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </motion.span>
                    )}
                  </Button>
                </motion.div>
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" size="icon" onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="text-foreground/70 hover:text-foreground hover:bg-muted/50" aria-label="User menu">
                      {user?.avatar ? (
                        <Image src={user.avatar} alt={user.name ?? ''} width={32} height={32}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-border" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-mono-charcoal text-white flex items-center justify-center text-sm font-semibold">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Button>
                  </motion.div>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        <motion.div variants={dropdownMenu} initial="hidden" animate="visible" exit="exit"
                          className="absolute right-0 top-12 z-50 w-56 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden">
                          <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                            <p className="font-semibold text-sm">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                          </div>
                          <div className="py-1">
                            {[
                              { href: '/profile', icon: User, label: 'Profile' },
                              { href: '/profile/orders', icon: Package, label: 'Orders' },
                              { href: '/wishlist', icon: Heart, label: 'Wishlist' },
                              { href: '/profile/settings', icon: Settings, label: 'Settings' },
                            ].map(({ href, icon: Icon, label }) => (
                              <Link key={href} href={href}
                                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                                onClick={() => setUserMenuOpen(false)}>
                                <Icon className="h-4 w-4 text-muted-foreground" /> {label}
                              </Link>
                            ))}
                            {user?.role === 'admin' && (
                              <>
                                <div className="my-1 border-t border-border/50" />
                                <Link href="/admin/dashboard"
                                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors text-mono-terracotta"
                                  onClick={() => setUserMenuOpen(false)}>
                                  Admin Panel
                                </Link>
                              </>
                            )}
                            <div className="my-1 border-t border-border/50" />
                            <button onClick={onLogout}
                              className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors w-full text-left text-mono-rose">
                              <LogOut className="h-4 w-4" /> Logout
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex gap-2">
                  <Link href="/login"><Button variant="ghost" size="sm" className="font-medium">Login</Button></Link>
                  <Link href="/register"><Button size="sm" className="bg-mono-charcoal hover:bg-mono-charcoal/90 text-white font-medium">Sign Up</Button></Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <Button variant="ghost" size="icon" className="md:hidden text-foreground/70"
                onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md overflow-hidden">
              <nav className="container-mono py-4 flex flex-col gap-1">
                {staticNavItems.map((item) => (
                  <Link key={item.href} href={item.href}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-foreground/80 hover:bg-muted/50 transition-colors"
                    onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                ))}
                {categories.map((c) => (
                  <Link key={c.id} href={`/products?category=${c.slug}`}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-foreground/80 hover:bg-muted/50 transition-colors"
                    onClick={() => setMobileOpen(false)}>
                    {c.name.toUpperCase()}
                  </Link>
                ))}
                {promoNavItems.map((item) => (
                  <Link key={item.href} href={item.href}
                    className={cn('px-4 py-3 rounded-lg text-sm font-bold transition-colors', item.color)}
                    onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                ))}
                {!isAuthenticated ? (
                  <div className="flex gap-2 pt-2 border-t border-border/50 mt-2">
                    <Link href="/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">Login</Button></Link>
                    <Link href="/register" className="flex-1"><Button className="w-full bg-mono-charcoal" size="sm">Sign Up</Button></Link>
                  </div>
                ) : (
                  <button onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-mono-rose hover:bg-mono-rose/5 transition-colors w-full mt-2 border-t border-border/50">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search overlay */}
        <AnimatePresence>
          {searchOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }} />
              <motion.div
                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-xl z-[61] px-4"
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-border/60 overflow-hidden">
                  <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setSearchOpen(false);
                          setSearchQuery('');
                        }
                      }}
                      className="flex-1 bg-transparent border-none text-base placeholder:text-muted-foreground/60 py-1 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                      autoFocus
                    />
                    {searchQuery ? (
                      <button type="button" onClick={() => setSearchQuery('')}
                        className="shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ) : (
                      <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="shrink-0 text-xs text-muted-foreground border border-border/60 rounded px-2 py-1 hover:bg-muted transition-colors">
                        Esc
                      </button>
                    )}
                  </form>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {debouncedQuery.length < 2 ? (
                      <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Start typing to search…
                      </div>
                    ) : isSearching ? (
                      <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Searching…
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        No products found for &ldquo;{debouncedQuery}&rdquo;
                      </div>
                    ) : (
                      <>
                        {searchResults.map((p) => {
                          const img = p.images?.[0] ?? p.media?.[0]?.url;
                          return (
                            <Link
                              key={p.id}
                              href={`/products/${p.slug}`}
                              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                            >
                              <div className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-muted">
                                {img && (
                                  <Image src={img} alt={p.name} fill sizes="44px" className="object-cover" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{formatINR(p.price)}</p>
                              </div>
                            </Link>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => { onSearch(debouncedQuery); setSearchOpen(false); setSearchQuery(''); }}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-mono-terracotta hover:bg-muted/50 transition-colors border-t border-border/50"
                        >
                          View all results for &ldquo;{debouncedQuery}&rdquo;
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Mega menu dropdown ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDropdownOpen && activeCategory && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/10"
              style={{ top: '56px' }}
              onClick={() => setIsDropdownOpen(false)}
            />
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 right-0 z-50 bg-white border-b border-border/50 shadow-xl"
              style={{ top: '56px' }}
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleMouseLeave}
              onKeyDown={handleKeyDown}
            >
              <div className="container-mono py-8">
                <div className="grid grid-cols-12 gap-8">

                  {/* ── Zone 1: Subcategory navigation + category-scoped quick links ── */}
                  <div className="col-span-12 lg:col-span-3 flex flex-col">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                      Shop {activeCategory.name}
                    </h3>
                    <ul className="space-y-0.5">
                      <li>
                        <Link href={`/products?category=${activeCategory.slug}`}
                          className="flex items-center py-1.5 text-sm font-semibold text-foreground hover:text-mono-terracotta transition-colors"
                          onClick={() => setIsDropdownOpen(false)}>
                          All {activeCategory.name}
                        </Link>
                      </li>
                      {activeCategory.children.map((child) => (
                        <li key={child.id}>
                          <Link href={`/products?category=${child.slug}`}
                            className="flex items-center py-1.5 text-sm text-foreground/70 hover:text-mono-terracotta hover:translate-x-1 transition-all duration-200"
                            onClick={() => setIsDropdownOpen(false)}>
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {/* Category-scoped quick links (no longer hardcoded global links) */}
                    <div className="mt-6 pt-4 border-t border-border/50 space-y-0.5">
                      <Link href={`/products?category=${activeCategory.slug}&sortBy=createdAt&sortOrder=desc`}
                        className="flex items-center py-1.5 text-sm text-foreground/70 hover:text-mono-terracotta transition-colors"
                        onClick={() => setIsDropdownOpen(false)}>
                        New In
                      </Link>
                      <Link href={`/products?category=${activeCategory.slug}&sortBy=avgRating&sortOrder=desc`}
                        className="flex items-center py-1.5 text-sm text-foreground/70 hover:text-mono-terracotta transition-colors"
                        onClick={() => setIsDropdownOpen(false)}>
                        Best Rated
                      </Link>
                      <Link href={`/products?category=${activeCategory.slug}&onSale=true`}
                        className="flex items-center py-1.5 text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
                        onClick={() => setIsDropdownOpen(false)}>
                        On Sale
                      </Link>
                    </div>
                  </div>

                  {/* ── Zone 2: Real featured products from this category (merchandising) ── */}
                  <div className="col-span-12 lg:col-span-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Popular in {activeCategory.name}
                      </h4>
                      <Link href={`/products?category=${activeCategory.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-mono-terracotta transition-colors"
                        onClick={() => setIsDropdownOpen(false)}>
                        View all
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {activeCategory.featuredProducts && activeCategory.featuredProducts.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {activeCategory.featuredProducts.map((product) => {
                          const onSale =
                            product.comparePrice != null &&
                            parseFloat(String(product.comparePrice)) > parseFloat(String(product.price));
                          return (
                            <Link key={product.id} href={`/products/${product.slug}`}
                              className="group block" onClick={() => setIsDropdownOpen(false)}>
                              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                                {product.imageUrl ? (
                                  <Image src={product.imageUrl} alt={product.name} fill sizes="160px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-mono-cream to-mono-stone/20">
                                    <span className="text-[10px] text-muted-foreground text-center px-2">{product.name}</span>
                                  </div>
                                )}
                                {onSale && (
                                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                                    SALE
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-xs font-medium text-foreground line-clamp-1 group-hover:text-mono-terracotta transition-colors">
                                {product.name}
                              </p>
                              <div className="mt-0.5 flex items-baseline gap-1.5">
                                <span className={cn('text-xs font-semibold', onSale ? 'text-red-500' : 'text-foreground')}>
                                  {formatINR(product.price)}
                                </span>
                                {onSale && (
                                  <span className="text-[10px] text-muted-foreground line-through">
                                    {formatINR(product.comparePrice)}
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-40 rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground">
                        No products yet — explore the full collection
                      </div>
                    )}
                  </div>

                  {/* ── Zone 3: Editorial banner with CTA ── */}
                  <div className="hidden lg:block lg:col-span-3">
                    <Link href={`/products?category=${activeCategory.slug}`}
                      className="block relative h-full min-h-[260px] rounded-lg overflow-hidden group"
                      onClick={() => setIsDropdownOpen(false)}>
                      {activeCategory.imageUrl ? (
                        <Image src={activeCategory.imageUrl} alt={activeCategory.name} fill sizes="320px"
                          className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-mono-cream to-mono-stone/20" />
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        {activeCategory.isFeatured && (
                          <span className="inline-block mb-2 px-2 py-0.5 bg-mono-terracotta text-white text-[10px] font-semibold rounded tracking-wide">
                            FEATURED
                          </span>
                        )}
                        <p className="text-white/80 text-xs font-medium mb-0.5">Explore the collection</p>
                        <h4 className="text-white text-2xl font-bold leading-tight">{activeCategory.name}</h4>
                        <span className="mt-3 inline-flex items-center gap-1.5 text-white text-sm font-semibold">
                          Shop now
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}