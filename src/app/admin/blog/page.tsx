'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useGetBlogPostsQuery,
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  useDeleteBlogPostMutation,
  useUploadBlogImageMutation,
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
  Filter, ChevronLeft, ChevronRight, Tag, Command,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { ImageUploader } from '@/components/admin/ImageUploader';
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
  const [uploadError, setUploadError] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const EMPTY_FORM: Partial<BlogPost> = {
    title: '', slug: '', excerpt: '', content: '',
    category: 'Fashion', image: '', readTime: '5 min read',
    isFeatured: false, isPublished: true,
  };

  const [form, setForm] = useState<Partial<BlogPost>>(EMPTY_FORM);
  // Snapshot of the form when the modal opened — used to detect unsaved changes.
  const [initialForm, setInitialForm] = useState<Partial<BlogPost>>(EMPTY_FORM);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm]
  );

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
  const [uploadImage, { isLoading: isUploading }] = useUploadBlogImageMutation();

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
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setActionError('');
    setUploadError('');
    setConfirmDiscard(false);
    setShowForm(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingId(post.id);
    // Normalize so the snapshot matches what the form holds (slug shown explicitly).
    const snapshot: Partial<BlogPost> = {
      title: post.title, slug: post.slug, excerpt: post.excerpt,
      content: post.content ?? '', category: post.category, image: post.image,
      readTime: post.readTime, isFeatured: post.isFeatured, isPublished: post.isPublished,
    };
    setForm(snapshot);
    setInitialForm(snapshot);
    setActionError('');
    setUploadError('');
    setConfirmDiscard(false);
    setShowForm(true);
  };

  const closeFormNow = () => {
    setShowForm(false);
    setEditingId(null);
    setDeleteConfirm(null);
    setActionError('');
    setUploadError('');
    setConfirmDiscard(false);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
  };

  // Guard against discarding unsaved edits.
  const handleCloseForm = () => {
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    closeFormNow();
  };

  const handleSubmit = async () => {
    if (isCreating || isUpdating || isUploading) return;
    if (!form.title || !form.excerpt || !form.content || !form.image) {
      setActionError('Title, excerpt, content, and image are required');
      return;
    }
    if (editingId && !isDirty) {
      closeFormNow();
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
      closeFormNow();
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

  const handleImageUpload = async (file: File) => {
    const response = await uploadImage(file).unwrap();
    return response.url;
  };

  // Keyboard shortcuts inside the editor: Esc closes (guarded), Ctrl/⌘+S saves.
  const onFormKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!showForm || confirmDiscard) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseForm();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSubmit();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showForm, confirmDiscard, isDirty, form, editingId, isCreating, isUpdating, isUploading]
  );

  useEffect(() => {
    if (!showForm) return;
    window.addEventListener('keydown', onFormKeyDown);
    return () => window.removeEventListener('keydown', onFormKeyDown);
  }, [showForm, onFormKeyDown]);

  // Lock background scroll while any modal is open so the wheel scrolls the modal, not the page.
  useEffect(() => {
    const open = showForm || deleteConfirm !== null;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [showForm, deleteConfirm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog & Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination?.total !== undefined ? `${pagination.total} articles • ${stats.published} published` : 'Manage your articles and journal content'}
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: FileText, color: 'text-blue-700', bg: 'bg-blue-50', key: '' },
          { label: 'Published', value: stats.published, icon: Eye, color: 'text-green-700', bg: 'bg-green-50', key: 'published' },
          { label: 'Drafts', value: stats.drafts, icon: EyeOff, color: 'text-orange-700', bg: 'bg-orange-50', key: 'draft' },
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
              'rounded-lg border p-3.5 text-left transition-all hover:shadow-md cursor-pointer group',
              bg,
              publishedFilter === key && key !== 'featured' ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
              <Icon className={cn('h-4 w-4 transition-transform group-hover:scale-110', color)} />
            </div>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {actionError && !showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {actionError}
          </div>
          <button onClick={() => setActionError('')} className="text-destructive/60 hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}

      {/* Articles List */}
      <Card className="shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, excerpt, or category…"
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
              {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t flex flex-wrap gap-3"
            >
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
            </motion.div>
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
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-4 p-4 hover:bg-muted/20 transition-colors group"
                >
                  <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border shadow-sm">
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
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate text-base">{post.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{post.excerpt}</p>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => handleOpenEdit(post)}>
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteConfirm(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 mt-2.5">
                      <Badge variant="secondary" className="text-xs gap-1 font-medium">
                        <Tag className="h-2.5 w-2.5" />{post.category}
                      </Badge>
                      {!post.isPublished && <Badge variant="outline" className="text-xs font-medium">Draft</Badge>}
                      {post.isFeatured && <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100 font-medium">Featured</Badge>}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />{post.readTime}
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
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && (pagination.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span> of{' '}
                <span className="font-semibold text-foreground">{pagination.totalPages}</span>
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
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto overscroll-contain flex items-start sm:items-center justify-center p-4"
            onClick={handleCloseForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl my-auto"
            >
              <Card className="max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b bg-card">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                      editingId ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-600'
                    )}>
                      {editingId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold truncate">{editingId ? 'Edit Article' : 'Create New Article'}</h2>
                        {isDirty && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {editingId ? `/journal/${form.slug || generateSlug(form.title || '')}` : 'Add a new blog post'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {editingId && form.slug && (
                      <Link
                        href={`/journal/${form.slug}`}
                        target="_blank"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Preview
                      </Link>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleCloseForm} className="rounded-full h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Error Banner */}
                {actionError && (
                  <div className="mx-5 mt-3 flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {actionError}
                  </div>
                )}

                {/* Form Content */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                  <div className="p-5 space-y-5">
                    {/* Basic Info Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Information</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="title" className="text-sm font-medium">
                            Title <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="title"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Enter article title"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="slug" className="text-sm font-medium">Slug</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/</span>
                            <Input
                              id="slug"
                              value={form.slug || generateSlug(form.title || '')}
                              onChange={(e) => setForm({ ...form, slug: e.target.value })}
                              placeholder="auto-generated-from-title"
                              className="h-9 pl-6"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content</h3>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="excerpt" className="text-sm font-medium">
                          Excerpt <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="excerpt"
                          value={form.excerpt}
                          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                          placeholder="Short summary of the article (appears in listing)…"
                          rows={2}
                          className="resize-none"
                        />
                        <p className={cn(
                          'text-[11px]',
                          (form.excerpt?.length || 0) > 250 ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                        )}>
                          {form.excerpt?.length || 0} / 250 characters{(form.excerpt?.length || 0) > 250 ? ' — a bit long for listings' : ' recommended'}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="content" className="text-sm font-medium">
                          Content <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="content"
                          value={form.content}
                          onChange={(e) => setForm({ ...form, content: e.target.value })}
                          placeholder="Full article content…"
                          rows={8}
                          className="resize-none font-mono text-sm"
                        />
                      </div>
                    </div>

                    {/* Image Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Featured Image</h3>
                      </div>
                      <ImageUploader
                        value={form.image || ''}
                        onChange={(url) => setForm({ ...form, image: url })}
                        onUpload={handleImageUpload}
                        isLoading={isUploading}
                        error={uploadError}
                        onError={setUploadError}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Displayed in article listings and as the featured image on the full article page.
                      </p>
                    </div>

                    {/* Settings Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                          <div className="relative">
                            <select
                              id="category"
                              value={form.category}
                              onChange={(e) => setForm({ ...form, category: e.target.value })}
                              className="w-full h-9 px-3 pr-10 rounded-md border border-input bg-background text-sm appearance-none"
                            >
                              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="readTime" className="text-sm font-medium">Read Time</Label>
                          <Input
                            id="readTime"
                            value={form.readTime}
                            onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                            placeholder="5 min read"
                            className="h-9"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {([
                          { key: 'isPublished' as const, label: 'Published', desc: 'Visible on site', icon: Eye },
                          { key: 'isFeatured' as const, label: 'Featured', desc: 'Shown on homepage', icon: Star },
                        ] as const).map(({ key, label, desc, icon: Icon }) => (
                          <div
                            key={key}
                            onClick={() => setForm({ ...form, [key]: !form[key] })}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                              form[key] ? 'border-primary/40 bg-primary/5' : 'border-muted bg-muted/20'
                            )}
                          >
                            <div className={cn(
                              'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                              form[key] ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            )}>
                              <Icon className={cn('h-4 w-4', key === 'isFeatured' && form[key] && 'fill-current')} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{label}</p>
                              <p className="text-[11px] text-muted-foreground">{desc}</p>
                            </div>
                            <div className={cn(
                              'h-5 w-9 rounded-full relative shrink-0',
                              form[key] ? 'bg-primary' : 'bg-muted-foreground/30'
                            )}>
                              <div className={cn(
                                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                                form[key] ? 'left-5' : 'left-0.5'
                              )} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-3 p-5 border-t bg-muted/20">
                  {editingId ? (
                    <Button
                      variant="ghost"
                      onClick={() => setDeleteConfirm(editingId)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-4"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  ) : (
                    <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <kbd className="inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                        <Command className="h-2.5 w-2.5" />S
                      </kbd>
                      to save
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    {isUploading && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading image…
                      </span>
                    )}
                    <Button variant="outline" onClick={handleCloseForm} className="h-9 px-6">Cancel</Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isCreating || isUpdating || isUploading || (!!editingId && !isDirty)}
                      className="h-9 px-6"
                    >
                      {isCreating || isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {editingId ? (isDirty ? 'Save Changes' : 'Saved') : 'Publish Article'}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={() => setDeleteConfirm(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-xl shadow-2xl z-[60] p-6 border"
            >
              <div className="flex items-center gap-3 text-destructive mb-3">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-semibold">Delete Article?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">This action cannot be undone. The article will be permanently deleted.</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="h-9">Cancel</Button>
                <Button variant="destructive" onClick={() => handleDelete(deleteConfirm!)} disabled={isDeleting} className="h-9 gap-2">
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete Article
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Discard Unsaved Changes Modal */}
      <AnimatePresence>
        {confirmDiscard && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={() => setConfirmDiscard(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-xl shadow-2xl z-[60] p-6 border"
            >
              <div className="flex items-center gap-3 text-amber-600 mb-3">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-semibold">Discard changes?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">You have unsaved changes. If you leave now, they&apos;ll be lost.</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConfirmDiscard(false)} className="h-9">Keep Editing</Button>
                <Button variant="destructive" onClick={closeFormNow} className="h-9">Discard</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
