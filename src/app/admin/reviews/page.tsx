'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star, Trash2 } from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reviews</h1>

      <Card>
        <CardHeader>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No reviews found.
              </div>
            ) : (
              reviews.map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium">{review.product?.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          By {review.user?.name} on {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm">{review.comment}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
