'use client';

import { useParams } from 'next/navigation';
import { useGetProductBySlugQuery } from '@/services/api/productsApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Heart, Star, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data: product, isLoading, error } = useGetProductBySlugQuery(slug as string);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted animate-pulse rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-12 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Product not found</div>
      </div>
    );
  }

  const productData = product as any;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
            {productData.images?.[selectedImage] ? (
              <img
                src={productData.images[selectedImage]}
                alt={productData.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>
          {productData.images && productData.images.length > 1 && (
            <div className="flex gap-2">
              {productData.images.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${index}`} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{productData.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(productData.avgRating || 0)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({productData.avgRating || '4.5'} rating)
              </span>
            </div>
            <p className="text-3xl font-bold mb-4">${productData.price}</p>
            <p className="text-muted-foreground">{productData.description}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= (productData.stock || 10)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {productData.stock || 0} in stock
              </span>
            </div>

            <div className="flex gap-4">
              <Button className="flex-1" size="lg" disabled={!productData.stock}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Product Details</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Category: {productData.category?.name || 'N/A'}</li>
                <li>• SKU: {productData.id}</li>
                <li>• Status: {productData.isActive ? 'In Stock' : 'Out of Stock'}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        </div>
      </div>
    </div>
  );
}
