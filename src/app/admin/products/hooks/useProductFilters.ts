'use client';

import { useState, useEffect, useRef } from 'react';

export type ViewMode = 'table' | 'grid';
export type StatusFilter = 'all' | 'active' | 'inactive' | 'low_stock' | 'out_of_stock';

export function useProductFilters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const clearFilters = () => {
    setSearch('');
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
    search ||
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
