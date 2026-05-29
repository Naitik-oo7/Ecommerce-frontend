'use client';

import { useState } from 'react';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/services/api/ordersApi';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ORDER_STATUS_CONFIG } from '@/constants';

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const { data: ordersResponse, isLoading } = useGetOrdersQuery({
    status: statusFilter || undefined,
    page,
    limit: 20,
    isAdmin: true,
  });
  const [updateStatus] = useUpdateOrderStatusMutation();

  interface Order {
    id: number;
    status: string;
    total?: string;
    createdAt?: string;
    paymentStatus?: string;
    user?: { name?: string; email?: string };
  }
  interface OrdersResponse { data?: Order[]; pagination?: { total?: number; totalPages?: number }; }
  const orders = (ordersResponse as OrdersResponse | undefined)?.data || [];
  const pagination = (ordersResponse as OrdersResponse | undefined)?.pagination;

  const handleStatusChange = async (orderId: number, status: string) => {
    setUpdatingIds((prev) => new Set(prev).add(orderId));
    try {
      await updateStatus({ id: orderId, status, isAdmin: true }).unwrap();
    } catch {}
    setUpdatingIds((prev) => { const n = new Set(prev); n.delete(orderId); return n; });
  };

  const filteredOrders = search
    ? orders.filter((o) =>
        String(o.id).includes(search) ||
        o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        {pagination && <p className="text-muted-foreground text-sm mt-1">{pagination.total} total orders</p>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left p-3">Order</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Total</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Payment</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-muted-foreground">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium text-sm">#{order.id}</td>
                        <td className="p-3">
                          <p className="text-sm font-medium">{order.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(order.createdAt ?? '').toLocaleDateString()}
                        </td>
                        <td className="p-3 text-sm font-semibold">${parseFloat(order.total ?? '0').toFixed(2)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              disabled={updatingIds.has(order.id)}
                              className={`border rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent ${ORDER_STATUS_CONFIG[order.status]?.bg || 'bg-muted'} ${ORDER_STATUS_CONFIG[order.status]?.color || 'text-foreground'}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {updatingIds.has(order.id) && <Loader2 className="h-3 w-3 animate-spin" />}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.paymentStatus || 'pending'}
                          </span>
                        </td>
                        <td className="p-3">
                          <Link href={`/admin/orders/${order.id}`} className="cursor-pointer">
                            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {pagination && (pagination.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="cursor-pointer">Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= (pagination.totalPages ?? 1)} className="cursor-pointer">Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
