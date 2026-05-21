'use client';

import { motion } from 'framer-motion';
import {
  useGetDashboardStatsQuery,
  useGetSalesAnalyticsQuery,
  useGetProductAnalyticsQuery,
  useGetUserAnalyticsQuery,
  useGetOrderAnalyticsQuery,
  useGetCouponAnalyticsQuery,
  useGetReviewAnalyticsQuery,
  useGetInventoryAnalyticsQuery,
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
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const STATUS_BG_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

const PIE_COLORS = ['#FBBF24', '#60A5FA', '#818CF8', '#34D399', '#F87171'];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: number;
  trendLabel?: string;
}) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <span
                className={`flex items-center text-xs font-medium ${
                  isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : isNegative ? (
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                ) : null}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trendLabel && !subtitle && <p className="text-xs text-muted-foreground">{trendLabel}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-32">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-8 w-8 bg-muted rounded-md animate-pulse" />
              </div>
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
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
  const { data: dashData, isLoading: isDashLoading } = useGetDashboardStatsQuery({});
  const { data: salesData, isLoading: isSalesLoading } = useGetSalesAnalyticsQuery({});
  const { data: productData, isLoading: isProductLoading } = useGetProductAnalyticsQuery({});
  const { data: userData, isLoading: isUserLoading } = useGetUserAnalyticsQuery({});
  const { data: orderData, isLoading: isOrderLoading } = useGetOrderAnalyticsQuery({});
  const { data: couponData, isLoading: isCouponLoading } = useGetCouponAnalyticsQuery({});
  const { data: reviewData, isLoading: isReviewLoading } = useGetReviewAnalyticsQuery({});
  const { data: inventoryData, isLoading: isInventoryLoading } = useGetInventoryAnalyticsQuery({});

  const isLoading = isDashLoading || isSalesLoading || isProductLoading || isUserLoading || isOrderLoading || isCouponLoading || isReviewLoading || isInventoryLoading;

  const stats = (dashData as any)?.data || (dashData as any) || {};
  const overview = stats?.overview || {};
  const monthly = stats?.monthly || {};
  const weekly = stats?.weekly || {};
  const topProducts = stats?.topProducts || [];
  const lowStockProducts = stats?.lowStockProducts || [];
  const recentOrders = stats?.recentOrders || [];
  const orderStatusStats: any[] = stats?.orderStatusStats || [];

  const salesAnalytics = (salesData as any)?.data || (salesData as any) || {};
  const monthlySales: any[] = salesAnalytics?.monthly || [];
  const revenueChartData = monthlySales.map((item: any) => ({
    month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    revenue: parseFloat(item.revenue) || 0,
    orders: item.orders,
  }));

  const productAnalytics = (productData as any)?.data || (productData as any) || {};
  const categoryPerformance: any[] = productAnalytics?.categoryPerformance || [];
  const categoryChartData = categoryPerformance.slice(0, 5).map((cat: any) => ({
    name: cat.name?.slice(0, 12) || 'Unknown',
    revenue: cat.revenue || 0,
    orders: cat.orders || 0,
  }));

  const userAnalytics = (userData as any)?.data || (userData as any) || {};
  const userGrowth: any[] = userAnalytics?.userGrowth || [];
  const topCustomers: any[] = userAnalytics?.topCustomers || [];

  const orderAnalytics = (orderData as any)?.data || (orderData as any) || {};
  const hourlyDistribution: any[] = orderAnalytics?.hourlyDistribution || [];
  const hourlyChartData = hourlyDistribution.map((h: any) => ({
    hour: `${h.hour}:00`,
    orders: h.orders,
  }));

  const couponAnalytics = (couponData as any)?.data || (couponData as any) || {};
  const topCoupons: any[] = couponAnalytics?.topCoupons || [];

  const reviewAnalytics = (reviewData as any)?.data || (reviewData as any) || {};
  const ratingDistribution: any[] = reviewAnalytics?.ratingDistribution || [];
  const recentReviews: any[] = reviewAnalytics?.recentReviews || [];
  const ratingChartData = ratingDistribution.map((r: any) => ({
    rating: `${r.rating}★`,
    count: r.count,
  }));

  const inventoryAnalytics = (inventoryData as any)?.data || (inventoryData as any) || {};

  const userGrowthChartData = userGrowth.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: item.users,
  }));

  const orderStatusChartData = orderStatusStats.map((s: any) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: parseInt(s.count),
  }));

  // Updated to use variant.product chain from fixed backend
  const topProductsChart = topProducts.slice(0, 5).map((item: any) => ({
    name: item.variant?.product?.name?.slice(0, 15) || item.productName?.slice(0, 15) || `#${item.variantId || item.id}`,
    sales: parseInt(item.totalSold || item.get?.('totalSold') || 0),
  }));

  // Calculate trends (mock for now, can be calculated from historical data)
  const revenueTrend = monthly.revenue > 0 ? 12.5 : 0;
  const ordersTrend = monthly.orders > 0 ? 8.3 : 0;
  const usersTrend = monthly.users > 0 ? 24.1 : 0;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${(overview.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`$${(monthly.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} this month`}
          icon={DollarSign}
          trend={revenueTrend}
          trendLabel="vs last month"
        />
        <StatCard
          title="Orders"
          value={overview.totalOrders || 0}
          subtitle={`${monthly.orders || 0} this month · ${weekly.orders || 0} this week`}
          icon={ShoppingCart}
          trend={ordersTrend}
          trendLabel="vs last month"
        />
        <StatCard
          title="Customers"
          value={overview.totalUsers || 0}
          subtitle={`${monthly.users || 0} new this month`}
          icon={Users}
          trend={usersTrend}
          trendLabel="vs last month"
        />
        <StatCard
          title="Active Products"
          value={overview.totalProducts || 0}
          subtitle={lowStockProducts.length > 0 ? `${lowStockProducts.length} need attention` : 'All well stocked'}
          icon={Package}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} stroke="#9ca3af" />
                    <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">No sales data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Orders by Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {orderStatusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={orderStatusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {orderStatusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">No orders yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Top Products by Sales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {topProductsChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topProductsChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">No sales data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Category Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `$${v.toLocaleString()}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} stroke="#9ca3af" />
                    <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#34d399" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">No category data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                User Growth (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {userGrowthChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={userGrowthChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">No user data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                Low Stock Products
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {lowStockProducts.length === 0 ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="h-12 w-12 mb-2 opacity-50" />
                  <p>All products well stocked</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                  {lowStockProducts.map((p: any) => (
                    <Link key={`${p.id}-${p.variantId}`} href={`/admin/products/${p.id}`}>
                      <div className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors cursor-pointer">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.sku} · Size: {p.size}
                          </p>
                        </div>
                        <Badge variant={p.stock === 0 ? 'destructive' : 'secondary'} className={p.stock === 0 ? '' : 'bg-orange-100 text-orange-700 hover:bg-orange-100'}>
                          {p.stock} left
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Recent Orders
                </span>
                <Link href="/admin/orders" className="text-sm text-primary font-normal hover:underline cursor-pointer">View all</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent orders</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-4">Order</th>
                        <th className="text-left py-2 pr-4">Customer</th>
                        <th className="text-left py-2 pr-4">Total</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order: any) => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-2 pr-4 font-medium">
                            <Link href={`/admin/orders/${order.id}`} className="hover:underline text-primary cursor-pointer">#{order.id}</Link>
                          </td>
                          <td className="py-2 pr-4">
                            <p className="font-medium">{order.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                          </td>
                          <td className="py-2 pr-4 font-semibold">${parseFloat(order.total).toFixed(2)}</td>
                          <td className="py-2">
                            <Badge variant="outline" className={STATUS_BG_COLORS[order.status]}>
                              {order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {topCustomers.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                  <Users className="h-12 w-12 mb-2 opacity-50" />
                  <p>No customer data yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topCustomers.slice(0, 5).map((customer: any, index: number) => (
                    <div key={customer.userId} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{customer.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{customer.orderCount} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${parseFloat(customer.totalSpent || 0).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">lifetime</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Order Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Average Order Value
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold">
                ${(orderAnalytics?.averageOrderValue || 0).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Monthly: ${(orderAnalytics?.monthlyAverageOrderValue || 0).toFixed(2)}
              </p>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Repeat Customer Rate</span>
                  <span className="font-semibold">{(orderAnalytics?.repeatCustomerRate || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Repeat Customers</span>
                  <span className="font-semibold">{orderAnalytics?.repeatCustomers || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Orders by Hour (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {hourlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">No hourly data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Coupon & Review Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Top Coupons
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {topCoupons.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                  <Tag className="h-12 w-12 mb-2 opacity-50" />
                  <p>No coupon usage yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topCoupons.map((coupon: any) => (
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
                      <span className="text-sm font-semibold text-green-600">
                        -${coupon.totalDiscount?.toFixed(2) || 0}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 border-t mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Discount Given</span>
                      <span className="font-semibold">${(couponAnalytics?.totalDiscountGiven || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Review Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl font-bold">{(reviewAnalytics?.averageRating || 0).toFixed(1)}</div>
                <div>
                  <div className="flex text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${star <= Math.round(reviewAnalytics?.averageRating || 0) ? 'fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{reviewAnalytics?.totalReviews || 0} reviews</p>
                </div>
              </div>
              {ratingChartData.length > 0 && (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={ratingChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="rating" width={40} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Inventory Analytics */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-primary" />
              Inventory Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                <p className="text-2xl font-bold text-primary">
                  ${(inventoryAnalytics?.totalInventoryValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Variants</p>
                <p className="text-2xl font-bold">{inventoryAnalytics?.totalVariants || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Healthy Stock</p>
                <p className="text-2xl font-bold text-green-600">{inventoryAnalytics?.healthyStockCount || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(inventoryAnalytics?.lowStockCount || 0) + (inventoryAnalytics?.outOfStockCount || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
