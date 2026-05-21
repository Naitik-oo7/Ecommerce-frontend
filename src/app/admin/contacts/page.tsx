'use client';

import { useState } from 'react';
import {
  useGetContactsQuery,
  useUpdateContactMutation,
  useDeleteContactMutation,
} from '@/services/api/contactApi';
import type { ContactMessage, ContactStatus } from '@/services/api/contactApi';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Mail, Trash2, Loader2, Search, Eye, ChevronDown, ChevronUp, Tag,
} from 'lucide-react';

const STATUS_OPTIONS: ContactStatus[] = ['new', 'read', 'replied', 'archived'];

const STATUS_COLORS: Record<ContactStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  read: 'bg-gray-100 text-gray-600',
  replied: 'bg-green-100 text-green-700',
  archived: 'bg-yellow-100 text-yellow-700',
};

export default function AdminContactsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState<Record<number, string>>({});
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const { data: response, isLoading } = useGetContactsQuery({
    status: statusFilter || undefined,
    page,
    limit: 20,
  });

  const [updateContact] = useUpdateContactMutation();
  const [deleteContact] = useDeleteContactMutation();

  const contacts: ContactMessage[] = response?.data || [];
  const pagination = response?.pagination;

  const filtered = search
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase()) ||
          c.subject.toLowerCase().includes(search.toLowerCase()) ||
          c.message.toLowerCase().includes(search.toLowerCase()),
      )
    : contacts;

  const handleExpand = async (contact: ContactMessage) => {
    if (expandedId === contact.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(contact.id);
    if (contact.status === 'new') {
      await handleStatusChange(contact.id, 'read');
    }
  };

  const handleStatusChange = async (id: number, status: ContactStatus) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await updateContact({ id, status }).unwrap();
    } catch {}
    setUpdatingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleSaveNotes = async (id: number) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await updateContact({ id, adminNotes: editNotes[id] ?? '' }).unwrap();
    } catch {}
    setUpdatingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this contact message?')) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteContact(id).unwrap();
      if (expandedId === id) setExpandedId(null);
    } catch {}
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const newCount = contacts.filter((c) => c.status === 'new').length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Contact Messages</h1>
          {newCount > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              {newCount} new
            </span>
          )}
        </div>
        {pagination && (
          <p className="text-muted-foreground text-sm mt-1">{pagination.total} total messages</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No contact messages found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((contact) => (
                <div
                  key={contact.id}
                  className={`border rounded-lg overflow-hidden transition-all ${contact.status === 'new' ? 'border-blue-200 bg-blue-50/30' : 'bg-background'}`}
                >
                  {/* Row header */}
                  <div className="flex items-center gap-3 p-4">
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
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[contact.status]}`}>
                            {contact.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{contact.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(contact.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </button>

                    {/* Actions */}
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleExpand(contact)}
                        title="View message"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(contact.id)}
                        disabled={deletingIds.has(contact.id)}
                        title="Delete"
                      >
                        {deletingIds.has(contact.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedId === contact.id && (
                    <div className="border-t bg-muted/20 p-4 space-y-4">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{contact.message}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Tag className="h-3 w-3" /> Status:
                        </span>
                        <div className="flex gap-2 flex-wrap">
                          {STATUS_OPTIONS.map((s) => (
                            <button
                              key={s}
                              disabled={contact.status === s || updatingIds.has(contact.id)}
                              onClick={() => handleStatusChange(contact.id, s)}
                              className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                                contact.status === s
                                  ? `${STATUS_COLORS[s]} border-transparent`
                                  : 'border-border hover:bg-muted text-muted-foreground'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {updatingIds.has(contact.id) && contact.status !== s ? (
                                <Loader2 className="h-3 w-3 animate-spin inline" />
                              ) : (
                                s.charAt(0).toUpperCase() + s.slice(1)
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Admin Notes</label>
                        <textarea
                          rows={3}
                          className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Add internal notes..."
                          value={editNotes[contact.id] ?? (contact.adminNotes || '')}
                          onChange={(e) =>
                            setEditNotes((prev) => ({ ...prev, [contact.id]: e.target.value }))
                          }
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveNotes(contact.id)}
                          disabled={updatingIds.has(contact.id)}
                        >
                          {updatingIds.has(contact.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
