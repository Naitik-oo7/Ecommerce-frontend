'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetAllUsersQuery, useGetCustomerStatsQuery, useDeleteUserMutation } from '@/services/api/usersApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Trash2, Loader2, Users, ChevronLeft, ChevronRight,
  AlertTriangle, X, UserX, CalendarDays, Mail, Eye,
  BadgeCheck, Clock, Filter, UserPlus, ShoppingBag,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
  createdAt?: string;
}

interface UsersResponse {
  data?: User[];
  pagination?: { total?: number; totalPages?: number };
}

interface CustomerStats {
  total: number;
  verified: number;
  unverified: number;
  newThisMonth: number;
  withOrders: number;
}

function UserAvatar({ name }: { name?: string }) {
  const initials = name
    ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm shrink-0 select-none">
      {initials}
    </div>
  );
}

function VerifiedBadge({ verified }: { verified?: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
      <BadgeCheck className="h-3.5 w-3.5" /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
      <Clock className="h-3.5 w-3.5" /> Pending
    </span>
  );
}

function StatCard({ icon: Icon, label, value, tint, loading }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tint: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-tight">
          {loading ? <span className="text-muted-foreground">…</span> : value}
        </p>
      </div>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [actionError, setActionError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [verified, setVerified] = useState('');      // '', 'true', 'false'
  const [sort, setSort] = useState('newest');        // 'newest' | 'oldest' | 'name'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const search = useDebounce(searchInput.trim(), 400);
  useEffect(() => { setPage(1); }, [search, verified, sort, startDate, endDate]);

  const { data: usersResponse, isLoading, isFetching } = useGetAllUsersQuery({
    page,
    limit: 20,
    role: 'customer',
    search: search || undefined,
    verified: verified || undefined,
    sort,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const { data: statsResponse, isLoading: statsLoading } = useGetCustomerStatsQuery({});
  const [deleteUser] = useDeleteUserMutation();

  const users = (usersResponse as UsersResponse | undefined)?.data ?? [];
  const pagination = (usersResponse as UsersResponse | undefined)?.pagination;
  const stats = (statsResponse as { data?: CustomerStats } | undefined)?.data
    ?? (statsResponse as CustomerStats | undefined);

  const userToDelete = confirmDeleteId ? users.find((u) => u.id === confirmDeleteId) : null;
  const activeFilterCount = [verified, startDate, endDate].filter(Boolean).length + (sort !== 'newest' ? 1 : 0);

  const openDetail = (id: number) => router.push(`/admin/users/${id}`);

  const handleDelete = async (userId: number) => {
    setActionError('');
    setDeletingIds((prev) => new Set(prev).add(userId));
    setConfirmDeleteId(null);
    try {
      await deleteUser(userId).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
    }
  };

  const clearSearch = () => { setSearchInput(''); setPage(1); };
  const clearFilters = () => { setVerified(''); setSort('newest'); setStartDate(''); setEndDate(''); setPage(1); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {stats?.total !== undefined
            ? `${stats.total} registered customer${stats.total !== 1 ? 's' : ''}`
            : 'Loading…'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Total Customers"
          value={stats?.total ?? 0}
          tint="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
          loading={statsLoading}
        />
        <StatCard
          icon={UserPlus}
          label="New This Month"
          value={stats?.newThisMonth ?? 0}
          tint="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
          loading={statsLoading}
        />
        <StatCard
          icon={BadgeCheck}
          label="Verified"
          value={stats?.verified ?? 0}
          tint="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
          loading={statsLoading}
        />
        <StatCard
          icon={ShoppingBag}
          label="With Orders"
          value={stats?.withOrders ?? 0}
          tint="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
          loading={statsLoading}
        />
      </div>

      {/* Error banner */}
      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {actionError}
          </div>
          <button onClick={() => setActionError('')} className="text-destructive/60 hover:text-destructive transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-background rounded-xl border shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold">Delete customer?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{userToDelete?.name || 'This user'}</span>
                  {' '}will be permanently removed. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingIds.has(confirmDeleteId)}
              >
                {deletingIds.has(confirmDeleteId) ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filters + Table */}
      <Card>
        {/* Toolbar */}
        <div className="p-4 border-b space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-9 h-9"
              />
              {isFetching && search ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : searchInput ? (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() => setShowFilters((s) => !s)}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold inline-flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="pt-3 border-t flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Verification</label>
                <select
                  value={verified}
                  onChange={(e) => setVerified(e.target.value)}
                  className="block h-9 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Sort by</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="block h-9 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Joined from</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block h-9 px-3 rounded-md border bg-background text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Joined to</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block h-9 px-3 rounded-md border bg-background text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <UserX className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No customers found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchInput || activeFilterCount > 0 ? 'Try adjusting your search or filters.' : 'No customers have registered yet.'}
                </p>
              </div>
              {(searchInput || activeFilterCount > 0) && (
                <Button variant="outline" size="sm" onClick={() => { clearSearch(); clearFilters(); }}>Clear all</Button>
              )}
            </div>
          ) : (
            <div className={cn('transition-opacity', isFetching ? 'opacity-60' : 'opacity-100')}>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Joined</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => openDetail(user.id)}
                        className="hover:bg-muted/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={user.name} />
                            <span className="font-medium">{user.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email || '—'}</td>
                        <td className="px-4 py-3"><VerifiedBadge verified={user.isVerified} /></td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openDetail(user.id)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setConfirmDeleteId(user.id)}
                              disabled={deletingIds.has(user.id)}
                              title="Delete customer"
                            >
                              {deletingIds.has(user.id)
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-border">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => openDetail(user.id)}
                    className="flex items-center gap-3 px-4 py-3 active:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <UserAvatar name={user.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{user.name || '—'}</p>
                        <VerifiedBadge verified={user.isVerified} />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{user.email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => openDetail(user.id)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDeleteId(user.id)}
                        disabled={deletingIds.has(user.id)}
                        title="Delete customer"
                      >
                        {deletingIds.has(user.id)
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
