'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  useGetDashboardStatsQuery,
  useGetOverviewAnalyticsQuery,
  useGetSalesAnalyticsQuery,
  useGetProductAnalyticsQuery,
  useGetUserAnalyticsQuery,
  useGetOrderAnalyticsQuery,
  useGetCouponAnalyticsQuery,
  useGetReviewAnalyticsQuery,
  useGetInventoryAnalyticsQuery,
  type AnalyticsRangeParams,
} from '@/services/api/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Receipt,
  Star,
  Tag,
  Warehouse,
  Sparkles,
  CheckCircle2,
  Minus,
  RefreshCw,
  Calendar,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Line,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Theme-aware chart palette — reads CSS custom properties so every chart
// follows the active light/dark theme instead of hardcoded hex values.
// ---------------------------------------------------------------------------
const BRAND = {
  gold: '#C7A27C',
  ink: '#111111',
  sage: '#4A7C59',
  stone: '#6B6B6B',
  rose: '#B54A4A',
  terracotta: '#C8703A',
} as const;

const PIE_COLORS = [BRAND.gold, BRAND.sage, BRAND.stone, BRAND.terracotta, BRAND.rose];

interface ChartTheme {
  grid: string;
  axis: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  textMuted: string;
}

const LIGHT_THEME: ChartTheme = {
  grid: '#E5E2DD',
  axis: '#9B9B9B',
  surface: '#FFFFFF',
  surfaceBorder: '#E5E2DD',
  text: '#111111',
  textMuted: '#6B6B6B',
};

const DARK_THEME: ChartTheme = {
  grid: '#2A2A2A',
  axis: '#6B6B6B',
  surface: '#1A1A1A',
  surfaceBorder: '#2A2A2A',
  text: '#F6F3EE',
  textMuted: '#8A8A8A',
};

/** Tracks the `.dark` class on <html> so charts re-render with the right palette. */
function useChartTheme(): ChartTheme {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark ? DARK_THEME : LIGHT_THEME;
}

const formatCurrency = (v: number, max = 0) =>
  `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: max })}`;

const compactCurrency = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`;

function relativeLabel(timestamp: number, now: number): string {
  const seconds = Math.floor((now - timestamp) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

/** Live "updated Xs ago" label that recomputes every 30s (kept pure for render). */
function useRelativeTime(timestamp?: number): string {
  // `now` is the only mutable bit; advancing it on an interval re-derives the label.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return timestamp ? relativeLabel(timestamp, now) : '';
}

// ---------------------------------------------------------------------------
// Global date-range control — a popover trigger showing the active window,
// opening a clean preset list plus an inline custom start/end picker.
// ---------------------------------------------------------------------------
type Preset = '7d' | '30d' | '90d' | '12m' | 'custom';
interface RangeState { preset: Preset; startDate?: string; endDate?: string; }

const PRESETS: { value: Preset; label: string; hint: string }[] = [
  { value: '7d', label: 'Last 7 days', hint: '7D' },
  { value: '30d', label: 'Last 30 days', hint: '30D' },
  { value: '90d', label: 'Last 90 days', hint: '90D' },
  { value: '12m', label: 'Last 12 months', hint: '12M' },
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const fmtDate = (iso?: string) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

/** Resolve the active selection into a short trigger label + a precise sub-label. */
function rangeSummary(value: RangeState): { label: string; sub: string } {
  if (value.preset === 'custom') {
    return { label: 'Custom', sub: `${fmtDate(value.startDate)} – ${fmtDate(value.endDate)}` };
  }
  const preset = PRESETS.find((p) => p.value === value.preset)!;
  const days = value.preset === '12m' ? 365 : parseInt(value.preset);
  return { label: preset.label, sub: `${fmtDate(daysAgoISO(days))} – ${fmtDate(todayISO())}` };
}

function DateRangePicker({ value, onChange }: { value: RangeState; onChange: (r: RangeState) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const summary = rangeSummary(value);

  // Close on outside-click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{summary.label}</span>
        <span className="hidden text-xs text-muted-foreground md:inline">{summary.sub}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-xl border border-border/60 bg-card p-2 shadow-xl"
          role="dialog"
        >
          <p className="px-2 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Quick ranges</p>
          <div className="space-y-0.5">
            {PRESETS.map((p) => {
              const active = value.preset === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => { onChange({ preset: p.value }); setOpen(false); }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    active ? 'bg-primary/10 font-medium text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {active ? <Check className="h-3.5 w-3.5 text-accent" /> : <span className="h-3.5 w-3.5" />}
                    {p.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{p.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="my-2 border-t border-border/60" />

          <p className="px-2 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Custom range</p>
          <div className="space-y-2 px-2 pb-1">
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>From</span>
              <input
                type="date"
                value={value.startDate ?? daysAgoISO(30)}
                max={value.endDate ?? todayISO()}
                onChange={(e) => onChange({ preset: 'custom', startDate: e.target.value, endDate: value.endDate ?? todayISO() })}
                className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
                aria-label="Start date"
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>To</span>
              <input
                type="date"
                value={value.endDate ?? todayISO()}
                min={value.startDate}
                max={todayISO()}
                onChange={(e) => onChange({ preset: 'custom', startDate: value.startDate ?? daysAgoISO(30), endDate: e.target.value })}
                className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
                aria-label="End date"
              />
            </label>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One branded tooltip used across every chart — consistent surface, currency
// formatting, and full dark-mode support.
// ---------------------------------------------------------------------------
interface TooltipEntry { name?: string; value?: number | string; color?: string; dataKey?: string | number; }
function ChartTooltip({
  active,
  payload,
  label,
  theme,
  currencyKeys = [],
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  theme: ChartTheme;
  currencyKeys?: string[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
      style={{
        background: `${theme.surface}F2`,
        border: `1px solid ${theme.surfaceBorder}`,
        color: theme.text,
      }}
    >
      {label !== undefined && label !== '' && (
        <p className="mb-1.5 font-semibold" style={{ color: theme.text }}>{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const isCurrency = currencyKeys.includes(String(entry.dataKey ?? ''));
          const raw = typeof entry.value === 'string' ? parseFloat(entry.value) || 0 : entry.value ?? 0;
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: theme.textMuted }}>
                <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
                {entry.name}
              </span>
              <span className="font-semibold tabular-nums" style={{ color: theme.text }}>
                {isCurrency ? formatCurrency(raw) : raw.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const STATUS_BG_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  shipped:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  delivered:  'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  cancelled:  'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

// ---------------------------------------------------------------------------
// Glass / gradient KPI hero card with embedded sparkline
// ---------------------------------------------------------------------------
function KpiCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  sparkline,
  sparkColor,
  gradient,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  change?: number;
  changeLabel?: string;
  sparkline?: number[];
  sparkColor: string;
  gradient: string;
}) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const sparkData = (sparkline || []).map((v, i) => ({ i, v }));

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className="h-full">
      <Card className="relative h-full overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-[0.12] blur-2xl"
          style={{ background: gradient }}
        />
        <CardContent className="relative flex h-full flex-col p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
              <p className="mt-2 text-[1.75rem] font-bold leading-none tabular-nums">{value}</p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: `${sparkColor}1A` }}
            >
              <Icon className="h-4 w-4" style={{ color: sparkColor }} />
            </div>
          </div>

          <div className="mt-4 flex min-h-9 items-end justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {change !== undefined && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                    isPositive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : isNegative
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : isNegative ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {Math.abs(change).toFixed(1)}%
                </span>
              )}
              {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
            </div>

            {sparkData.length > 1 && (
              <div className="h-9 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData}>
                    <defs>
                      <linearGradient id={`spark-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={sparkColor} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={sparkColor}
                      strokeWidth={1.75}
                      fill={`url(#spark-${title.replace(/\s+/g, '')})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function GlassSectionCard({
  title,
  icon: Icon,
  action,
  children,
  className = '',
  iconColor = '#C7A27C',
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  iconColor?: string;
}) {
  return (
    <Card className={`overflow-hidden border-border/60 shadow-sm ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 bg-gradient-to-b from-muted/40 to-transparent py-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: `${iconColor}1A` }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
          </span>
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-64 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 w-96 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-[136px]">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                <div className="h-9 w-9 bg-muted rounded-xl animate-pulse" />
              </div>
              <div className="h-7 w-28 bg-muted rounded animate-pulse" />
              <div className="h-5 w-16 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-[360px]">
            <CardContent className="p-6">
              <div className="h-6 w-40 bg-muted rounded animate-pulse mb-6" />
              <div className="h-[280px] bg-muted rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  // Global date-range filter — a preset, or an explicit custom window.
  const [range, setRange] = useState<RangeState>({ preset: '30d' });
  const queryParams: AnalyticsRangeParams =
    range.preset === 'custom'
      ? { startDate: range.startDate, endDate: range.endDate }
      : { range: range.preset };

  const { data: dashData, isLoading: isDashLoading, isFetching: isDashFetching, fulfilledTimeStamp: dashFulfilledAt, refetch: refetchDash } = useGetDashboardStatsQuery(queryParams);
  const { data: overviewData, isLoading: isOverviewLoading, refetch: refetchOverview } = useGetOverviewAnalyticsQuery(queryParams);
  const { data: salesData, isLoading: isSalesLoading, refetch: refetchSales } = useGetSalesAnalyticsQuery(queryParams);
  const { data: productData, isLoading: isProductLoading, refetch: refetchProduct } = useGetProductAnalyticsQuery(queryParams);
  const { data: userData, isLoading: isUserLoading, refetch: refetchUser } = useGetUserAnalyticsQuery(queryParams);
  const { data: orderData, isLoading: isOrderLoading, refetch: refetchOrder } = useGetOrderAnalyticsQuery(queryParams);
  const { data: couponData, isLoading: isCouponLoading, refetch: refetchCoupon } = useGetCouponAnalyticsQuery(queryParams);
  const { data: reviewData, isLoading: isReviewLoading, refetch: refetchReview } = useGetReviewAnalyticsQuery(queryParams);
  const { data: inventoryData, isLoading: isInventoryLoading, refetch: refetchInventory } = useGetInventoryAnalyticsQuery({});

  const isLoading = isDashLoading || isOverviewLoading || isSalesLoading || isProductLoading || isUserLoading || isOrderLoading || isCouponLoading || isReviewLoading || isInventoryLoading;

  const refreshAll = () => {
    refetchDash(); refetchOverview(); refetchSales(); refetchProduct(); refetchUser();
    refetchOrder(); refetchCoupon(); refetchReview(); refetchInventory();
  };

  const theme = useChartTheme();
  const axisTick = { fontSize: 11, fill: theme.axis } as const;
  // RTK Query stamps each fulfilled response — a stable, render-safe freshness source.
  const lastUpdated = useRelativeTime(dashFulfilledAt);

  // Human label for the active range — used in titles + the "vs previous" caption.
  const RANGE_LABELS: Record<Preset, string> = {
    '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days',
    '12m': 'last 12 months', custom: 'selected range',
  };
  const rangeLabel = RANGE_LABELS[range.preset];
  const rangeShort = range.preset === 'custom' ? 'range' : range.preset.toUpperCase();

  interface LowStockProduct { id?: number; variantId?: number; slug?: string; name?: string; sku?: string; size?: string; stock?: number; }
  interface RecentOrder { id?: number; user?: { name?: string; email?: string }; total?: string; status?: string; }
  interface Overview { totalRevenue?: string | number; totalOrders?: number; totalUsers?: number; totalProducts?: number }
  interface DashStats {
    overview?: Overview;
    monthly?: Record<string, unknown>;
    weekly?: Record<string, unknown>;
    topProducts?: unknown[];
    lowStockProducts?: LowStockProduct[];
    recentOrders?: RecentOrder[];
    orderStatusStats?: unknown[];
  }
  const stats = (dashData as { data?: DashStats } | undefined)?.data || (dashData as DashStats | undefined) || {};
  const overview = stats?.overview || {};
  const monthly = stats?.monthly || {};
  const weekly = stats?.weekly || {};
  const topProducts = stats?.topProducts || [];
  const lowStockProducts = stats?.lowStockProducts || [];
  const recentOrders = stats?.recentOrders || [];
  interface OrderStatusStat { status: string; count: string | number; }
  const orderStatusStats = (stats?.orderStatusStats || []) as OrderStatusStat[];

  // Real period-over-period KPI trends + sparkline series from the overview endpoint
  interface OverviewMetric { value?: number; previousValue?: number; change?: number; sparkline?: number[]; }
  interface OverviewAnalytics {
    revenue?: OverviewMetric;
    orders?: OverviewMetric;
    customers?: OverviewMetric;
    fulfillment?: { rate?: number; cancellationRate?: number; delivered?: number; cancelled?: number };
    series?: { date: string; revenue: number; orders: number }[];
  }
  const overviewAnalytics = (overviewData as { data?: OverviewAnalytics } | undefined)?.data || (overviewData as OverviewAnalytics | undefined) || {};
  const revenueMetric = overviewAnalytics.revenue || {};
  const ordersMetric = overviewAnalytics.orders || {};
  const customersMetric = overviewAnalytics.customers || {};
  const fulfillment = overviewAnalytics.fulfillment || {};

  interface SalesAnalytics { bucket?: 'day' | 'month'; monthly?: { month: string; revenue: string | number; orders: number }[]; }
  const salesAnalytics = (salesData as { data?: SalesAnalytics } | undefined)?.data || (salesData as SalesAnalytics | undefined) || {};
  const monthlySales = salesAnalytics?.monthly || [];
  const salesBucket = salesAnalytics?.bucket ?? 'month';
  const labelOpts: Intl.DateTimeFormatOptions =
    salesBucket === 'day' ? { month: 'short', day: 'numeric' } : { month: 'short', year: '2-digit' };
  const revenueChartData = monthlySales.map((item: { month?: string; revenue?: string | number; orders?: number }) => ({
    month: item.month ? new Date(item.month).toLocaleDateString('en-US', labelOpts) : '',
    revenue: typeof item.revenue === 'string' ? parseFloat(item.revenue) || 0 : (item.revenue || 0),
    orders: item.orders || 0,
  }));

  interface ProductAnalytics { categoryPerformance?: { name?: string; revenue?: number; orders?: number }[]; }
  const productAnalytics = (productData as { data?: ProductAnalytics } | undefined)?.data || (productData as ProductAnalytics | undefined) || {};
  const categoryPerformance = productAnalytics?.categoryPerformance || [];
  const categoryChartData = categoryPerformance.slice(0, 5).map((cat: { name?: string; revenue?: number; orders?: number }) => ({
    name: cat.name?.slice(0, 12) || 'Unknown',
    revenue: cat.revenue || 0,
    orders: cat.orders || 0,
  }));

  interface UserAnalytics {
    userGrowth?: { date: string; users: number }[];
    topCustomers?: { userId: number; name?: string; email?: string; user?: { name?: string; email?: string }; orderCount?: number; totalSpent?: string }[];
  }
  const userAnalytics = (userData as { data?: UserAnalytics } | undefined)?.data || (userData as UserAnalytics | undefined) || {};
  const userGrowth = userAnalytics?.userGrowth || [];
  // Backend nests the user under `user` — flatten so name/email render reliably.
  const topCustomers = (userAnalytics?.topCustomers || []).map((c) => ({
    userId: c.userId,
    name: c.user?.name ?? c.name,
    email: c.user?.email ?? c.email,
    orderCount: c.orderCount,
    totalSpent: c.totalSpent,
  }));

  interface OrderAnalytics { hourlyDistribution?: { hour: number; orders: number }[]; averageOrderValue?: number; monthlyAverageOrderValue?: number; repeatCustomerRate?: number; repeatCustomers?: number; }
  const orderAnalytics = (orderData as { data?: OrderAnalytics } | undefined)?.data || (orderData as OrderAnalytics | undefined) || {};
  const hourlyDistribution = orderAnalytics?.hourlyDistribution || [];
  const hourlyChartData = hourlyDistribution.map((h: { hour: number; orders: number }) => ({
    hour: `${h.hour}:00`,
    orders: h.orders,
  }));

  interface CouponAnalytics { topCoupons?: { couponId: number; code?: string; usageCount?: number; totalDiscount?: string; type?: string; value?: number }[]; totalDiscountGiven?: number; }
  const couponAnalytics = (couponData as { data?: CouponAnalytics } | undefined)?.data || (couponData as CouponAnalytics | undefined) || {};
  const topCoupons = couponAnalytics?.topCoupons || [];

  interface ReviewAnalytics {
    ratingDistribution?: { rating: number; count: number }[];
    recentReviews?: unknown[];
    averageRating?: number;
    totalReviews?: number;
  }
  const reviewAnalytics = (reviewData as { data?: ReviewAnalytics } | undefined)?.data || (reviewData as ReviewAnalytics | undefined) || {};
  const ratingDistribution = reviewAnalytics?.ratingDistribution || [];
  const ratingChartData = ratingDistribution.map((r: { rating: number; count: number }) => ({
    rating: `${r.rating}★`,
    count: r.count,
  }));

  interface InventoryAnalytics { lowStockProducts?: unknown[]; totalInventoryValue?: number; totalVariants?: number; healthyStockCount?: number; lowStockCount?: number; outOfStockCount?: number; }
  const inventoryAnalytics = (inventoryData as { data?: InventoryAnalytics } | undefined)?.data || (inventoryData as InventoryAnalytics | undefined) || {};

  const userGrowthChartData = userGrowth.map((item: { date: string; users: number }) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: item.users,
  }));

  const orderStatusChartData = orderStatusStats.map((s: OrderStatusStat) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: typeof s.count === 'string' ? parseInt(s.count) || 0 : s.count || 0,
  }));

  interface TopProduct {
    id?: number;
    variantId?: number;
    variant?: { product?: { name?: string } };
    productName?: string;
    totalSold?: string | number;
    get?: (key: string) => unknown;
  }
  const topProductsChart = (topProducts as TopProduct[]).slice(0, 5).map((item) => ({
    name: item.variant?.product?.name?.slice(0, 15) || item.productName?.slice(0, 15) || `#${item.variantId || item.id}`,
    sales: parseInt(String(item.totalSold || item.get?.('totalSold') || '0')),
  }));

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const fulfillmentRate = fulfillment.rate ?? 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative space-y-6"
    >
      {/* Thin top progress bar while re-fetching after a range change / refresh */}
      {isDashFetching && (
        <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent">
          <div className="h-full w-1/3 animate-[loadingbar_1.1s_ease-in-out_infinite] bg-accent" />
        </div>
      )}

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3 w-3 text-accent" />
            Live store overview
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back — here&apos;s how your store is performing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker value={range} onChange={setRange} />
          {lastUpdated && (
            <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
              Updated {lastUpdated}
            </span>
          )}
          <button
            onClick={refreshAll}
            disabled={isDashFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted disabled:opacity-60"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isDashFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* KPI bento row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Revenue"
          value={`$${Number(revenueMetric.value ?? monthly.revenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          change={revenueMetric.change}
          changeLabel="vs prev period"
          sparkline={revenueMetric.sparkline}
          sparkColor={BRAND.gold}
          gradient="radial-gradient(circle, #C7A27C, transparent)"
        />
        <KpiCard
          title="Orders"
          value={ordersMetric.value ?? Number(monthly.orders) ?? 0}
          icon={ShoppingCart}
          change={ordersMetric.change}
          changeLabel="vs prev period"
          sparkline={ordersMetric.sparkline}
          sparkColor={BRAND.sage}
          gradient="radial-gradient(circle, #4A7C59, transparent)"
        />
        <KpiCard
          title="New Customers"
          value={customersMetric.value ?? Number(monthly.users) ?? 0}
          icon={Users}
          change={customersMetric.change}
          changeLabel="vs prev period"
          sparkColor={BRAND.stone}
          gradient="radial-gradient(circle, #6B6B6B, transparent)"
        />
        <KpiCard
          title="Fulfillment Rate"
          value={`${fulfillmentRate}%`}
          icon={CheckCircle2}
          changeLabel={`${fulfillment.cancellationRate ?? 0}% cancelled · ${rangeLabel}`}
          sparkColor={BRAND.rose}
          gradient="radial-gradient(circle, #B54A4A, transparent)"
        />
      </motion.div>

      {/* Secondary stat strip */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg. Order Value</p>
              <p className="text-xl font-bold tabular-nums">${(orderAnalytics?.averageOrderValue || 0).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Repeat Customer Rate</p>
              <p className="text-xl font-bold tabular-nums">{(orderAnalytics?.repeatCustomerRate || 0).toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg. Rating</p>
              <p className="text-xl font-bold tabular-nums">{(reviewAnalytics?.averageRating || 0).toFixed(1)} <span className="text-sm font-normal text-muted-foreground">/ 5</span></p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hero revenue chart + order status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassSectionCard
            title="Revenue & Orders Trend"
            icon={TrendingUp}
            iconColor={BRAND.gold}
            action={
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: BRAND.gold }} />Revenue</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: BRAND.sage }} />Orders</span>
              </div>
            }
          >
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={revenueChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND.gold} stopOpacity={0.45}/>
                      <stop offset="95%" stopColor={BRAND.gold} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                  <XAxis dataKey="month" tick={axisTick} stroke={theme.axis} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={axisTick} tickFormatter={compactCurrency} stroke={theme.axis} axisLine={false} tickLine={false} width={52} />
                  <YAxis yAxisId="right" orientation="right" tick={axisTick} stroke={theme.axis} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: theme.grid, strokeWidth: 1 }}
                    content={<ChartTooltip theme={theme} currencyKeys={['revenue']} />}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={BRAND.gold}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2.5}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: theme.surface }}
                    animationDuration={700}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke={BRAND.sage}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
                    animationDuration={700}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No sales data yet</div>
            )}
          </GlassSectionCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassSectionCard title="Orders by Status" icon={ShoppingCart} iconColor={BRAND.ink}>
            {orderStatusChartData.length > 0 ? (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={orderStatusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={90}
                        dataKey="value"
                        paddingAngle={3}
                        stroke={theme.surface}
                        strokeWidth={2}
                        animationDuration={700}
                      >
                        {orderStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip theme={theme} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold tabular-nums">
                      {orderStatusChartData.reduce((sum, s) => sum + s.value, 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">Total orders</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {orderStatusChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                        {entry.name}
                      </span>
                      <span className="font-semibold tabular-nums">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No orders yet</div>
            )}
          </GlassSectionCard>
        </motion.div>
      </div>

      {/* Bento grid: products / categories / users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <GlassSectionCard title="Top Products by Sales" icon={Package} iconColor={BRAND.ink}>
            {topProductsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProductsChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                  <XAxis dataKey="name" tick={axisTick} stroke={theme.axis} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={48} />
                  <YAxis tick={axisTick} stroke={theme.axis} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: `${theme.grid}66` }} content={<ChartTooltip theme={theme} />} />
                  <Bar dataKey="sales" name="Units sold" fill={BRAND.gold} radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">No sales data yet</div>
            )}
          </GlassSectionCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassSectionCard title="Category Performance" icon={DollarSign} iconColor={BRAND.sage}>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryChartData} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
                  <XAxis type="number" tick={axisTick} stroke={theme.axis} tickFormatter={compactCurrency} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={axisTick} width={80} stroke={theme.axis} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: `${theme.grid}66` }} content={<ChartTooltip theme={theme} currencyKeys={['revenue']} />} />
                  <Bar dataKey="revenue" name="Revenue" fill={BRAND.sage} radius={[0, 6, 6, 0]} maxBarSize={28} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">No category data yet</div>
            )}
          </GlassSectionCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassSectionCard title={`User Growth · ${rangeShort}`} icon={Users} iconColor={BRAND.gold}>
            {userGrowthChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={userGrowthChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND.gold} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={BRAND.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                  <XAxis dataKey="date" tick={axisTick} stroke={theme.axis} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis tick={axisTick} stroke={theme.axis} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ stroke: theme.grid, strokeWidth: 1 }} content={<ChartTooltip theme={theme} />} />
                  <Area type="monotone" dataKey="users" name="New users" stroke={BRAND.gold} strokeWidth={2.5} fill="url(#colorUsers)" activeDot={{ r: 5, strokeWidth: 2, stroke: theme.surface }} animationDuration={700} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">No user data yet</div>
            )}
          </GlassSectionCard>
        </motion.div>
      </div>

      {/* Recent orders + top customers + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassSectionCard
            title="Recent Orders"
            icon={Clock}
            iconColor="#C7A27C"
            action={<Link href="/admin/orders" className="text-sm text-primary font-medium hover:underline">View all</Link>}
          >
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent orders</p>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 px-2 font-medium">Order</th>
                      <th className="text-left py-2 px-2 font-medium">Customer</th>
                      <th className="text-left py-2 px-2 font-medium">Total</th>
                      <th className="text-left py-2 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order: RecentOrder) => (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 px-2 font-medium">
                          <Link href={`/admin/orders/${order.id}`} className="hover:underline text-primary">#{order.id}</Link>
                        </td>
                        <td className="py-2.5 px-2">
                          <p className="font-medium">{order.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                        </td>
                        <td className="py-2.5 px-2 font-semibold tabular-nums">${parseFloat(order.total || '0').toFixed(2)}</td>
                        <td className="py-2.5 px-2">
                          <Badge variant="outline" className={`border-0 ${STATUS_BG_COLORS[order.status || 'pending']}`}>
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassSectionCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassSectionCard title="Top Customers" icon={Users} iconColor="#4A7C59">
            {topCustomers.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                <Users className="h-12 w-12 mb-2 opacity-50" />
                <p>No customer data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topCustomers.slice(0, 5).map((customer: { userId: number; name?: string; email?: string; orderCount?: number; totalSpent?: string }, index: number) => (
                  <div key={customer.userId} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-accent/10 text-sm font-semibold text-accent-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{customer.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{customer.orderCount || 0} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">${parseFloat(customer.totalSpent || '0').toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{rangeShort}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassSectionCard>
        </motion.div>
      </div>

      {/* Hourly orders + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassSectionCard title={`Orders by Hour · ${rangeShort}`} icon={Clock} iconColor={BRAND.stone}>
            {hourlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourlyChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                  <XAxis dataKey="hour" tick={axisTick} stroke={theme.axis} axisLine={false} tickLine={false} minTickGap={12} />
                  <YAxis tick={axisTick} stroke={theme.axis} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: `${theme.grid}66` }} content={<ChartTooltip theme={theme} />} />
                  <Bar dataKey="orders" name="Orders" fill={BRAND.stone} radius={[4, 4, 0, 0]} maxBarSize={24} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">No hourly data yet</div>
            )}
          </GlassSectionCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassSectionCard
            title="Low / Out of Stock Variants"
            icon={AlertTriangle}
            iconColor="#B54A4A"
            action={<Link href="/admin/products?status=low_stock" className="text-sm text-primary font-medium hover:underline">View all</Link>}
          >
            {lowStockProducts.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-12 w-12 mb-2 opacity-50" />
                <p>All variants well stocked</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.slice(0, 5).map((p: LowStockProduct) => (
                  <Link key={`${p.id}-${p.variantId}`} href={`/admin/products/${p.slug}/edit?variant=${p.variantId}`} className="block">
                    <div className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku} · Size: {p.size}</p>
                      </div>
                      <Badge variant={p.stock === 0 ? 'destructive' : 'secondary'} className={`border-0 shrink-0 ${p.stock === 0 ? '' : 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'}`}>
                        {p.stock} left
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </GlassSectionCard>
        </motion.div>
      </div>

      {/* Coupon & Review Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <GlassSectionCard title="Top Coupons" icon={Tag} iconColor="#C7A27C">
            {topCoupons.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                <Tag className="h-12 w-12 mb-2 opacity-50" />
                <p>No coupon usage yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topCoupons.map((coupon) => (
                  <div key={coupon.couponId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{coupon.code}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {coupon.type === 'percentage' ? `${coupon.value}% off` : `$${coupon.value} off`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Used {coupon.usageCount} times</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                      -${parseFloat(coupon.totalDiscount || '0').toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="pt-3 border-t mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Discount Given</span>
                    <span className="font-semibold tabular-nums">${(couponAnalytics?.totalDiscountGiven || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </GlassSectionCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassSectionCard title="Review Analytics" icon={Star} iconColor={BRAND.terracotta}>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl font-bold tabular-nums">{(reviewAnalytics?.averageRating || 0).toFixed(1)}</div>
              <div>
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(reviewAnalytics?.averageRating || 0) ? 'fill-current' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{reviewAnalytics?.totalReviews || 0} reviews</p>
              </div>
            </div>
            {ratingChartData.length > 0 && (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={ratingChartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="rating" width={40} tick={axisTick} stroke={theme.axis} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: `${theme.grid}66` }} content={<ChartTooltip theme={theme} />} />
                  <Bar dataKey="count" name="Reviews" fill={BRAND.terracotta} radius={[0, 6, 6, 0]} maxBarSize={20} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </GlassSectionCard>
        </motion.div>
      </div>

      {/* Inventory Overview */}
      <motion.div variants={itemVariants}>
        <GlassSectionCard title="Inventory Overview" icon={Warehouse} iconColor="#4A7C59">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-accent/10 to-transparent p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Inventory Value</p>
              <p className="mt-1 text-2xl font-bold text-primary tabular-nums">
                ${(inventoryAnalytics?.totalInventoryValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Variants</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{inventoryAnalytics?.totalVariants || 0}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Healthy Stock</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">{inventoryAnalytics?.healthyStockCount || 0}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-orange-50/50 dark:bg-orange-950/20 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Needs Attention</p>
              <p className="mt-1 text-2xl font-bold text-orange-600 tabular-nums">
                {(inventoryAnalytics?.lowStockCount || 0) + (inventoryAnalytics?.outOfStockCount || 0)}
              </p>
            </div>
          </div>
        </GlassSectionCard>
      </motion.div>
    </motion.div>
  );
}
