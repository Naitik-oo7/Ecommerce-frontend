'use client';

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 1, className = '' }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse ${className}`}>
          <div className="aspect-3/4 bg-mono-sand rounded-xl mb-3" />
          <div className="h-3 bg-mono-cream rounded w-1/3 mb-2" />
          <div className="h-4 bg-mono-cream rounded w-3/4 mb-2" />
          <div className="h-4 bg-mono-cream rounded w-1/2" />
        </div>
      ))}
    </>
  );
}
