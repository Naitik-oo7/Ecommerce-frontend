'use client';

import { useState, useEffect } from 'react';
import {
  useGetContactsQuery,
  useUpdateContactMutation,
  useDeleteContactMutation,
} from '@/services/api/contactApi';
import type { ContactMessage, ContactStatus } from '@/services/api/contactApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Mail, Trash2, Loader2, Search, Eye, ChevronDown, ChevronUp,
  AlertTriangle, X, Filter, ChevronLeft, ChevronRight,
  MessageSquare, MailOpen, Reply, Archive,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: ContactStatus[] = ['new', 'read', 'replied', 'archived'];

const STATUS_COLORS: Record<ContactStatus, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  read: 'bg-muted text-muted-foreground',
  replied: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  archived: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
};

export default function AdminContactsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState<Record<number, string>>({});
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [actionError, setActionError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const search = useDebounce(searchInput.trim(), 400);
  useEffect(() => { setPage(1); }, [search]);

  const { data: response, isLoading, isFetching } = useGetContactsQuery({
    status: statusFilter || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  const [updateContact] = useUpdateContactMutation();
  const [deleteContact] = useDeleteContactMutation();

  const contacts: ContactMessage[] = response?.data || [];
  const pagination = response?.pagination;

  const stats = {
    total: pagination?.total ?? contacts.length,
    newCount: contacts.filter((c) => c.status === 'new').length,
    replied: contacts.filter((c) => c.status === 'replied').length,
    archived: contacts.filter((c) => c.status === 'archived').length,
  };

  const hasActiveFilters = !!(searchInput || statusFilter);

  const handleExpand = async (contact: ContactMessage) => {
    if (expandedId === contact.id) { setExpandedId(null); return; }
    setExpandedId(contact.id);
    if (contact.status === 'new') await handleStatusChange(contact.id, 'read');
  };

  const handleStatusChange = async (id: number, status: ContactStatus) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await updateContact({ id, status }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleSaveNotes = async (id: number) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await updateContact({ id, adminNotes: editNotes[id] ?? '' }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to save notes');
    } finally {
      setUpdatingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this contact message?')) return;
    setActionError('');
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteContact(id).unwrap();
      if (expandedId === id) setExpandedId(null);
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to delete message');
    } finally {
      setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Contact Messages
            {stats.newCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                {stats.newCount} new
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination?.total !== undefined ? `${pagination.total} total messages` : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: MessageSquare, color: 'text-foreground', bg: 'bg-card', key: '' },
          { label: 'New', value: stats.newCount, icon: Mail, color: 'text-blue-700', bg: 'bg-blue-50', key: 'new' },
          { label: 'Replied', value: stats.replied, icon: Reply, color: 'text-green-700', bg: 'bg-green-50', key: 'replied' },
          { label: 'Archived', value: stats.archived, icon: Archive, color: 'text-amber-700', bg: 'bg-amber-50', key: 'archived' },
        ].map(({ label, value, icon: Icon, color, bg, key }) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(key); setPage(1); }}
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

      {/* Toolbar + Messages */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, subject, or message…"
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
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <MailOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No messages found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters ? 'Try adjusting your filters.' : 'No contact messages have been received yet.'}
                </p>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            <div className={cn('divide-y divide-border transition-opacity', isFetching ? 'opacity-60' : 'opacity-100')}>
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    'overflow-hidden transition-all',
                    contact.status === 'new' ? 'border-l-2 border-l-blue-400' : ''
                  )}
                >
                  {/* Row header */}
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                    <button
                      onClick={() => handleExpand(contact)}
                      className="flex-1 flex items-start gap-3 text-left min-w-0"
                    >
                      <div className="shrink-0 mt-0.5">
                        {expandedId === contact.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm">{contact.name}</span>
                          <span className="text-xs text-muted-foreground">{contact.email}</span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[contact.status])}>
                            {contact.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">{contact.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(contact.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </button>

                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExpand(contact)} title="View message">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(contact.id)}
                        disabled={deletingIds.has(contact.id)}
                        title="Delete"
                      >
                        {deletingIds.has(contact.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedId === contact.id && (
                    <div className="border-t bg-muted/20 p-4 space-y-4">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{contact.message}</p>

                      <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
                        <span className="text-xs font-medium text-muted-foreground">Status:</span>
                        <div className="flex gap-2 flex-wrap">
                          {STATUS_OPTIONS.map((s) => (
                            <button
                              key={s}
                              disabled={contact.status === s || updatingIds.has(contact.id)}
                              onClick={() => handleStatusChange(contact.id, s)}
                              className={cn(
                                'text-xs px-3 py-1 rounded-full border font-medium transition-colors',
                                contact.status === s
                                  ? `${STATUS_COLORS[s]} border-transparent`
                                  : 'border-border hover:bg-muted text-muted-foreground',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                              )}
                            >
                              {updatingIds.has(contact.id) && contact.status !== s
                                ? <Loader2 className="h-3 w-3 animate-spin inline" />
                                : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Admin Notes</label>
                        <textarea
                          rows={3}
                          className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Add internal notes…"
                          value={editNotes[contact.id] ?? (contact.adminNotes || '')}
                          onChange={(e) => setEditNotes((prev) => ({ ...prev, [contact.id]: e.target.value }))}
                        />
                        <Button size="sm" onClick={() => handleSaveNotes(contact.id)} disabled={updatingIds.has(contact.id)} className="h-8">
                          {updatingIds.has(contact.id) && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages ?? 0) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min((pagination.totalPages ?? 0) - 4, page - 2)) + i;
                  return pageNum <= (pagination.totalPages ?? 0) ? (
                    <Button key={pageNum} variant={pageNum === page ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(pageNum)}>
                      {pageNum}
                    </Button>
                  ) : null;
                })}
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => p + 1)} disabled={page >= (pagination.totalPages ?? 1)}>
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
