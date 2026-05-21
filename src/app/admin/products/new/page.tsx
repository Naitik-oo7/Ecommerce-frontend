'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateProductMutation } from '@/services/api/productsApi';
import ProductForm, { ProductFormValues } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  const router = useRouter();
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitError('');
    try {
      await createProduct({
        name: values.name,
        description: values.description,
        price: parseFloat(values.price),
        comparePrice: values.comparePrice ? parseFloat(values.comparePrice) : undefined,
        categoryId: parseInt(values.categoryId),
        material: values.material || undefined,
        gender: values.gender,
        isActive: values.isActive,
        variants: values.variants.map((v) => ({
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
        setSubmitError(meta[0]?.code ? `${meta[0].field}: ${meta[0].code}` : (e?.data?.message || 'Failed to create product.'));
        return;
      }
      setSubmitError(e?.data?.message || 'Failed to create product. Please try again.');
    }
  };

  return (
    <ProductForm
      isEditing={false}
      isSubmitting={isLoading}
      submitError={submitError}
      onSubmit={handleSubmit}
    />
  );
}
