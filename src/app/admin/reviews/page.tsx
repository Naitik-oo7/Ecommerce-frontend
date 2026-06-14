'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useGetAllReviewsQuery, useDeleteReviewMutation, useVerifyReviewMutation } from '@/services/api/reviewsApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Star, Trash2, Loader2, CheckCircle,
  ChevronLeft, ChevronRight, AlertTriangle, X, Filter,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: number;
  rating: number;
  comment?: string;
  isVerified?: boolean;
  product?: { name?: string };
  user?: { name?: string };
  createdAt?: string;
}

interface ReviewsResponse {
  data?: Review[];
  pagination?: { total?: number; totalPages?: number };
  stats?: { averageRating?: number; verified?: number; unverified?: number };
}

export default function AdminReviewsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [verifyingIds, setVerifyingIds] = useState<Set<number>>(new Set());
  const [actionError, setActionError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const search = useDebounce(searchInput.trim(), 400);
  useEffect(() => { setPage(1); }, [search]);

  const { data: reviewsResponse, isLoading, isFetching } = useGetAllReviewsQuery({
    rating: ratingFilter || undefined,
    isVerified: verifiedFilter || undefined,
    search: search || undefined,
    page,
    limit: 15,
  });

  const [deleteReview] = useDeleteReviewMutation();
  const [verifyReview] = useVerifyReviewMutation();

  const reviews = (reviewsResponse as ReviewsResponse | undefined)?.data || [];
  const pagination = (reviewsResponse as ReviewsResponse | undefined)?.pagination;

  const verified = reviews.filter((r) => r.isVerified).length;
  const unverified = reviews.filter((r) => !r.isVerified).length;
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const hasActiveFilters = !!(searchInput || ratingFilter || verifiedFilter);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    setActionError('');
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteReview(id).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to delete review');
    } finally {
      setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleVerify = async (id: number) => {
    setActionError('');
    setVerifyingIds((prev) => new Set(prev).add(id));
    try {
      await verifyReview(id).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to verify review');
    } finally {
      setVerifyingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setRatingFilter('');
    setVerifiedFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {pagination?.total !== undefined ? `${pagination.total} total reviews` : 'Loading…'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: pagination?.total ?? reviews.length, icon: MessageSquare, color: 'text-foreground', bg: 'bg-card', key: '' },
          { label: 'Verified', value: verified, icon: CheckCircle, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40', key: 'true' },
          { label: 'Unverified', value: unverified, icon: Star, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', key: 'false' },
          { label: 'Avg Rating', value: avgRating, icon: Star, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40', key: null },
        ].map(({ label, value, icon: Icon, color, bg, key }) => (
          <button
            key={label}
            onClick={() => key !== null ? (setVerifiedFilter(key), setPage(1)) : undefined}
            className={cn(
              'rounded-xl border p-4 text-left transition-all',
              bg,
              key !== null ? 'hover:shadow-sm cursor-pointer' : 'cursor-default',
              key !== null && verifiedFilter === key ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
              <Icon className={cn('h-4 w-4', color)} />
            </div>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
          </button>
        ))}
      </div>

      {/* Error banner */}
      {actionError && (
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
                placeholder="Search by product, user, or comment…"
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
                value={ratingFilter}
                onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">All Ratings</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={String(r)}>{r} Stars</option>
                ))}
              </select>

              <select
                value={verifiedFilter}
                onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">All Reviews</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified Only</option>
              </select>
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Star className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No reviews found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters ? 'Try adjusting your filters.' : 'No reviews have been submitted yet.'}
                </p>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            <div className={cn('divide-y divide-border transition-opacity', isFetching ? 'opacity-60' : 'opacity-100')}>
              {reviews.map((review) => (
                <div key={review.id} className="p-4 hover:bg-muted/20 transition-colors group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-4 w-4',
                                i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                              )}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-sm">{review.product?.name}</span>
                        {review.isVerified ? (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Verified
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded-full">
                            Unverified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        By <span className="font-medium text-foreground">{review.user?.name}</span>
                        {review.createdAt ? ` · ${new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                      </p>
                      {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {!review.isVerified && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                          onClick={() => handleVerify(review.id)}
                          disabled={verifyingIds.has(review.id)}
                        >
                          {verifyingIds.has(review.id)
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <CheckCircle className="h-3.5 w-3.5" />}
                          Verify
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingIds.has(review.id)}
                      >
                        {deletingIds.has(review.id)
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </Button>
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
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages ?? 0) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min((pagination.totalPages ?? 0) - 4, page - 2)) + i;
                  return pageNum <= (pagination.totalPages ?? 0) ? (
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
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= (pagination.totalPages ?? 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
