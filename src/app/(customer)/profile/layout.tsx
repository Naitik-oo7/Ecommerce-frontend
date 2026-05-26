'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';
import { User, Package, MapPin, Settings, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

const navItems = [
  { href: '/profile', label: 'Overview', icon: User, exact: true },
  { href: '/profile/orders', label: 'My Orders', icon: Package, exact: false },
  { href: '/profile/addresses', label: 'Addresses', icon: MapPin, exact: false },
  { href: '/profile/settings', label: 'Settings', icon: Settings, exact: false },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=' + pathname);
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated) return null;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="container-mono py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-[#E5E2DD] p-6 mb-4">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-[#F6F3EE]"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#111111] flex items-center justify-center ring-4 ring-[#F6F3EE]">
                      <span className="text-2xl font-bold text-white">{initials}</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white" />
                </div>
                <p className="font-semibold text-[#111111] text-base leading-tight">{user?.name}</p>
                <p className="text-xs text-[#9B9B9B] mt-0.5 truncate max-w-full">{user?.email}</p>
                {user?.role === 'admin' && (
                  <span className="mt-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Nav */}
            <nav className="bg-white rounded-2xl border border-[#E5E2DD] overflow-hidden">
              {navItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors relative ${
                      i > 0 ? 'border-t border-[#F0EDE8]' : ''
                    } ${
                      isActive
                        ? 'bg-[#F6F3EE] text-[#111111]'
                        : 'text-[#6B6B6B] hover:bg-[#FAFAF8] hover:text-[#111111]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="profile-nav-indicator"
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#C7A27C] rounded-r"
                      />
                    )}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-[#C7A27C]/10' : 'bg-[#F6F3EE]'
                    }`}>
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[#C7A27C]' : 'text-[#9B9B9B]'}`} />
                    </div>
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-opacity ${isActive ? 'opacity-40' : 'opacity-20'}`} />
                  </Link>
                );
              })}
            </nav>

            {/* Mobile-only horizontal strip — shown on mobile above main content */}
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
