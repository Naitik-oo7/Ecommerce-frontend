'use client';

import { useState, useEffect } from 'react';
import { useGetCouponsQuery, useCreateCouponMutation, useUpdateCouponMutation, useDeleteCouponMutation } from '@/services/api/couponsApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus, Edit, Trash2, Loader2, X, Check, Tag,
  Search, Filter, AlertTriangle, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

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

interface CouponsResponse {
  data?: Coupon[];
  pagination?: { total?: number; totalPages?: number };
}

export default function AdminCouponsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const search = useDebounce(searchInput.trim(), 400);
  useEffect(() => { setPage(1); }, [search]);

  const { data: couponsResponse, isLoading, isFetching } = useGetCouponsQuery({
    search: search || undefined,
    isActive: statusFilter === 'active' ? 'true' : statusFilter === 'inactive' ? 'false' : undefined,
    type: typeFilter || undefined,
    page,
    limit: 15,
  });
  const [createCoupon, { isLoading: creating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: updating }] = useUpdateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  const coupons = (couponsResponse as CouponsResponse | undefined)?.data || [];
  const pagination = (couponsResponse as CouponsResponse | undefined)?.pagination;

  const now = new Date();
  const stats = {
    total: pagination?.total ?? coupons.length,
    active: coupons.filter((c) => c.isActive && new Date(c.expiresAt) >= now).length,
    expired: coupons.filter((c) => new Date(c.expiresAt) < now).length,
    inactive: coupons.filter((c) => !c.isActive).length,
  };

  const hasActiveFilters = !!(searchInput || statusFilter || typeFilter);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
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
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.code || !form.value || !form.expiresAt) {
      setFormError('Code, value, and expiry date are required');
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
      setFormError(errorWithData?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    setActionError('');
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteCoupon(id).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to delete coupon');
    } finally {
      setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setTypeFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination?.total !== undefined ? `${pagination.total} coupons total` : `${coupons.length} coupons`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Add Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Tag, color: 'text-foreground', bg: 'bg-card', key: '' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40', key: 'active' },
          { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted/40', key: 'inactive' },
          { label: 'Expired', value: stats.expired, icon: Clock, color: 'text-destructive', bg: 'bg-destructive/5', key: 'expired' },
        ].map(({ label, value, icon: Icon, color, bg, key }) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(key === 'expired' ? '' : key); setPage(1); }}
            className={cn(
              'rounded-xl border p-4 text-left transition-all hover:shadow-sm cursor-pointer',
              bg,
              statusFilter === key ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
              <Icon className={cn('h-4 w-4', color)} />
            </div>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
          </button>
        ))}
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {actionError}
          </div>
          <button onClick={() => setActionError('')} className="text-destructive/60 hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Create/Edit form (inline card) */}
      {showForm && (
        <Card className="border-primary/40">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-base font-semibold">{editingId ? 'Edit Coupon' : 'New Coupon'}</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardContent className="p-5 space-y-4">
            {formError && (
              <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Coupon Code <span className="text-destructive">*</span></Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER20"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Discount Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'flat' })}
                  className="w-full h-9 border rounded-md px-3 text-sm bg-background"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Value <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  max={form.type === 'percentage' ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder={form.type === 'percentage' ? '20' : '100'}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Min Order Value (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.minOrderValue}
                  onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expires At <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <div
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all w-fit',
                form.isActive ? 'border-green-200 bg-green-50/30' : 'border-muted bg-muted/20'
              )}
            >
              <div className={cn(
                'h-5 w-9 rounded-full relative',
                form.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'
              )}>
                <div className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                  form.isActive ? 'left-5' : 'left-0.5'
                )} />
              </div>
              <span className="text-sm font-medium">{form.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="h-9 px-6">Cancel</Button>
              <Button onClick={handleSubmit} disabled={creating || updating} className="h-9 px-6">
                {creating || updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {editingId ? 'Save Changes' : 'Create Coupon'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toolbar + Table */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-9"
              />
              {isFetching && search && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" />}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="flat">Flat</option>
              </select>
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Tag className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No coupons found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters ? 'Try adjusting your filters.' : 'Create your first coupon to get started.'}
                </p>
              </div>
              {!hasActiveFilters ? (
                <Button size="sm" className="gap-2" onClick={openCreate}>
                  <Plus className="h-3.5 w-3.5" /> Add Coupon
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            <div className={cn('overflow-x-auto transition-opacity', isFetching ? 'opacity-60' : 'opacity-100')}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Discount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Min Order</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Expires</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Usage</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coupons.map((coupon) => {
                    const isExpired = new Date(coupon.expiresAt) < now;
                    const effectiveStatus = isExpired ? 'expired' : coupon.isActive ? 'active' : 'inactive';
                    return (
                      <tr key={coupon.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3 font-mono font-bold">{coupon.code}</td>
                        <td className="px-4 py-3">
                          {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={isExpired ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                            {new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {coupon.usedCount ?? 0} / {coupon.usageLimit >= 999999 ? '∞' : coupon.usageLimit}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            effectiveStatus === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' :
                            effectiveStatus === 'expired' ? 'bg-destructive/10 text-destructive' :
                            'bg-muted text-muted-foreground'
                          )}>
                            {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1.5 text-xs"
                              onClick={() => openEdit(coupon)}
                            >
                              <Edit className="h-3 w-3" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(coupon.id, coupon.code)}
                              disabled={deletingIds.has(coupon.id)}
                            >
                              {deletingIds.has(coupon.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && (pagination.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of{' '}
                <span className="font-medium text-foreground">{pagination.totalPages}</span>
                <span className="ml-2 text-xs">({pagination.total} total)</span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages ?? 0) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min((pagination.totalPages ?? 0) - 4, page - 2)) + i;
                  return pageNum <= (pagination.totalPages ?? 0) ? (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ) : null;
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= (pagination.totalPages ?? 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
