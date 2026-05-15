'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Code</th>
                  <th className="text-left p-4">Discount</th>
                  <th className="text-left p-4">Min Order</th>
                  <th className="text-left p-4">Expires</th>
                  <th className="text-left p-4">Usage</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No coupons found. Create your first coupon to get started.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon: any) => (
                    <tr key={coupon.id} className="border-b">
                      <td className="p-4 font-mono font-bold">{coupon.code}</td>
                      <td className="p-4">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                      </td>
                      <td className="p-4">${coupon.minOrderValue || '0'}</td>
                      <td className="p-4">{new Date(coupon.expiresAt).toLocaleDateString()}</td>
                      <td className="p-4">{coupon.usedCount || 0} / {coupon.maxUses || '∞'}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
