'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useGetProductBySlugQuery, useUpdateProductMutation } from '@/services/api/productsApi';
import ProductForm, { ProductFormValues, VariantRow, MediaRow } from '@/components/admin/ProductForm';

export default function EditProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const { data: productResponse, isLoading: loadingProduct } = useGetProductBySlugQuery(slug);
  const [updateProduct, { isLoading }] = useUpdateProductMutation();
  const [submitError, setSubmitError] = useState('');

  // Variant to scroll to/highlight, deep-linked from the dashboard low-stock list (?variant=).
  const [highlightVariantId, setHighlightVariantId] = useState<number | undefined>(undefined);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('variant');
    if (v) setHighlightVariantId(Number(v));
  }, []);

  const product = useMemo(() => {
    const raw = productResponse as { data?: Record<string, unknown> } | Record<string, unknown> | undefined;
    return (raw as { data?: Record<string, unknown> })?.data || (raw as Record<string, unknown> | undefined);
  }, [productResponse]);

  const initialValues = useMemo((): Partial<ProductFormValues> | undefined => {
    if (!product) return undefined;
    const p = product as {
      name?: string;
      description?: string;
      price?: number | string;
      comparePrice?: number | string;
      categoryId?: number;
      category?: { id?: number };
      material?: string;
      gender?: 'men' | 'women' | 'unisex';
      isActive?: boolean;
      variants?: Array<{
        id?: number; sku?: string; size?: string; color?: string;
        colorHex?: string; material?: string; priceOverride?: number | string;
        stock?: number; isActive?: boolean;
      }>;
      media?: Array<{ url?: string; alt?: string; isPrimary?: boolean; type?: 'image' | 'video'; sortOrder?: number }>;
      tags?: Array<{ id?: number }>;
    };

    return {
      name: p.name || '',
      description: p.description || '',
      price: String(p.price || ''),
      comparePrice: p.comparePrice ? String(p.comparePrice) : '',
      categoryId: String(p.categoryId || p.category?.id || ''),
      material: p.material || '',
      gender: p.gender || 'unisex',
      isActive: p.isActive ?? true,
      variants: (p.variants || []).map((v): VariantRow => ({
        id: v.id,
        sku: v.sku || '',
        size: v.size || '',
        color: v.color || '',
        colorHex: v.colorHex || '#000000',
        material: v.material || '',
        priceOverride: v.priceOverride ? String(v.priceOverride) : '',
        stock: String(v.stock ?? 0),
        isActive: v.isActive ?? true,
      })),
      media: (p.media || []).map((m): MediaRow => ({
        url: m.url || '',
        alt: m.alt || '',
        isPrimary: m.isPrimary ?? false,
        type: m.type || 'image',
        sortOrder: m.sortOrder ?? 0,
      })),
      tagIds: (p.tags || []).map((t) => t.id).filter((id): id is number => typeof id === 'number'),
    };
  }, [product]);

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitError('');
    const p = product as { id?: number } | undefined;
    if (!p?.id) return;

    try {
      await updateProduct({
        id: p.id,
        data: {
          name: values.name,
          description: values.description,
          price: parseFloat(values.price),
          comparePrice: values.comparePrice ? parseFloat(values.comparePrice) : undefined,
          categoryId: parseInt(values.categoryId),
          material: values.material || undefined,
          gender: values.gender,
          isActive: values.isActive,
          variants: values.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size || undefined,
            color: v.color || undefined,
            colorHex: v.color && v.colorHex ? v.colorHex : undefined,
            material: v.material || undefined,
            priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : undefined,
            stock: parseInt(v.stock) || 0,
            isActive: v.isActive,
          })),
          media: values.media.map((m, i) => ({
            url: m.url,
            alt: m.alt,
            type: m.type,
            isPrimary: m.isPrimary,
            sortOrder: i,
          })),
          tagIds: values.tagIds,
        },
      }).unwrap();
      router.push('/admin/products');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string; metadata?: Array<{ code?: string; field?: string; value?: string }> } };
      const meta = e?.data?.metadata;
      if (meta && meta.length > 0) {
        const skuConflict = meta.find((m) => m.code === 'UNIQUE_CONSTRAINT' && m.field === 'sku');
        if (skuConflict) {
          setSubmitError(`SKU "${skuConflict.value}" already exists — please use a unique SKU for each variant.`);
          return;
        }
        setSubmitError(meta[0]?.code ? `${meta[0].field}: ${meta[0].code}` : (e?.data?.message || 'Failed to update product.'));
        return;
      }
      setSubmitError(e?.data?.message || 'Failed to update product. Please try again.');
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <p className="font-medium">Product not found</p>
        <p className="text-sm text-muted-foreground">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/admin/products">
          <Button size="sm">Back to Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <ProductForm
      initialValues={initialValues}
      isEditing={true}
      isSubmitting={isLoading}
      submitError={submitError}
      onSubmit={handleSubmit}
      highlightVariantId={highlightVariantId}
    />
  );
}
