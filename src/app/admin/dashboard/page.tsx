'use client';

import { useGetDashboardStatsQuery, useGetSalesAnalyticsQuery } from '@/services/api/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  pending:    '#FBBF24',
  processing: '#60A5FA',
  shipped:    '#818CF8',
  delivered:  '#34D399',
  cancelled:  '#F87171',
};

const PIE_COLORS = ['#FBBF24', '#60A5FA', '#818CF8', '#34D399', '#F87171'];

function StatCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data: dashData, isLoading } = useGetDashboardStatsQuery({});
  const { data: salesData } = useGetSalesAnalyticsQuery({});

  const stats = (dashData as any)?.data || (dashData as any) || {};
  const overview = stats?.overview || {};
  const monthly = stats?.monthly || {};
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

  const orderStatusChartData = orderStatusStats.map((s: any) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: parseInt(s.count),
  }));

  const topProductsChart = topProducts.slice(0, 5).map((item: any) => ({
    name: item.product?.name?.slice(0, 15) || `#${item.productId}`,
    sales: parseInt(item.totalSold || item.get?.('totalSold') || 0),
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${(overview.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`$${(monthly.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} this month`}
          icon={DollarSign}
        />
        <StatCard
          title="Orders"
          value={overview.totalOrders || 0}
          subtitle={`${monthly.orders || 0} this month`}
          icon={ShoppingCart}
        />
        <StatCard
          title="Users"
          value={overview.totalUsers || 0}
          subtitle={`${monthly.users || 0} new this month`}
          icon={Users}
        />
        <StatCard
          title="Active Products"
          value={overview.totalProducts || 0}
          subtitle={lowStockProducts.length > 0 ? `${lowStockProducts.length} low stock` : 'All stocked'}
          icon={Package}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">No sales data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {orderStatusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={orderStatusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

        <Card>
          <CardHeader>
            <CardTitle>Top Products by Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProductsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">No sales data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Low Stock Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">All products well stocked</div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {lowStockProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {p.id}</p>
                    </div>
                    <span className={`text-sm font-bold px-2 py-1 rounded ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {p.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Orders
            <Link href="/admin/orders" className="text-sm text-primary font-normal hover:underline">View all</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium">
                        <Link href={`/orders/${order.id}`} className="hover:underline text-primary">#{order.id}</Link>
                      </td>
                      <td className="py-2 pr-4">
                        <p>{order.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                      </td>
                      <td className="py-2 pr-4 font-semibold">${parseFloat(order.total).toFixed(2)}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium`} style={{
                          backgroundColor: STATUS_COLORS[order.status] + '33',
                          color: STATUS_COLORS[order.status],
                        }}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
