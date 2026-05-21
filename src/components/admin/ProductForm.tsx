'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetCategoriesQuery } from '@/services/api/categoriesApi';
import { useGetTagsQuery } from '@/services/api/tagsApi';
import {
  ArrowLeft, Plus, Trash2, Loader2, Image as ImageIcon, X,
  GripVertical, AlertCircle, ChevronDown, ChevronUp,
  Tag, Package, Info,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────── */
export interface VariantRow {
  id?: number;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  material: string;
  priceOverride: string;
  stock: string;
  isActive: boolean;
}

export interface MediaRow {
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
  type: 'image' | 'video';
}

export interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  comparePrice: string;
  categoryId: string;
  material: string;
  gender: 'men' | 'women' | 'unisex';
  isActive: boolean;
  variants: VariantRow[];
  media: MediaRow[];
  tagIds: number[];
}

export const defaultVariant = (): VariantRow => ({
  sku: '',
  size: '',
  color: '',
  colorHex: '#000000',
  material: '',
  priceOverride: '',
  stock: '0',
  isActive: true,
});

export const defaultFormValues = (): ProductFormValues => ({
  name: '',
  description: '',
  price: '',
  comparePrice: '',
  categoryId: '',
  material: '',
  gender: 'unisex',
  isActive: true,
  variants: [defaultVariant()],
  media: [],
  tagIds: [],
});

/* ─── Sub-components ─────────────────────────────────── */

const SectionHeader = ({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: React.ElementType }) => (
  <div className="flex items-start gap-3 mb-5">
    {Icon && (
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    )}
    <div>
      <h3 className="font-semibold text-base">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3" /> {msg}
    </p>
  ) : null;

/* ─── Variant Row ────────────────────────────────────── */
const VariantEditor = ({
  variant,
  index,
  total,
  onChange,
  onRemove,
}: {
  variant: VariantRow;
  index: number;
  total: number;
  onChange: (v: VariantRow) => void;
  onRemove: () => void;
}) => {
  const [open, setOpen] = useState(index === 0);
  const u = (field: keyof VariantRow, value: VariantRow[keyof VariantRow]) => onChange({ ...variant, [field]: value } as VariantRow);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer select-none hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">
              {variant.size ? `Size: ${variant.size}` : `Variant ${index + 1}`}
            </span>
            {variant.color && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-border"
                  style={{ background: variant.colorHex || '#ccc' }}
                />
                {variant.color}
              </span>
            )}
            {variant.sku && <span className="text-xs text-muted-foreground font-mono">#{variant.sku}</span>}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${parseInt(variant.stock) === 0 ? 'bg-destructive/10 text-destructive' : parseInt(variant.stock) <= 5 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
              Stock: {variant.stock || 0}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {total > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {open && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">SKU *</Label>
            <Input
              value={variant.sku}
              onChange={(e) => u('sku', e.target.value)}
              placeholder="e.g. SHIRT-BLK-M"
              className="h-9 font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground">Must be globally unique across all products</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Size</Label>
            <Input value={variant.size} onChange={(e) => u('size', e.target.value)} placeholder="XS / S / M / L / XL" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Color Name</Label>
            <Input value={variant.color} onChange={(e) => u('color', e.target.value)} placeholder="e.g. Midnight Black" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Color Hex</Label>
            <div className="flex items-center gap-2 h-9 border border-input rounded-md px-3">
              <input
                type="color"
                value={variant.colorHex || '#000000'}
                onChange={(e) => u('colorHex', e.target.value)}
                className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0 rounded"
              />
              <span className="text-sm font-mono text-muted-foreground flex-1">{variant.colorHex || '#000000'}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Material</Label>
            <Input value={variant.material} onChange={(e) => u('material', e.target.value)} placeholder="e.g. 100% Cotton" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Price Override (₹)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={variant.priceOverride}
              onChange={(e) => u('priceOverride', e.target.value)}
              placeholder="Leave blank to use base price"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Stock *</Label>
            <Input
              type="number"
              min="0"
              value={variant.stock}
              onChange={(e) => u('stock', e.target.value)}
              placeholder="0"
              className="h-9"
            />
          </div>
          <div className="space-y-1 flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => u('isActive', !variant.isActive)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${variant.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${variant.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs font-medium">{variant.isActive ? 'Active' : 'Inactive'}</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────── */
interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>;
  isEditing?: boolean;
  isSubmitting: boolean;
  submitError?: string;
  onSubmit: (values: ProductFormValues) => void;
}

export default function ProductForm({
  initialValues,
  isEditing = false,
  isSubmitting,
  submitError,
  onSubmit,
}: ProductFormProps) {
  const router = useRouter();
  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const { data: tagsResponse } = useGetTagsQuery({});

  const categories: { id: number; name: string }[] = (categoriesResponse as { data?: { id: number; name: string }[] })?.data || [];
  const rawTags = (tagsResponse as { data?: { id: number; name: string; type: string }[] } | undefined);
  const tags: { id: number; name: string; type: string }[] = Array.isArray(tagsResponse)
    ? (tagsResponse as { id: number; name: string; type: string }[])
    : rawTags?.data || [];

  const [form, setForm] = useState<ProductFormValues>(() => ({
    ...defaultFormValues(),
    ...initialValues,
  }));
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const populated = React.useRef(false);
  useEffect(() => {
    if (!populated.current && initialValues?.name) {
      populated.current = true;
      setForm({ ...defaultFormValues(), ...initialValues });
    }
  }, [initialValues]);

  const setField = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.price || parseFloat(form.price) <= 0) errs.price = 'A valid price is required';
    if (!form.categoryId) errs.categoryId = 'Category is required';
    if (form.variants.length === 0) errs.variants = 'At least one variant is required';
    const skuValues = form.variants.map((v) => v.sku.trim().toLowerCase()).filter(Boolean);
    const skuDupes = skuValues.filter((s, i) => skuValues.indexOf(s) !== i);
    form.variants.forEach((v, i) => {
      if (!v.sku.trim()) errs[`variant_${i}_sku`] = 'SKU required';
      else if (skuDupes.includes(v.sku.trim().toLowerCase())) errs[`variant_${i}_sku`] = `Duplicate SKU "${v.sku}" — each variant needs a unique SKU`;
      if (v.stock === '' || isNaN(parseInt(v.stock))) errs[`variant_${i}_stock`] = 'Stock required';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      const firstError = document.querySelector('[data-error]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onSubmit(form);
  };

  /* Variants */
  const addVariant = () => setField('variants', [...form.variants, defaultVariant()]);
  const updateVariant = (i: number, v: VariantRow) => {
    const updated = [...form.variants];
    updated[i] = v;
    setField('variants', updated);
  };
  const removeVariant = (i: number) => setField('variants', form.variants.filter((_, idx) => idx !== i));

  /* Media upload */
  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploadError('');
    setUploadingCount((c) => c + arr.length);
    const results = await Promise.allSettled(
      arr.map(async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555';
        const res = await fetch(`${base}/api/v1/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        const json = await res.json();
        if (!res.ok || !json?.data?.url) throw new Error(json?.message || 'Upload failed');
        return json.data.url as string;
      })
    );
    setUploadingCount((c) => c - arr.length);
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length) setUploadError(`${failed.length} file(s) failed to upload`);
    setField('media', [
      ...form.media,
      ...results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map((r, i): MediaRow => ({
          url: r.value,
          alt: form.name || 'Product image',
          isPrimary: form.media.length === 0 && i === 0,
          sortOrder: form.media.length + i,
          type: 'image',
        })),
    ]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };
  const removeMedia = (i: number) => {
    const updated = form.media.filter((_, idx) => idx !== i);
    if (updated.length > 0 && !updated.some((m) => m.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setField('media', updated);
  };
  const setPrimary = (i: number) => {
    setField('media', form.media.map((m, idx) => ({ ...m, isPrimary: idx === i })));
  };

  /* Tags */
  const toggleTag = (id: number) => {
    setField('tagIds', form.tagIds.includes(id) ? form.tagIds.filter((t) => t !== id) : [...form.tagIds, id]);
  };

  const tagsByType = tags.reduce((acc: Record<string, typeof tags>, tag: (typeof tags)[0]) => {
    const key = (tag as { type?: string }).type || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(tag);
    return acc;
  }, {} as Record<string, typeof tags>);

  const hasError = Object.keys(errors).length > 0;

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/products')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? 'Edit Product' : 'New Product'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing ? 'Update product details, variants, and media.' : 'Fill in the details to create a new product.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          {/* Global error */}
          {(submitError || hasError) && (
            <div className="flex items-start gap-3 p-4 bg-destructive/8 border border-destructive/20 rounded-xl text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                {submitError && <p className="font-medium">{submitError}</p>}
                {hasError && !submitError && <p className="font-medium">Please fix the highlighted fields before saving.</p>}
              </div>
            </div>
          )}

          {/* ── Section 1: Core Info ── */}
          <Card>
            <CardContent className="pt-6">
              <SectionHeader title="Basic Information" subtitle="Name, description, category and visibility." icon={Info} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1" data-error={errors.name ? true : undefined}>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="e.g. Classic Linen Shirt"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  <FieldError msg={errors.name} />
                </div>

                <div data-error={errors.categoryId ? true : undefined} className="space-y-1">
                  <Label>Category *</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setField('categoryId', v)}>
                    <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError msg={errors.categoryId} />
                </div>

                <div className="space-y-1">
                  <Label>Gender Target</Label>
                  <Select value={form.gender} onValueChange={(v) => setField('gender', v as ProductFormValues['gender'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 space-y-1" data-error={errors.description ? true : undefined}>
                  <Label>Description *</Label>
                  <Textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setField('description', e.target.value)}
                    placeholder="Describe the product — materials, fit, care instructions…"
                    className={`resize-none ${errors.description ? 'border-destructive' : ''}`}
                  />
                  <FieldError msg={errors.description} />
                </div>

                <div className="space-y-1">
                  <Label>Material</Label>
                  <Input
                    value={form.material}
                    onChange={(e) => setField('material', e.target.value)}
                    placeholder="e.g. 100% Organic Cotton"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <Label className="mb-1">Visibility</Label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setField('isActive', !form.isActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${form.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{form.isActive ? 'Active' : 'Inactive'}</p>
                      <p className="text-xs text-muted-foreground">{form.isActive ? 'Visible in store' : 'Hidden from store'}</p>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Section 2: Pricing ── */}
          <Card>
            <CardContent className="pt-6">
              <SectionHeader title="Pricing" subtitle="Set base price and compare-at price for sale display." icon={Tag} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1" data-error={errors.price ? true : undefined}>
                  <Label>Base Price (₹) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => setField('price', e.target.value)}
                      placeholder="0.00"
                      className={`pl-7 ${errors.price ? 'border-destructive' : ''}`}
                    />
                  </div>
                  <FieldError msg={errors.price} />
                </div>

                <div className="space-y-1">
                  <Label>
                    Compare-at Price (₹)
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">optional — shown as strikethrough</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.comparePrice}
                      onChange={(e) => setField('comparePrice', e.target.value)}
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                  {form.comparePrice && form.price && parseFloat(form.comparePrice) > parseFloat(form.price) && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      {Math.round(((parseFloat(form.comparePrice) - parseFloat(form.price)) / parseFloat(form.comparePrice)) * 100)}% discount will be shown
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Section 3: Variants ── */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-5">
                <SectionHeader
                  title="Variants"
                  subtitle="Each variant is a unique SKU (size/color combination) with its own stock."
                  icon={Package}
                />
                <Button type="button" variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={addVariant}>
                  <Plus className="h-3.5 w-3.5" /> Add Variant
                </Button>
              </div>

              {errors.variants && (
                <div className="mb-4 p-3 bg-destructive/8 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.variants}
                </div>
              )}

              <div className="space-y-3">
                {form.variants.map((variant, i) => (
                  <div key={i}>
                    <VariantEditor
                      variant={variant}
                      index={i}
                      total={form.variants.length}
                      onChange={(v) => updateVariant(i, v)}
                      onRemove={() => removeVariant(i)}
                    />
                    {(errors[`variant_${i}_sku`] || errors[`variant_${i}_stock`]) && (
                      <div className="mt-1 px-4">
                        {errors[`variant_${i}_sku`] && <FieldError msg={errors[`variant_${i}_sku`]} />}
                        {errors[`variant_${i}_stock`] && <FieldError msg={errors[`variant_${i}_stock`]} />}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="mt-3 w-full border-2 border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add another variant
              </button>
            </CardContent>
          </Card>

          {/* ── Section 4: Media ── */}
          <Card>
            <CardContent className="pt-6">
              <SectionHeader title="Product Media" subtitle="Upload images. The first image is the primary display image. Click any image to set it as primary." icon={ImageIcon} />

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="mb-4 border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />
                {uploadingCount > 0 ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading {uploadingCount} file{uploadingCount > 1 ? 's' : ''}…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                    <ImageIcon className="h-8 w-8" />
                    <p className="text-sm font-medium">Drop images here or click to browse</p>
                    <p className="text-xs opacity-70">PNG, JPG, WEBP up to 10 MB each · Multiple files supported</p>
                  </div>
                )}
              </div>

              {uploadError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive mb-3">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {uploadError}
                </p>
              )}

              {form.media.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {form.media.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => setPrimary(i)}
                      className={`relative group aspect-square bg-muted rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${item.isPrimary ? 'border-primary shadow-md' : 'border-transparent hover:border-border'}`}
                    >
                      {item.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-xs text-muted-foreground">Video</span>
                        </div>
                      ) : (
                        <img src={item.url} alt={item.alt} className="object-cover w-full h-full" />
                      )}
                      {item.isPrimary && (
                        <span className="absolute bottom-1 left-1 text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md">
                          Main
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeMedia(i); }}
                        className="absolute top-1 right-1 h-5 w-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Section 5: Tags ── */}
          {tags.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <SectionHeader title="Tags" subtitle="Tag products for collections, sustainability features, and discovery." icon={Tag} />
                <div className="space-y-4">
                  {(Object.entries(tagsByType) as [string, { id: number; name: string; type: string }[]][]).map(([type, typeTags]) => (
                    <div key={type}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{type}</p>
                      <div className="flex flex-wrap gap-2">
                        {typeTags.map((tag) => {
                          const selected = form.tagIds.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                                selected
                                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                  : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5'
                              }`}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Footer Actions ── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/products')}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="sm:flex-1 gap-2">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{isEditing ? 'Saving…' : 'Creating…'}</>
              ) : (
                isEditing ? 'Save Changes' : 'Create Product'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
