'use client';

import { useGetUserReviewsQuery, useDeleteReviewMutation } from '@/services/api/reviewsApi';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthLoading } from '@/components/auth/RequireAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Trash2, Package, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ReviewsPage() {
  const { ready, isAuthenticated } = useAuthGuard();
  const { data: reviewsResponse, isLoading } = useGetUserReviewsQuery(
    { limit: 100 },
    { skip: !isAuthenticated }
  );
  const [deleteReview] = useDeleteReviewMutation();
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  if (!ready) return <AuthLoading />;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center p-8">
          <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view your reviews</h2>
          <Link href="/login"><Button className="mt-4">Login</Button></Link>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Card key={i} className="h-32 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const reviews = (reviewsResponse as any)?.data || [];

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteReview(id).unwrap();
    } catch {}
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Reviews</h1>

      {reviews.length === 0 ? (
        <Card className="max-w-md mx-auto text-center p-10">
          <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No reviews yet</h2>
          <p className="text-muted-foreground mb-6">You can review products from your delivered orders.</p>
          <Link href="/profile/orders"><Button>View Orders</Button></Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <Card key={review.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {review.product?.images?.[0] ? (
                        <img src={review.product.images[0]} alt={review.product.name} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div>
                      <Link href={`/products/${review.product?.slug}`}>
                        <p className="font-semibold hover:text-primary text-sm">{review.product?.name}</p>
                      </Link>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{review.rating}/5</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
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
              </CardHeader>
              {review.comment && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                  {review.isVerified && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Verified Purchase</span>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
