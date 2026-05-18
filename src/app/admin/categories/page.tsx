'use client';

import { useState } from 'react';
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from '@/services/api/categoriesApi';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Loader2, X, Check, Tag, FolderTree } from 'lucide-react';

type CategoryForm = { name: string; imageUrl: string; parentId: string; isActive: boolean };
const emptyForm: CategoryForm = { name: '', imageUrl: '', parentId: '', isActive: true };

export default function AdminCategoriesPage() {
  const { data: categoriesResponse, isLoading } = useGetCategoriesQuery({ includeInactive: true });
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [error, setError] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const categories = (categoriesResponse as any)?.data || [];
  const parentCategories = categories.filter((c: any) => !c.parentId);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name || '',
      imageUrl: cat.imageUrl || '',
      parentId: cat.parentId ? String(cat.parentId) : '',
      isActive: cat.isActive !== false,
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Category name is required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      imageUrl: form.imageUrl || undefined,
      parentId: form.parentId ? parseInt(form.parentId) : undefined,
      isActive: form.isActive,
    };
    try {
      if (editingId) {
        await updateCategory({ id: editingId, ...payload }).unwrap();
      } else {
        await createCategory(payload).unwrap();
      }
      setShowForm(false);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category? Products in this category will lose their category.')) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteCategory(id).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to delete category');
    }
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">{categories.length} categories</p>
        </div>
        <Button onClick={openCreate} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />Add Category
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">{editingId ? 'Edit Category' : 'New Category'}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" />
              </div>
              <div className="space-y-1">
                <Label>Parent Category</Label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">None (Top-level)</option>
                  {parentCategories
                    .filter((c: any) => c.id !== editingId)
                    .map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
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
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No categories yet. Create your first one!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Parent</th>
                    <th className="text-left p-3">Slug</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat: any) => (
                    <tr key={cat.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} alt={cat.name} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium text-sm">{cat.parentId ? <span className="ml-3">↳ </span> : ''}{cat.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{cat.parent?.name || '—'}</td>
                      <td className="p-3 text-sm font-mono text-muted-foreground">{cat.slug}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(cat.id)}
                            disabled={deletingIds.has(cat.id)}
                          >
                            {deletingIds.has(cat.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
