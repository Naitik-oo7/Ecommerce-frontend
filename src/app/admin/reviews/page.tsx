'use client';

import { useState } from 'react';
import { useGetAllReviewsQuery, useDeleteReviewMutation, useVerifyReviewMutation } from '@/services/api/reviewsApi';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star, Trash2, Loader2, CheckCircle } from 'lucide-react';

export default function AdminReviewsPage() {
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [verifyingIds, setVerifyingIds] = useState<Set<number>>(new Set());

  const { data: reviewsResponse, isLoading } = useGetAllReviewsQuery({
    rating: ratingFilter || undefined,
    page,
    limit: 20,
  });
  const [deleteReview] = useDeleteReviewMutation();
  const [verifyReview] = useVerifyReviewMutation();

  const reviews = (reviewsResponse as any)?.data || [];
  const pagination = (reviewsResponse as any)?.pagination;

  const filteredReviews = search
    ? reviews.filter((r: any) =>
        r.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.comment?.toLowerCase().includes(search.toLowerCase())
      )
    : reviews;

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteReview(id).unwrap();
    } catch {}
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleVerify = async (id: number) => {
    setVerifyingIds((prev) => new Set(prev).add(id));
    try {
      await verifyReview(id).unwrap();
    } catch {}
    setVerifyingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        {pagination && <p className="text-muted-foreground text-sm mt-1">{pagination.total} total reviews</p>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} Stars</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Star className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No reviews found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((review: any) => (
                <div key={review.id} className="p-4 border rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="font-medium text-sm">{review.product?.name}</span>
                        {review.isVerified ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Verified
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Unverified</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        By <span className="font-medium">{review.user?.name}</span> · {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                      {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!review.isVerified && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          onClick={() => handleVerify(review.id)}
                          disabled={verifyingIds.has(review.id)}
                          title="Verify review"
                        >
                          {verifyingIds.has(review.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingIds.has(review.id)}
                      >
                        {deletingIds.has(review.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
