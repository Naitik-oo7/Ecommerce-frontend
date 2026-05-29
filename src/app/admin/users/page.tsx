'use client';

import { useState } from 'react';
import { useGetAllUsersQuery, useUpdateUserRoleMutation, useDeleteUserMutation } from '@/services/api/usersApi';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2, Shield, ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const { data: usersResponse, isLoading } = useGetAllUsersQuery({
    page,
    limit: 20,
    role: roleFilter || undefined,
  });
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  interface User {
    id: number;
    name?: string;
    email?: string;
    role?: string;
    createdAt?: string;
  }
  interface UsersResponse { data?: User[]; pagination?: { total?: number; totalPages?: number }; }
  const users = (usersResponse as UsersResponse | undefined)?.data || [];
  const pagination = (usersResponse as UsersResponse | undefined)?.pagination;

  const filteredUsers = search
    ? users.filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    setUpdatingIds((prev) => new Set(prev).add(userId));
    try {
      await updateUserRole({ id: userId, role: newRole }).unwrap();
    } catch {}
    setUpdatingIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setDeletingIds((prev) => new Set(prev).add(userId));
    try {
      await deleteUser(userId).unwrap();
    } catch {}
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        {pagination && <p className="text-muted-foreground text-sm mt-1">{pagination.total} registered users</p>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
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
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Joined</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted-foreground">No users found.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                              {user.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <p className="font-medium text-sm">{user.name}</p>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{user.email}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role === 'admin' ? <ShieldAlert className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(user.createdAt ?? '').toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
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
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(user.id)}
                              disabled={deletingIds.has(user.id)}
                            >
                              {deletingIds.has(user.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
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
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= (pagination.totalPages ?? 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
