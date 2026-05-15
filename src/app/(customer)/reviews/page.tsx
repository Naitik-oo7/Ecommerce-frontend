'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useState } from 'react';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Reviews</h1>
      
      {reviews.length === 0 ? (
        <Card className="max-w-md mx-auto text-center p-8">
          <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No reviews yet</h2>
          <p className="text-muted-foreground mb-6">Review products you've purchased</p>
          <Button>View Orders</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{review.product.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
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
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p>{review.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
