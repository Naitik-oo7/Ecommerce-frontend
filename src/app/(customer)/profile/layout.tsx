'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';
import { User, Package, MapPin, Settings, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { RequireAuth } from '@/components/auth/RequireAuth';

const navItems = [
  { href: '/profile', label: 'Overview', icon: User, exact: true },
  { href: '/profile/orders', label: 'My Orders', icon: Package, exact: false },
  { href: '/profile/addresses', label: 'Addresses', icon: MapPin, exact: false },
  { href: '/profile/settings', label: 'Settings', icon: Settings, exact: false },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <ProfileLayoutContent>{children}</ProfileLayoutContent>
    </RequireAuth>
  );
}

function ProfileLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAppSelector((state) => state.auth);
  const pathname = usePathname();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container-mono py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            {/* Profile card */}
            <div className="bg-card rounded-2xl border border-border p-6 mb-4">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  {user?.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-background"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center ring-4 ring-background">
                      <span className="text-2xl font-bold text-white">{initials}</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white" />
                </div>
                <p className="font-semibold text-foreground text-base leading-tight">{user?.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-full">{user?.email}</p>
                {user?.role === 'admin' && (
                  <span className="mt-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Nav */}
            <nav className="bg-card rounded-2xl border border-border overflow-hidden">
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
                      i > 0 ? 'border-t border-border' : ''
                    } ${
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="profile-nav-indicator"
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#C7A27C] rounded-r"
                      />
                    )}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-accent/10' : 'bg-muted'
                    }`}>
                      <Icon className={`h-4 w-4 ${isActive ? 'text-accent' : 'text-muted-foreground'}`} />
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
