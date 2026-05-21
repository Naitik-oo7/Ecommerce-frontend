'use client';

import { useState } from 'react';
import { useGetOrdersQuery } from '@/services/api/ordersApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ChevronRight, Clock, Truck, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/redux/hooks';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800',    icon: Package },
  shipped:    { label: 'Shipped',    color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-800',  icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-800',      icon: XCircle },
};

export default function OrdersPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: ordersResponse, isLoading } = useGetOrdersQuery(
    { status: statusFilter || undefined, page, limit: 10 },
    { skip: !isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Sign in to view orders</h2>
        <Link href="/login"><Button className="mt-4">Login</Button></Link>
      </div>
    );
  }

  const orders = (ordersResponse as any)?.data || [];
  const pagination = (ordersResponse as any)?.pagination;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="text-center p-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
          <Link href="/"><Button>Browse Products</Button></Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusInfo.icon;
            const items = order.items || order.orderItems || [];
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    {items.slice(0, 3).map((item: any, i: number) => {
                      const image = item.productImage || item.variant?.product?.media?.[0]?.url;
                      const name = item.productName || item.variant?.product?.name;
                      return (
                        <div key={i} className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                          {image && (
                            <img src={image} alt={name} className="object-cover w-full h-full" />
                          )}
                        </div>
                      );
                    })}
                    {items.length > 3 && (
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                        +{items.length - 3}
                      </div>
                    )}
                    <div className="flex-1 text-right">
                      <p className="font-bold text-lg">${parseFloat(order.total).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary">
                        View Details <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
