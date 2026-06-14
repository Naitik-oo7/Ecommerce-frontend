'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export type ViewMode = 'table' | 'grid';
export type StatusFilter = 'all' | 'active' | 'inactive' | 'low_stock' | 'out_of_stock';

export function useProductFilters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [genderFilter, setGenderFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [inStock, setInStock] = useState('');
  const [minRating, setMinRating] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [view, setView] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const search = useDebounce(searchTerm.trim(), 400);

  useEffect(() => { setPage(1); }, [search]);

  // Honor a `?status=` deep-link (e.g. from the dashboard "Low Stock" View all button).
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('status');
    if (status && ['active', 'inactive', 'low_stock', 'out_of_stock'].includes(status)) {
      setStatusFilter(status as StatusFilter);
    }
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryId('');
    setGenderFilter('');
    setStatusFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setInStock('');
    setMinRating('');
    setTagFilter([]);
    setPage(1);
  };

  const hasActiveFilters = !!(
    searchTerm ||
    categoryId ||
    genderFilter ||
    statusFilter !== 'all' ||
    minPrice ||
    maxPrice ||
    inStock ||
    minRating ||
    sortBy !== 'createdAt' ||
    tagFilter.length > 0
  );

  const filters = {
    search: search || undefined,
    categoryId: categoryId || undefined,
    page,
    sortBy,
    sortOrder,
    minRating: minRating || undefined,
    tags: tagFilter.length > 0 ? tagFilter : undefined,
  };

  return {
    // State
    searchTerm,
    setSearchTerm,
    categoryId,
    setCategoryId,
    statusFilter,
    setStatusFilter,
    genderFilter,
    setGenderFilter,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    inStock,
    setInStock,
    minRating,
    setMinRating,
    tagFilter,
    setTagFilter,
    view,
    setView,
    page,
    setPage,
    showFilters,
    setShowFilters,

    // Computed
    filters,
    hasActiveFilters,
    clearFilters,
  };
}
