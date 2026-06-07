'use client';

import { useState, useEffect } from 'react';
import { useGetAllUsersQuery, useUpdateUserRoleMutation, useDeleteUserMutation } from '@/services/api/usersApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Trash2, Shield, ShieldAlert, Loader2, Users,
  ChevronLeft, ChevronRight, AlertTriangle, X, Filter,
  UserCheck, UserX, Crown,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
}

interface UsersResponse {
  data?: User[];
  pagination?: { total?: number; totalPages?: number };
}

export default function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [actionError, setActionError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const search = useDebounce(searchInput.trim(), 400);
  useEffect(() => { setPage(1); }, [search]);

  const { data: usersResponse, isLoading, isFetching } = useGetAllUsersQuery({
    page,
    limit: 20,
    role: roleFilter || undefined,
    search: search || undefined,
  });
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  const users = (usersResponse as UsersResponse | undefined)?.data || [];
  const pagination = (usersResponse as UsersResponse | undefined)?.pagination;

  const stats = {
    total: pagination?.total ?? users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    customers: users.filter((u) => u.role === 'customer').length,
  };

  const hasActiveFilters = !!(searchInput || roleFilter);

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    setActionError('');
    setUpdatingIds((prev) => new Set(prev).add(userId));
    try {
      await updateUserRole({ id: userId, role: newRole }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
    }
  };

  const handleDelete = async (userId: number, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setActionError('');
    setDeletingIds((prev) => new Set(prev).add(userId));
    try {
      await deleteUser(userId).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setRoleFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination?.total !== undefined ? `${pagination.total} registered users` : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-foreground', bg: 'bg-card', key: '' },
          { label: 'Admins', value: stats.admins, icon: Crown, color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40', key: 'admin' },
          { label: 'Customers', value: stats.customers, icon: UserCheck, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', key: 'customer' },
        ].map(({ label, value, icon: Icon, color, bg, key }) => (
          <button
            key={key}
            onClick={() => { setRoleFilter(key); setPage(1); }}
            className={cn(
              'rounded-xl border p-4 text-left transition-all hover:shadow-sm cursor-pointer',
              bg,
              roleFilter === key ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border'
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

      {/* Error banner */}
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

      {/* Toolbar + Table */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
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
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
              </select>
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
                <p className="font-medium">No users found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters ? 'Try adjusting your filters.' : 'No users have registered yet.'}
                </p>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            <div className={cn('overflow-x-auto transition-opacity', isFetching ? 'opacity-60' : 'opacity-100')}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Joined</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                            {user.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <p className="font-medium">{user.name || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {user.role === 'admin' ? <ShieldAlert className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                          {user.role || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleToggleRole(user.id, user.role ?? '')}
                            disabled={updatingIds.has(user.id)}
                          >
                            {updatingIds.has(user.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              user.role === 'admin' ? 'Make Customer' : 'Make Admin'
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(user.id, user.name || 'this user')}
                            disabled={deletingIds.has(user.id)}
                          >
                            {deletingIds.has(user.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
