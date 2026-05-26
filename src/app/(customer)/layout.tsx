'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { clearUser } from '@/lib/redux/authSlice';
import { ShoppingCart, User, Menu, X, Heart, Package, Home, LogOut, Settings, Bell, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetCartQuery } from '@/services/api/cartApi';
import { useLogoutMutation } from '@/services/api/authApi';
import { useGetNotificationsQuery, useGetUnreadCountQuery, useMarkAsReadByIdMutation, useMarkAsReadMutation } from '@/services/api/notificationsApi';
import { useGetProductsQuery } from '@/services/api/productsApi';
import CategoryNav from '@/components/navigation/CategoryNav';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fadeInDown, fadeInUp, staggerContainer, staggerItem, dropdownMenu } from '@/lib/animations';
import { MagneticButton } from '@/components/effects';

gsap.registerPlugin(ScrollTrigger);

// ============================================
// MONO Brand Layout Component
// Premium Fashion E-commerce Experience
// ============================================

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: notificationsData } = useGetNotificationsQuery({ limit: 10 }, { skip: !isAuthenticated });
  const { data: unreadCountData } = useGetUnreadCountQuery(undefined, { skip: !isAuthenticated });
  const [markAsRead] = useMarkAsReadByIdMutation();
  const [markAllAsRead] = useMarkAsReadMutation();
  const [logoutMutation] = useLogoutMutation();

  // Search functionality
  const { data: productsData } = useGetProductsQuery({
    search: searchQuery,
    limit: 8,
    isActive: 'true',
  }, { skip: !searchOpen || searchQuery.length < 2 });

  const searchResults = (productsData as any)?.data || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const cartRaw = (cart as any)?.data || cart;
  const cartItems = cartRaw?.cart?.items ?? cartRaw?.items ?? [];
  const cartCount = cartItems.length;
  
  const notifications = (notificationsData as any)?.data || [];
  const unreadCount = (unreadCountData as any)?.unreadCount || 0;

  // GSAP ScrollTrigger for premium header animation
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    // Initial state - only animate shadow/border, leave bg to Tailwind
    gsap.set(header, { 
      boxShadow: '0 0 0 rgba(0,0,0,0)',
      borderBottomWidth: '0px'
    });

    // Scroll-triggered animation
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 'top -50',
        end: 'top -100',
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.to(header, {
            boxShadow: `0 1px 3px rgba(0,0,0,${progress * 0.05})`,
            borderBottomWidth: `${progress * 1}px`,
            borderBottomColor: 'rgba(0,0,0,0.05)',
            duration: 0.1,
            overwrite: true
          });
          setScrolled(progress > 0.5);
        }
      });
    });

    return () => ctx.revert();
  }, []);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {}
    dispatch(clearUser());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.data?.link) {
      router.push(notification.data.link);
      setNotificationsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({});
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Shop', icon: ShoppingCart },
    { href: '/profile/orders', label: 'Orders', icon: Package },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ============================================
          MONO Header - Centered Logo Style (ONLY.in inspired)
          ============================================ */}
      <motion.header
        ref={headerRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-transparent will-change-transform bg-background/95 backdrop-blur-md"
      >
        {/* Top Row - Logo Centered, Actions Right */}
        <div className="container-mono">
          <div className="flex items-center h-14 md:h-16 relative">
            {/* Centered Logo - absolute positioned to stay truly centered */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center group whitespace-nowrap">
              <motion.span
                className="text-2xl md:text-3xl font-bold tracking-tight text-mono-charcoal"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <span className="tracking-[-0.08em]">M</span>
                <span className="tracking-[-0.02em]">ONO</span>
              </motion.span>
              <span className="ml-2 text-[10px] font-medium text-mono-stone tracking-widest uppercase hidden sm:inline">
                Curated
              </span>
            </Link>

            {/* Right Actions - pushed to right */}
            <div className="flex items-center gap-1 md:gap-2 ml-auto">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex text-foreground/70 hover:text-foreground hover:bg-muted/50 cursor-pointer"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              {isAuthenticated && (
                <div className="relative" ref={notificationsRef}>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="relative text-foreground/70 hover:text-foreground hover:bg-muted/50"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
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
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40"
                          onClick={() => setNotificationsOpen(false)}
                        />
                        <motion.div
                          variants={dropdownMenu}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute right-0 top-10 z-50 w-80 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-muted/30">
                            <p className="font-semibold text-sm">Notifications</p>
                            {unreadCount > 0 && (
                              <button onClick={handleMarkAllAsRead} className="text-xs text-mono-terracotta hover:underline font-medium">
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
                              notifications.map((notification: any, index: number) => (
                                <motion.button
                                  key={notification.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => handleNotificationClick(notification)}
                                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                                    !notification.isRead ? 'bg-mono-terracotta/5' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                      notification.type === 'success' ? 'bg-green-500' :
                                      notification.type === 'warning' ? 'bg-yellow-500' :
                                      notification.type === 'error' ? 'bg-mono-rose' :
                                      'bg-blue-500'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{notification.title}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p>
                                      <p className="text-[10px] text-muted-foreground mt-1">
                                        {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </p>
                                    </div>
                                    {!notification.isRead && (
                                      <div className="w-1.5 h-1.5 bg-mono-terracotta rounded-full flex-shrink-0 mt-1" />
                                    )}
                                  </div>
                                </motion.button>
                              ))
                            )}
                          </div>
                          <div className="border-t border-border/50 px-4 py-2 bg-muted/30">
                            <Link href="/notifications" className="text-sm text-mono-terracotta hover:underline block text-center font-medium" onClick={() => setNotificationsOpen(false)}>
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
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        key={cartCount}
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
                    <Button variant="ghost" size="icon" onClick={() => setUserMenuOpen(!userMenuOpen)} className="text-foreground/70 hover:text-foreground hover:bg-muted/50" aria-label="User menu">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover ring-2 ring-border" />
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        <motion.div variants={dropdownMenu} initial="hidden" animate="visible" exit="exit" className="absolute right-0 top-12 z-50 w-56 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden">
                          <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                            <p className="font-semibold text-sm">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                          </div>
                          <div className="py-1">
                            <Link href="/profile" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                              <User className="h-4 w-4 text-muted-foreground" /> Profile
                            </Link>
                            <Link href="/profile/orders" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                              <Package className="h-4 w-4 text-muted-foreground" /> Orders
                            </Link>
                            <Link href="/wishlist" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                              <Heart className="h-4 w-4 text-muted-foreground" /> Wishlist
                            </Link>
                            <Link href="/profile/settings" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                              <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                            </Link>
                            {user?.role === 'admin' && (
                              <>
                                <div className="my-1 border-t border-border/50" />
                                <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors text-mono-terracotta" onClick={() => setUserMenuOpen(false)}>
                                  Admin Panel
                                </Link>
                              </>
                            )}
                            <div className="my-1 border-t border-border/50" />
                            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors w-full text-left text-mono-rose">
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

              {/* Mobile Menu Toggle */}
              <Button variant="ghost" size="icon" className="md:hidden text-foreground/70" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md overflow-hidden">
              <motion.nav variants={staggerContainer} initial="hidden" animate="visible" className="container-mono py-4 flex flex-col gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <motion.div key={link.href} variants={staggerItem}>
                      <Link href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-mono-terracotta/10 text-mono-charcoal' : 'hover:bg-muted/50 text-foreground/80'
                      }`}>
                        <Icon className={`h-4 w-4 ${isActive ? 'text-mono-terracotta' : 'text-muted-foreground'}`} />
                        {link.label}
                        {link.href === '/cart' && cartCount > 0 && (
                          <span className="ml-auto bg-mono-charcoal text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
                {!isAuthenticated && (
                  <motion.div variants={staggerItem} className="flex gap-2 pt-2 border-t border-border/50 mt-2">
                    <Link href="/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">Login</Button></Link>
                    <Link href="/register" className="flex-1"><Button className="w-full bg-mono-charcoal" size="sm">Sign Up</Button></Link>
                  </motion.div>
                )}
                {isAuthenticated && (
                  <motion.div variants={staggerItem}>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-mono-rose hover:bg-mono-rose/5 transition-colors w-full">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Category Navigation Bar */}
      <CategoryNav scrolled={scrolled} />

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-xl z-[61] px-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-border/60 overflow-hidden">
                {/* Input row */}
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                  <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none ring-0 focus:outline-none focus:ring-0 border-none text-base placeholder:text-muted-foreground/60 py-1"
                    autoFocus
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                      className="shrink-0 text-xs text-muted-foreground border border-border/60 rounded px-2 py-1 hover:bg-muted transition-colors"
                    >
                      Esc
                    </button>
                  )}
                </form>

                {/* Results */}
                {searchQuery.length >= 2 ? (
                  <div className="max-h-[55vh] overflow-y-auto">
                    {searchResults.length > 0 ? (
                      <>
                        <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                          Products
                        </p>
                        <div className="pb-2">
                          {searchResults.slice(0, 6).map((product: any) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.slug}`}
                              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors group"
                            >
                              <div className="h-12 w-12 bg-muted rounded-lg overflow-hidden shrink-0">
                                {product.images?.[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">₹{product.price}</p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </Link>
                          ))}
                        </div>
                        <div className="px-4 py-3 border-t border-border/50 bg-muted/20">
                          <button
                            onClick={handleSearchSubmit}
                            className="w-full text-center text-sm font-medium text-mono-terracotta hover:underline"
                          >
                            View all results for &ldquo;{searchQuery}&rdquo; →
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-10 text-center text-muted-foreground text-sm">
                        No products found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                    Start typing to search products…
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="flex-1 pt-14 md:pt-16">
        {children}
      </motion.main>

      {/* MONO Footer */}
      <footer className="bg-mono-charcoal text-mono-cream mt-auto">
        <div className="container-mono py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-block mb-4">
                <span className="text-2xl font-bold tracking-tight">
                  <span className="tracking-[-0.08em]">M</span><span className="tracking-[-0.02em]">ONO</span>
                </span>
              </Link>
              <p className="text-sm text-mono-stone leading-relaxed mb-6 max-w-xs">Curated essentials for the modern wardrobe. Timeless pieces, sustainable quality.</p>
              <div className="flex gap-4">
                {['instagram', 'twitter', 'facebook'].map((social) => (
                  <a key={social} href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-mono-terracotta transition-colors duration-300" aria-label={social}>
                    <span className="text-xs font-semibold uppercase">{social[0]}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="label-caps text-mono-stone mb-4">Shop</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">All Products</Link></li>
                <li><Link href="/cart" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">Shopping Cart</Link></li>
                <li><Link href="/profile/orders" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">Order History</Link></li>
                <li><Link href="/wishlist" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">Wishlist</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="label-caps text-mono-stone mb-4">Account</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/profile" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">My Profile</Link></li>
                <li><Link href="/profile/addresses" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">Addresses</Link></li>
                <li><Link href="/notifications" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">Notifications</Link></li>
                <li><Link href="/profile/settings" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">Settings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="label-caps text-mono-stone mb-4">Help</h4>
              <ul className="space-y-3 text-sm">
                <li><span className="text-mono-cream/80 cursor-default">FAQ</span></li>
                <li><span className="text-mono-cream/80 cursor-default">Shipping Info</span></li>
                <li><span className="text-mono-cream/80 cursor-default">Returns</span></li>
                <li><Link href="/contact" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-mono-stone"> {new Date().getFullYear()} MONO. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-mono-stone">
              <Link href="/privacy" className="hover:text-mono-cream transition-colors">Privacy</Link>
              <span className="hover:text-mono-cream cursor-default transition-colors">Terms</span>
              <span className="hover:text-mono-cream cursor-default transition-colors">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
