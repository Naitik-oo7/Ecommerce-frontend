'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { clearUser } from '@/lib/redux/authSlice';
import { clearGuestCart } from '@/lib/redux/guestCartSlice';
import { motion } from 'framer-motion';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '@/components/icons/SocialIcons';
import { useGetCartQuery, useAddToCartMutation } from '@/services/api/cartApi';
import { useGetSettingQuery } from '@/services/api/settingsApi';
import { useLogoutMutation } from '@/services/api/authApi';
import { clearAuthTokens } from '@/lib/authTokens';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadByIdMutation,
  useMarkAsReadMutation,
} from '@/services/api/notificationsApi';
import CategoryNav from '@/components/navigation/CategoryNav';

// ============================================
// MONO Brand Layout Component
// ============================================

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { data: generalSetting } = useGetSettingQuery('general');
  const general = (generalSetting as {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    footerTagline?: string;
  } | undefined) ?? {};

  const socialLinks = [
    { name: 'Instagram', href: general.instagram, Icon: InstagramIcon },
    { name: 'Twitter', href: general.twitter, Icon: TwitterIcon },
    { name: 'Facebook', href: general.facebook, Icon: FacebookIcon },
  ].filter((s) => !!s.href);

  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: notificationsData } = useGetNotificationsQuery({ limit: 10 }, { skip: !isAuthenticated });
  const { data: unreadCountData } = useGetUnreadCountQuery(undefined, { skip: !isAuthenticated });
  const [markAsRead] = useMarkAsReadByIdMutation();
  const [markAllAsRead] = useMarkAsReadMutation();
  const [logoutMutation] = useLogoutMutation();
  const [addToCartMutation] = useAddToCartMutation();

  const guestItems = useAppSelector((state) => state.guestCart.items);
  const wasAuthenticated = useRef(isAuthenticated);
  useEffect(() => {
    const justLoggedIn = !wasAuthenticated.current && isAuthenticated;
    wasAuthenticated.current = isAuthenticated;
    if (justLoggedIn && guestItems.length > 0) {
      const snapshot = [...guestItems];
      const merge = async () => {
        for (const item of snapshot) {
          try {
            await addToCartMutation({
              variantId: item.variantId,
              size: item.size,
              quantity: item.quantity,
            }).unwrap();
          } catch {}
        }
        dispatch(clearGuestCart());
      };
      merge();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  interface CartResponse {
    data?: {
      cart?: { items?: unknown[] };
      items?: unknown[];
    };
    cart?: { items?: unknown[] };
    items?: unknown[];
  }

  interface NotificationData {
    data?: unknown[];
  }

  interface UnreadCountData {
    unreadCount?: number;
  }

  const cartRaw = (cart as CartResponse | undefined)?.data ?? (cart as CartResponse | undefined);
  const cartItems = (cartRaw?.cart?.items ?? cartRaw?.items ?? []) as unknown[];
  const cartCount = isAuthenticated ? cartItems.length : guestItems.length;

  const notifications = (notificationsData as NotificationData | undefined)?.data ?? [];
  const unreadCount = (unreadCountData as UnreadCountData | undefined)?.unreadCount ?? 0;

  const handleLogout = async () => {
    try { await logoutMutation().unwrap(); } catch {}
    dispatch(clearUser());
    clearAuthTokens();
    router.push('/login');
  };

  interface NotificationItem {
    id: number;
    isRead: boolean;
    data?: { link?: string };
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) await markAsRead(notification.id);
    if (notification.data?.link) router.push(notification.data.link);
  };

  const handleMarkAllRead = async () => { await markAllAsRead({}); };

  const handleSearch = (query: string) => {
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Single unified navbar */}
      <CategoryNav
        isAuthenticated={isAuthenticated}
        user={user}
        cartCount={cartCount}
        unreadCount={unreadCount}
        notifications={notifications}
        onSearch={handleSearch}
        onLogout={handleLogout}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Main content — offset by navbar height */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 pt-14 md:pt-16"
      >
        {children}
      </motion.main>

      {/* MONO Footer */}
      <footer className="bg-mono-charcoal text-mono-cream mt-auto">
        <div className="container-mono py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-block mb-4">
                <span className="text-2xl font-bold tracking-tight">
                  <span className="tracking-[-0.08em]">M</span>
                  <span className="tracking-[-0.02em]">ONO</span>
                </span>
              </Link>
              <p className="text-sm text-mono-stone leading-relaxed mb-6 max-w-xs">
                {general.footerTagline ?? 'Curated essentials for the modern wardrobe. Timeless pieces, sustainable quality.'}
              </p>
              {socialLinks.length > 0 && (
                <div className="flex gap-4">
                  {socialLinks.map(({ name, href, Icon }) => (
                    <a
                      key={name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-mono-terracotta transition-colors duration-300"
                      aria-label={name}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="label-caps text-mono-stone mb-4">Shop</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/products" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">All Products</Link></li>
                <li><Link href="/cart" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">Shopping Cart</Link></li>
                <li><Link href="/profile/orders" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">Order History</Link></li>
                <li><Link href="/wishlist" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">Wishlist</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="label-caps text-mono-stone mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">About MONO</Link></li>
                <li><Link href="/journal" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">The Journal</Link></li>
                <li><Link href="/contact" className="text-mono-cream/80 hover:text-mono-cream transition-colors link-underline">Contact Us</Link></li>
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
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-mono-stone">&copy; {new Date().getFullYear()} MONO. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-mono-stone">
              <Link href="/privacy" className="hover:text-mono-cream transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}