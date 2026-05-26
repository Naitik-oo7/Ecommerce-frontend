'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
    variant?: 'default' | 'outline' | 'ghost';
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`text-center ${className}`}
    >
      <div className="w-24 h-24 rounded-full bg-mono-cream flex items-center justify-center mx-auto mb-6">
        <Icon className="h-12 w-12 text-mono-terracotta/60" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-mono-charcoal mb-3">{title}</h2>
      {description && (
        <p className="text-mono-stone mb-8 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <Link href={action.href}>
          <Button
            size="lg"
            variant={action.variant || 'default'}
            className={action.variant === 'default' ? 'bg-mono-charcoal hover:bg-mono-charcoal/90' : ''}
          >
            {action.label}
          </Button>
        </Link>
      )}
    </motion.div>
  );
}
