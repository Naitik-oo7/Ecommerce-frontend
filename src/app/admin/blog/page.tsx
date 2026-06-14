'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  useGetBlogPostsQuery,
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  useDeleteBlogPostMutation,
  BlogPost,
} from '@/services/api/blogApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Plus, Search, Edit2, Trash2, Eye, EyeOff,
  Calendar, Clock, Save, X, ExternalLink, Star,
  Image as ImageIcon, FileText, AlertTriangle,
  Filter, ChevronLeft, ChevronRight, Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Fashion', 'Lifestyle', 'Sustainability', 'Trends', 'Styling'];

export default function AdminBlogPage() {
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const [form, setForm] = useState<Partial<BlogPost>>({
    title: '', slug: '', excerpt: '', content: '',
    category: 'Fashion', image: '', readTime: '5 min read',
    isFeatured: false, isPublished: true,
  });

  const search = useDebounce(searchInput.trim(), 400);
  useEffect(() => { setPage(1); }, [search, categoryFilter, publishedFilter]);

  const { data: postsResponse, isLoading, isFetching } = useGetBlogPostsQuery({
    search: search || undefined,
    category: categoryFilter || undefined,
    includeUnpublished: 'true' as unknown as string,
    page,
    limit: 15,
  });
  const [createPost, { isLoading: isCreating }] = useCreateBlogPostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdateBlogPostMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeleteBlogPostMutation();

  const posts: BlogPost[] = postsResponse?.data || [];
  const pagination = postsResponse?.pagination;

  const filteredPosts = useMemo(() => {
    if (!publishedFilter) return posts;
    return posts.filter((p) =>
      publishedFilter === 'published' ? p.isPublished : !p.isPublished
    );
  }, [posts, publishedFilter]);

  const stats = {
    total: pagination?.total ?? posts.length,
    published: posts.filter((p) => p.isPublished).length,
    drafts: posts.filter((p) => !p.isPublished).length,
    featured: posts.filter((p) => p.isFeatured).length,
  };

  const hasActiveFilters = !!(searchInput || categoryFilter || publishedFilter);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ title: '', slug: '', excerpt: '', content: '', category: 'Fashion', image: '', readTime: '5 min read', isFeatured: false, isPublished: true });
    setActionError('');
    setShowForm(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({ ...post });
    setActionError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setDeleteConfirm(null);
    setActionError('');
  };

  const handleSubmit = async () => {
    if (!form.title || !form.excerpt || !form.content) {
      setActionError('Title, excerpt, and content are required');
      return;
    }
    setActionError('');
    const slug = form.slug || generateSlug(form.title!);
    try {
      if (editingId) {
        await updatePost({ id: editingId, ...form, slug }).unwrap();
      } else {
        await createPost({ ...form, slug }).unwrap();
      }
      handleCloseForm();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to save article');
    }
  };

  const handleDelete = async (id: number) => {
    setActionError('');
    try {
      await deletePost(id).unwrap();
      setDeleteConfirm(null);
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to delete article');
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setCategoryFilter('');
    setPublishedFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog / Journal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination?.total !== undefined ? `${pagination.total} articles total` : 'Manage your articles and journal content'}
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: FileText, color: 'text-foreground', bg: 'bg-card', key: '' },
          { label: 'Published', value: stats.published, icon: Eye, color: 'text-green-700', bg: 'bg-green-50', key: 'published' },
          { label: 'Drafts', value: stats.drafts, icon: EyeOff, color: 'text-muted-foreground', bg: 'bg-muted/40', key: 'draft' },
          { label: 'Featured', value: stats.featured, icon: Star, color: 'text-amber-700', bg: 'bg-amber-50', key: 'featured' },
        ].map(({ label, value, icon: Icon, color, bg, key }) => (
          <button
            key={key}
            onClick={() => {
              if (key === '' || key === 'published' || key === 'draft') {
                setPublishedFilter(key === '' ? '' : key);
                setPage(1);
              }
            }}
            className={cn(
              'rounded-xl border p-4 text-left transition-all hover:shadow-sm cursor-pointer',
              bg,
              publishedFilter === key && key !== 'featured' ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
              <Icon className={cn('h-4 w-4', color, key === 'featured' && 'fill-amber-400')} />
            </div>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
          </button>
        ))}
      </div>

      {/* Error banner */}
      {actionError && !showForm && (
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

      {/* Toolbar + List */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles by title, excerpt, or category…"
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
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={publishedFilter}
                onChange={(e) => { setPublishedFilter(e.target.value); setPage(1); }}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No articles found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters ? 'Try adjusting your filters.' : 'Create your first article to get started.'}
                </p>
              </div>
              {!hasActiveFilters ? (
                <Button size="sm" className="gap-2" onClick={handleOpenCreate}>
                  <Plus className="h-3.5 w-3.5" /> New Article
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            <div className={cn('divide-y divide-border transition-opacity', isFetching ? 'opacity-60' : 'opacity-100')}>
              {filteredPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-4 p-4 hover:bg-muted/20 transition-colors group">
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                    {post.image ? (
                      <img src={post.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{post.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{post.excerpt}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => handleOpenEdit(post)}>
                          <Edit2 className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteConfirm(post.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Tag className="h-2.5 w-2.5" />{post.category}
                      </Badge>
                      {!post.isPublished && <Badge variant="outline" className="text-xs">Draft</Badge>}
                      {post.isFeatured && <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">Featured</Badge>}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{post.readTime}
                      </span>
                      <Link
                        href={`/journal/${post.slug}`}
                        target="_blank"
                        className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
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

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={handleCloseForm}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed inset-4 md:inset-10 bg-card rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h2 className="text-lg font-semibold">{editingId ? 'Edit Article' : 'New Article'}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editingId ? `Editing ID: ${editingId}` : 'Fill in the details below'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleCloseForm} className="h-9">
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isCreating || isUpdating} className="h-9">
                    {isCreating || isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {editingId ? 'Save Changes' : 'Publish'}
                  </Button>
                </div>
              </div>

              {actionError && (
                <div className="mx-5 mt-3 flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {actionError}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-5">
                <div className="max-w-4xl mx-auto space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Title <span className="text-destructive">*</span></Label>
                      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Article title" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Slug</Label>
                      <Input
                        value={form.slug || generateSlug(form.title || '')}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="auto-generated-from-title"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                      >
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Read Time</Label>
                      <Input value={form.readTime} onChange={(e) => setForm({ ...form, readTime: e.target.value })} placeholder="5 min read" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Featured Image URL</Label>
                      <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" />
                    </div>
                  </div>

                  {form.image && (
                    <div className="rounded-lg overflow-hidden h-40 border border-border">
                      <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Excerpt <span className="text-destructive">*</span></Label>
                    <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short summary of the article…" rows={3} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Content <span className="text-destructive">*</span></Label>
                    <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Full article content…" rows={12} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      { key: 'isPublished' as const, label: 'Published', desc: 'Visible on site' },
                      { key: 'isFeatured' as const, label: 'Featured', desc: 'Shown on homepage' },
                    ] as const).map(({ key, label, desc }) => (
                      <div
                        key={key}
                        onClick={() => setForm({ ...form, [key]: !form[key] })}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                          form[key] ? 'border-primary/30 bg-primary/5' : 'border-muted bg-muted/20'
                        )}
                      >
                        <div className={cn('h-5 w-9 rounded-full relative', form[key] ? 'bg-primary' : 'bg-muted-foreground/30')}>
                          <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form[key] ? 'left-5' : 'left-0.5')} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setDeleteConfirm(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card rounded-xl shadow-2xl z-50 p-6"
            >
              <div className="flex items-center gap-3 text-destructive mb-3">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-semibold">Delete Article?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="h-9">Cancel</Button>
                <Button variant="destructive" onClick={() => handleDelete(deleteConfirm!)} disabled={isDeleting} className="h-9">
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
