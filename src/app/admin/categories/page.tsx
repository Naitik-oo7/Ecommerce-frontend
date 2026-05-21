'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from '@/services/api/categoriesApi';
import { useUploadImageMutation } from '@/services/api/uploadApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Search, Edit, Trash2, Loader2, FolderTree, LayoutGrid,
  List, ChevronLeft, ChevronRight, AlertTriangle, Star, Eye, EyeOff,
  CheckCircle2, XCircle, Filter, X, ImageIcon, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  parentId?: number;
  parent?: { id: number; name: string };
  isActive: boolean;
  isFeatured: boolean;
}

type CategoryForm = {
  name: string;
  slug: string;
  imageUrl: string;
  parentId: string;
  isActive: boolean;
  isFeatured: boolean;
  description: string;
  metaTitle: string;
  metaDescription: string;
};

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  imageUrl: '',
  parentId: '',
  isActive: true,
  isFeatured: false,
  description: '',
  metaTitle: '',
  metaDescription: ''
};

// Generate slug from name
const generateSlug = (name: string) => {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};


const StatusToggle = ({ category, onToggle, isToggling }: { category: Category; onToggle: () => void; isToggling: boolean }) => (
  <button
    onClick={onToggle}
    disabled={isToggling}
    title={category.isActive ? 'Click to deactivate' : 'Click to activate'}
    className={cn(
      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      category.isActive ? 'bg-green-500' : 'bg-muted-foreground/30',
      isToggling && 'opacity-50 cursor-not-allowed'
    )}
  >
    <span
      className={cn(
        "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
        category.isActive ? 'translate-x-4' : 'translate-x-0.5'
      )}
    />
  </button>
);

export default function AdminCategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [toggleError, setToggleError] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  const { data: categoriesResponse, isLoading, isFetching } = useGetCategoriesQuery({
    search: search || undefined,
    includeInactive: (statusFilter === 'inactive' || statusFilter === 'all') ? 'true' : undefined,
    isFeatured: statusFilter === 'featured' ? 'true' : undefined,
    page,
    limit: view === 'grid' ? 12 : 15,
  });

  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const categories: Category[] = (categoriesResponse as any)?.data || categoriesResponse || [];
  const pagination = (categoriesResponse as any)?.pagination;
  const parentCategories = categories.filter((c) => !c.parentId);

  const filteredCategories = categories.filter((c) => {
    if (statusFilter === 'active') return c.isActive;
    if (statusFilter === 'inactive') return !c.isActive;
    if (statusFilter === 'featured') return c.isFeatured && c.isActive;
    return true;
  });

  const stats = {
    total: pagination?.total ?? categories.length,
    active: categories.filter((c) => c.isActive).length,
    inactive: categories.filter((c) => !c.isActive).length,
    featured: categories.filter((c) => c.isFeatured && c.isActive).length,
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setImagePreviewError(false);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      imageUrl: cat.imageUrl || '',
      parentId: cat.parentId ? String(cat.parentId) : '',
      isActive: cat.isActive !== false,
      isFeatured: cat.isFeatured === true,
      description: (cat as any).description || '',
      metaTitle: (cat as any).metaTitle || '',
      metaDescription: (cat as any).metaDescription || '',
    });
    setFormError('');
    setImagePreviewError(false);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.name.trim()) {
      setFormError('Category name is required');
      return;
    }
    if (form.imageUrl && !isValidUrl(form.imageUrl)) {
      setFormError('Please enter a valid image URL');
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || generateSlug(form.name),
      imageUrl: form.imageUrl || undefined,
      parentId: form.parentId ? parseInt(form.parentId) : undefined,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      description: form.description.trim() || undefined,
      metaTitle: form.metaTitle.trim() || undefined,
      metaDescription: form.metaDescription.trim() || undefined,
    };

    try {
      if (editingId) {
        await updateCategory({ id: editingId, ...payload }).unwrap();
      } else {
        await createCategory(payload).unwrap();
      }
      setShowForm(false);
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = useCallback(async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? Products will lose their category assignment.`)) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteCategory(id).unwrap();
    } catch {}
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, [deleteCategory]);

  const handleToggleActive = useCallback(async (category: Category) => {
    setToggleError('');
    setTogglingIds((prev) => new Set(prev).add(category.id));
    try {
      await updateCategory({ id: category.id, isActive: !category.isActive }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setToggleError(e?.data?.message || `Failed to update "${category.name}"`);
    } finally {
      setTogglingIds((prev) => { const n = new Set(prev); n.delete(category.id); return n; });
    }
  }, [updateCategory]);

  const handleToggleFeatured = useCallback(async (category: Category) => {
    setToggleError('');
    setTogglingIds((prev) => new Set(prev).add(category.id));
    try {
      await updateCategory({ id: category.id, isFeatured: !category.isFeatured }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setToggleError(e?.data?.message || `Failed to update "${category.name}"`);
    } finally {
      setTogglingIds((prev) => { const n = new Set(prev); n.delete(category.id); return n; });
    }
  }, [updateCategory]);

  const clearFilters = () => {
    setSearch('');
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
  };

  const hasActiveFilters = !!(search || statusFilter !== 'all' || sortBy !== 'name');
  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size must be less than 10MB');
      return;
    }

    try {
      const result = await uploadImage(file).unwrap();
      setForm({ ...form, imageUrl: result.url });
      setImagePreviewError(false);
      setFormError('');
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to upload image. Please try again.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats.total} categories · {stats.featured} featured on homepage
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground', bg: 'bg-card', icon: FolderTree, active: statusFilter === 'all', key: 'all' as const },
          { label: 'Active', value: stats.active, color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle2, active: statusFilter === 'active', key: 'active' as const },
          { label: 'Featured', value: stats.featured, color: 'text-amber-700', bg: 'bg-amber-50', icon: Star, active: statusFilter === 'featured', key: 'featured' as const },
          { label: 'Inactive', value: stats.inactive, color: 'text-destructive', bg: 'bg-destructive/5', icon: XCircle, active: statusFilter === 'inactive', key: 'inactive' as const },
        ].map(({ label, value, color, bg, icon: Icon, active, key }) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(key); setPage(1); }}
            className={cn(
              "rounded-xl border p-4 text-left transition-all hover:shadow-sm",
              bg,
              active ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
          </button>
        ))}
      </div>

      {/* Toggle error banner */}
      {toggleError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {toggleError}
          </div>
          <button onClick={() => setToggleError('')} className="text-destructive/60 hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" />}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}

            <div className="ml-auto flex items-center gap-1 border rounded-lg p-0.5">
              <button
                onClick={() => setView('table')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t space-y-3">
              <div className="flex flex-wrap gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="border rounded-md px-3 py-1.5 text-sm bg-background h-9 min-w-[150px]"
                >
                  <option value="name">Sort: Name</option>
                  <option value="isFeatured">Sort: Featured First</option>
                  <option value="isActive">Sort: Active First</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
                  className="border rounded-md px-3 py-1.5 text-sm bg-background h-9 min-w-[110px]"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <FolderTree className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No categories found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters ? 'Try adjusting your filters.' : 'Get started by adding your first category.'}
                </p>
              </div>
              {!hasActiveFilters && (
                <Button onClick={openCreate} size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" />Add Category</Button>
              )}
            </div>
          ) : view === 'table' ? (
            <div className={cn("overflow-x-auto transition-opacity", isFetching ? 'opacity-60' : 'opacity-100')}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Slug</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Parent</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Featured</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                            {category.imageUrl ? (
                              <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">{category.name}</p>
                            {category.isFeatured && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium mt-1">
                                <Star className="h-3 w-3 fill-current" /> Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground font-mono">/{category.slug}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {category.parent?.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleFeatured(category)}
                          disabled={togglingIds.has(category.id) || !category.isActive}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                            category.isFeatured
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-muted text-muted-foreground hover:bg-muted-foreground/20",
                            (togglingIds.has(category.id) || !category.isActive) && "opacity-50 cursor-not-allowed"
                          )}
                          title={!category.isActive ? "Activate category first" : category.isFeatured ? "Remove from featured" : "Add to featured"}
                        >
                          {togglingIds.has(category.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Star className={cn("h-3 w-3", category.isFeatured && "fill-current")} />
                          )}
                          {category.isFeatured ? 'Featured' : 'Not Featured'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {togglingIds.has(category.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <StatusToggle
                              category={category}
                              onToggle={() => handleToggleActive(category)}
                              isToggling={togglingIds.has(category.id)}
                            />
                          )}
                          <span className={cn("text-xs font-medium", category.isActive ? 'text-green-700' : 'text-muted-foreground')}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => openEdit(category)}>
                            <Edit className="h-3 w-3" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(category.id, category.name)}
                            disabled={deletingIds.has(category.id)}
                          >
                            {deletingIds.has(category.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={cn("p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 transition-opacity", isFetching ? 'opacity-60' : 'opacity-100')}>
              {filteredCategories.map((category) => (
                <div key={category.id} className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
                  <div className="relative aspect-[4/3] bg-muted">
                    {category.imageUrl ? (
                      <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {!category.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/70 text-white font-medium">Inactive</span>
                      )}
                      {category.isFeatured && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-medium">Featured</span>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs" onClick={() => openEdit(category)}>
                        <Edit className="h-3 w-3" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={deletingIds.has(category.id)}
                      >
                        {deletingIds.has(category.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{category.name}</p>
                    <p className="text-xs text-muted-foreground truncate mb-2">{category.parent?.name || 'Top-level category'}</p>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleFeatured(category)}
                        disabled={togglingIds.has(category.id) || !category.isActive}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors",
                          category.isFeatured
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-muted text-muted-foreground hover:bg-muted-foreground/20",
                          (togglingIds.has(category.id) || !category.isActive) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Star className={cn("h-3 w-3", category.isFeatured && "fill-current")} />
                        {category.isFeatured ? 'Featured' : 'Feature'}
                      </button>
                      {togglingIds.has(category.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <StatusToggle
                          category={category}
                          onToggle={() => handleToggleActive(category)}
                          isToggling={togglingIds.has(category.id)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{pagination.totalPages}</span>
                <span className="ml-2 text-xs">({pagination.total} total)</span>
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                  return pageNum <= pagination.totalPages ? (
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
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b bg-card">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center",
                  editingId ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-600"
                )}>
                  {editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingId ? 'Edit Category' : 'Create Category'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {editingId ? `ID: ${editingId} • Slug: /${form.slug || generateSlug(form.name)}` : 'Manage category settings, visibility and SEO'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mx-5 mt-3 flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">
                {/* Top Section: Image + Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-5">
                  {/* Compact Image */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Image</Label>
                    <div className="relative w-[160px] h-[160px] rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border">
                      {form.imageUrl && !imagePreviewError ? (
                        <img
                          src={form.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => setImagePreviewError(true)}
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground p-4">
                          <ImageIcon className="h-8 w-8 opacity-40" />
                          <p className="text-[10px] text-center">160 × 160</p>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1 h-8 text-xs"
                      >
                        {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      </Button>
                      {form.imageUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setForm({ ...form, imageUrl: '' }); setImagePreviewError(false); }}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">1200×1200 JPG/PNG</p>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    {/* Name & Slug Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Category Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setForm({ 
                              ...form, 
                              name,
                              slug: form.slug || generateSlug(name)
                            });
                          }}
                          placeholder="e.g., Accessories"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="slug" className="text-sm font-medium">Slug</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/</span>
                          <Input
                            id="slug"
                            value={form.slug}
                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                            placeholder="accessories"
                            className="h-9 pl-6"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Parent Category */}
                    <div className="space-y-1.5">
                      <Label htmlFor="parent" className="text-sm font-medium">Parent Category</Label>
                      <div className="relative">
                        <select
                          id="parent"
                          value={form.parentId}
                          onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                          className="w-full h-9 px-3 pr-10 rounded-md border border-input bg-background text-sm appearance-none"
                        >
                          <option value="">None (Top-level)</option>
                          {parentCategories
                            .filter((c) => c.id !== editingId)
                            .map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-muted-foreground pointer-events-none" />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {form.parentId 
                          ? `Subcategory of ${parentCategories.find(c => c.id === parseInt(form.parentId))?.name}`
                          : 'Top-level category for main navigation'
                        }
                      </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                      <textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Brief description for SEO and collection pages..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                      />
                      <p className="text-[11px] text-muted-foreground">Used for SEO and collection page introductions</p>
                    </div>
                  </div>
                </div>

                {/* Visibility Section - Compact Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visibility</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Active Toggle */}
                    <div
                      onClick={() => setForm({ ...form, isActive: !form.isActive })}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        form.isActive ? "border-green-200 bg-green-50/20" : "border-muted bg-muted/20"
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        form.isActive ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                      )}>
                        {form.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{form.isActive ? 'Active' : 'Inactive'}</span>
                          {form.isActive && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {form.isActive ? 'Visible on storefront' : 'Hidden from customers'}
                        </p>
                      </div>
                      <div className={cn(
                        "h-5 w-9 rounded-full relative shrink-0",
                        form.isActive ? "bg-green-500" : "bg-muted-foreground/30"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                          form.isActive ? "left-5" : "left-0.5"
                        )} />
                      </div>
                    </div>

                    {/* Featured Toggle */}
                    <div
                      onClick={() => form.isActive && setForm({ ...form, isFeatured: !form.isFeatured })}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        form.isFeatured && form.isActive ? "border-amber-200 bg-amber-50/20 cursor-pointer" : 
                        form.isActive ? "border-muted bg-muted/20 cursor-pointer hover:border-amber-200/50" : 
                        "border-muted bg-muted/10 opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        form.isFeatured && form.isActive ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"
                      )}>
                        <Star className={cn("h-4 w-4", form.isFeatured && form.isActive && "fill-current")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {form.isFeatured && form.isActive ? 'Featured' : 'Not Featured'}
                          </span>
                          {form.isFeatured && form.isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">HOME</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {form.isActive 
                            ? form.isFeatured ? 'Shown on homepage' : 'Not on homepage' 
                            : 'Activate first'}
                        </p>
                      </div>
                      {form.isActive && (
                        <div className={cn(
                          "h-5 w-9 rounded-full relative shrink-0",
                          form.isFeatured ? "bg-amber-500" : "bg-muted-foreground/30"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                            form.isFeatured ? "left-5" : "left-0.5"
                          )} />
                        </div>
                      )}
                    </div>
                  </div>

                  {form.isFeatured && form.isActive && !form.imageUrl && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Add an image for featured display on homepage
                    </p>
                  )}
                </div>

                {/* SEO Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEO Settings</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="metaTitle" className="text-sm font-medium">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={form.metaTitle}
                        onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                        placeholder={form.name || 'Category Name'}
                        className="h-9"
                      />
                      <p className="text-[11px] text-muted-foreground">{(form.metaTitle || '').length}/60 characters</p>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="metaDescription" className="text-sm font-medium">Meta Description</Label>
                      <textarea
                        id="metaDescription"
                        value={form.metaDescription}
                        onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                        placeholder="Brief description for search engines..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                      />
                      <p className="text-[11px] text-muted-foreground">{(form.metaDescription || '').length}/160 characters</p>
                    </div>
                  </div>

                  {/* Google Preview */}
                  <div className="p-3 bg-muted/30 rounded-lg border border-muted">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Google Preview</p>
                    <div className="space-y-0.5">
                      <p className="text-sm text-blue-600 truncate">
                        {form.metaTitle || form.name || 'Category Name'} | Your Store
                      </p>
                      <p className="text-xs text-green-700">
                        www.store.com/category/{form.slug || generateSlug(form.name)}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {form.metaDescription || form.description || 'Shop our collection of products...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions - Professional Separation */}
            <div className="flex items-center justify-between gap-3 p-5 border-t bg-muted/20">
              {editingId ? (
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(editingId, form.name || 'this category')}
                  disabled={deletingIds.has(editingId)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-4"
                >
                  {deletingIds.has(editingId) ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Category
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} className="h-9 px-6">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={creating || updating || !form.name.trim()}
                  className="h-9 px-6"
                >
                  {creating || updating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      {editingId ? 'Save Changes' : 'Create Category'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
