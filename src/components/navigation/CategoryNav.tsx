'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetCategoryTreeQuery, CategoryTreeItem } from '@/services/api/categoriesApi';
import { cn } from '@/lib/utils';
import {
  ShoppingCart, User, Menu, X, Heart, Package,
  LogOut, Settings, Bell, Search, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: categoryTree, isLoading } = useGetCategoryTreeQuery({ limit: 10 });
  const categories = (categoryTree || []).filter(
    (c) => !EXCLUDED.includes(c.name.toLowerCase())
  );

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

  // Category hover
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

  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background h-14 md:h-16 flex items-center">
        <div className="container-mono w-full flex items-center justify-between">
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          <div className="flex gap-8">
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

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
            <nav className="hidden md:flex flex-1 items-center justify-center overflow-x-auto scrollbar-hide">
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

                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      onMouseEnter={() => handleNavMouseEnter(category)}
                      className={cn(
                        'flex items-center px-2 lg:px-4 py-2 text-xs lg:text-sm font-semibold tracking-wider transition-colors whitespace-nowrap',
                        activeCategory?.id === category.id
                          ? 'text-mono-terracotta'
                          : 'text-foreground hover:text-mono-terracotta'
                      )}
                    >
                      {category.name.toUpperCase()}
                    </button>
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
                          className="absolute right-0 top-10 z-50 w-80 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden"
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
                      className="flex-1 bg-transparent outline-none border-none text-base placeholder:text-muted-foreground/60 py-1"
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
                  <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                    Start typing to search…
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
            >
              <div className="container-mono py-8">
                <div className="grid grid-cols-12 gap-8">
                  {/* Subcategories */}
                  <div className="col-span-12 lg:col-span-3">
                    <h3 className="text-lg font-bold text-foreground mb-6 tracking-wide">
                      {activeCategory.name.toUpperCase()}
                    </h3>
                    <ul className="space-y-1">
                      <li>
                        <Link href={`/products?category=${activeCategory.slug}`}
                          className="flex items-center py-2 text-sm font-semibold text-mono-terracotta hover:underline"
                          onClick={() => setIsDropdownOpen(false)}>
                          EVERYTHING {activeCategory.name.toUpperCase()}
                        </Link>
                      </li>
                      {activeCategory.children.map((child) => (
                        <li key={child.id}>
                          <Link href={`/products?category=${child.slug}`}
                            className="flex items-center py-2 text-sm text-foreground/80 hover:text-mono-terracotta transition-colors"
                            onClick={() => setIsDropdownOpen(false)}>
                            {child.name.toUpperCase()}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 pt-4 border-t border-border/50">
                      <Link href={`/products?category=${activeCategory.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-mono-terracotta transition-colors"
                        onClick={() => setIsDropdownOpen(false)}>
                        Shop All {activeCategory.name}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {/* Trending */}
                  <div className="hidden lg:block lg:col-span-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Trending Now</h4>
                    <ul className="space-y-2">
                      {[
                        { href: '/products?sortBy=createdAt&sortOrder=desc', label: 'New Arrivals', cls: 'text-foreground/70 hover:text-mono-terracotta' },
                        { href: '/products?isBestseller=true',              label: 'Bestsellers',  cls: 'text-foreground/70 hover:text-mono-terracotta' },
                        { href: '/products?onSale=true',                    label: 'Sale',         cls: 'text-red-500 hover:text-red-600' },
                      ].map((l) => (
                        <li key={l.href}>
                          <Link href={l.href} className={cn('text-sm transition-colors', l.cls)}
                            onClick={() => setIsDropdownOpen(false)}>
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Featured image */}
                  <div className="col-span-12 lg:col-span-6">
                    <Link href={`/products?category=${activeCategory.slug}`}
                      className="block relative aspect-video lg:aspect-2/1 rounded-lg overflow-hidden group"
                      onClick={() => setIsDropdownOpen(false)}>
                      {activeCategory.imageUrl ? (
                        <Image src={activeCategory.imageUrl} alt={activeCategory.name} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-mono-cream to-mono-stone/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-mono-charcoal/30">{activeCategory.name}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <p className="text-white text-sm font-medium mb-1">Explore</p>
                        <h4 className="text-white text-xl font-bold">{activeCategory.name}</h4>
                        {activeCategory.isFeatured && (
                          <span className="inline-block mt-2 px-2 py-1 bg-mono-terracotta text-white text-xs font-semibold rounded">Featured</span>
                        )}
                      </div>
                    </Link>
                    {activeCategory.children.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {activeCategory.children.slice(0, 3).map((child) => (
                          <Link key={child.id} href={`/products?category=${child.slug}`}
                            className="block group" onClick={() => setIsDropdownOpen(false)}>
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                              {child.imageUrl ? (
                                <Image src={child.imageUrl} alt={child.name} fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <span className="text-xs text-muted-foreground text-center px-2">{child.name}</span>
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
    </>
  );
}