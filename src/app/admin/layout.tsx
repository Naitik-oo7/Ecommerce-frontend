'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { clearUser } from '@/lib/redux/authSlice';
import { useLogoutMutation } from '@/services/api/authApi';
import { clearAuthTokens } from '@/lib/authTokens';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag,
  MessageSquare, Settings, LogOut, Menu, FolderTree, BarChart3,
  FileText, Mail, Sun, Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/hooks';

const menuItems = [
  { href: '/admin/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/products',    icon: Package,         label: 'Products' },
  { href: '/admin/categories',  icon: FolderTree,      label: 'Categories' },
  { href: '/admin/orders',      icon: ShoppingCart,    label: 'Orders' },
  { href: '/admin/coupons',     icon: Tag,             label: 'Coupons' },
  { href: '/admin/users',       icon: Users,           label: 'Users' },
  { href: '/admin/reviews',     icon: MessageSquare,   label: 'Reviews' },
  { href: '/admin/blog',        icon: FileText,        label: 'Journal/Blog' },
  { href: '/admin/contacts',    icon: Mail,            label: 'Contact Inbox' },
  { href: '/admin/settings',    icon: Settings,        label: 'CMS Settings' },
];

// SidebarContent component defined outside of AdminLayout to prevent recreation on every render
interface SidebarContentProps {
  pathname: string | null;
  user: { name?: string } | null;
  onLogout: () => void;
  onCloseSidebar?: () => void;
}

function SidebarContent({ pathname, user, onLogout, onCloseSidebar }: SidebarContentProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b">
        <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={onCloseSidebar}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium truncate">{user?.name}</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mb-1"
        >
          View Store
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutMutation] = useLogoutMutation();
  const { theme, toggleTheme, isMounted } = useDarkMode();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const handleLogout = async () => {
    try { await logoutMutation().unwrap(); } catch {}
    dispatch(clearUser());
    clearAuthTokens();
    router.push('/login');
  };

  const handleCloseSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex-col">
        <SidebarContent pathname={pathname} user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-card border-r flex flex-col z-10">
            <SidebarContent pathname={pathname} user={user} onLogout={handleLogout} onCloseSidebar={handleCloseSidebar} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
          <div className="px-4 h-14 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {isMounted && theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:block">
              Welcome, {user?.name || 'Admin'}
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
