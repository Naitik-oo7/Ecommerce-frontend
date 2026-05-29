'use client';

import { useState } from 'react';
import { useGetCouponsQuery, useCreateCouponMutation, useUpdateCouponMutation, useDeleteCouponMutation } from '@/services/api/couponsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Loader2, X, Check, Tag } from 'lucide-react';

type CouponForm = {
  code: string;
  type: 'percentage' | 'flat';
  value: string;
  minOrderValue: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
};

const emptyForm: CouponForm = {
  code: '', type: 'percentage', value: '', minOrderValue: '0', usageLimit: '', expiresAt: '', isActive: true,
};

export default function AdminCouponsPage() {
  const { data: couponsResponse, isLoading } = useGetCouponsQuery({});
  const [createCoupon, { isLoading: creating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: updating }] = useUpdateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [error, setError] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  interface Coupon {
    id: number;
    code: string;
    type: 'percentage' | 'flat';
    value: string;
    minOrderValue?: string;
    usageLimit: number;
    expiresAt: string;
    isActive: boolean;
    usedCount?: number;
  }
  interface CouponsResponse { data?: Coupon[]; }
  const coupons = (couponsResponse as CouponsResponse | undefined)?.data || [];

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrderValue: String(coupon.minOrderValue || 0),
      usageLimit: String(coupon.usageLimit || ''),
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      isActive: coupon.isActive,
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.code || !form.value || !form.expiresAt) {
      setError('Code, value, and expiry date are required');
      return;
    }
    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      minOrderValue: parseFloat(form.minOrderValue) || 0,
      usageLimit: parseInt(form.usageLimit) || 999999,
      expiresAt: form.expiresAt,
      isActive: form.isActive,
    };
    try {
      if (editingId) {
        await updateCoupon({ id: editingId, ...payload }).unwrap();
      } else {
        await createCoupon(payload).unwrap();
      }
      setShowForm(false);
    } catch (err) {
      const errorWithData = err as { data?: { message?: string } };
      setError(errorWithData?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this coupon?')) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteCoupon(id).unwrap();
    } catch {}
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground text-sm mt-1">{coupons.length} coupons</p>
        </div>
        <Button onClick={openCreate} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />Add Coupon
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>{editingId ? 'Edit Coupon' : 'New Coupon'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Coupon Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER20"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label>Discount Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'flat' })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount ($)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Value *</Label>
                <Input
                  type="number"
                  min="0"
                  max={form.type === 'percentage' ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder={form.type === 'percentage' ? '20' : '10.00'}
                />
              </div>
              <div className="space-y-1">
                <Label>Min Order Value ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.minOrderValue}
                  onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-1">
                <Label>Expires At *</Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </label>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={creating || updating} className="flex-1">
                {(creating || updating) ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />{editingId ? 'Update' : 'Create'}</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left p-3">Code</th>
                    <th className="text-left p-3">Discount</th>
                    <th className="text-left p-3">Min Order</th>
                    <th className="text-left p-3">Expires</th>
                    <th className="text-left p-3">Usage</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-muted-foreground">
                        <Tag className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>No coupons yet. Create your first one!</p>
                      </td>
                    </tr>
                  ) : (
                    coupons.map((coupon) => {
                      const isExpired = new Date(coupon.expiresAt) < new Date();
                      return (
                        <tr key={coupon.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-mono font-bold text-sm">{coupon.code}</td>
                          <td className="p-3 text-sm">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                          </td>
                          <td className="p-3 text-sm">${coupon.minOrderValue || 0}</td>
                          <td className="p-3 text-sm">
                            <span className={isExpired ? 'text-destructive' : ''}>
                              {new Date(coupon.expiresAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-3 text-sm">
                            {coupon.usedCount || 0} / {coupon.usageLimit >= 999999 ? '∞' : coupon.usageLimit}
                          </td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              !coupon.isActive || isExpired ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                            }`}>
                              {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(coupon)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(coupon.id)}
                                disabled={deletingIds.has(coupon.id)}
                              >
                                {deletingIds.has(coupon.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
