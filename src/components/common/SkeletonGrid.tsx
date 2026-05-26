'use client';

import { CardSkeleton } from './CardSkeleton';

interface SkeletonGridProps {
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}

const columnsClass = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

export function SkeletonGrid({ 
  count = 8, 
  columns = 4,
  className = '' 
}: SkeletonGridProps) {
  return (
    <div className={`grid ${columnsClass[columns]} gap-4 md:gap-6 ${className}`}>
      <CardSkeleton count={count} />
    </div>
  );
}
