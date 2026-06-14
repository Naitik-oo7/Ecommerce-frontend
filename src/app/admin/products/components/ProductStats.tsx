'use client';

import { Package, CheckCircle2, Ban, TrendingDown, XCircle } from 'lucide-react';

interface Stats {
  total: number;
  active: number;
  inactive: number;
  lowStock: number;
  outOfStock: number;
}

interface ProductStatsProps {
  stats: Stats;
  activeFilter: string;
  onFilterChange: (filter: 'all' | 'active' | 'inactive' | 'low_stock' | 'out_of_stock') => void;
}

export function ProductStats({ stats, activeFilter, onFilterChange }: ProductStatsProps) {
  const statItems = [
    { 
      label: 'Total', 
      value: stats.total, 
      icon: Package, 
      color: 'text-foreground', 
      bg: 'bg-card',
      key: 'all' as const
    },
    {
      label: 'Active',
      value: stats.active,
      icon: CheckCircle2,
      color: 'text-mono-sage',
      bg: 'bg-mono-sage/8',
      key: 'active' as const
    },
    {
      label: 'Inactive',
      value: stats.inactive,
      icon: Ban,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
      key: 'inactive' as const
    },
    {
      label: 'Low Stock',
      value: stats.lowStock,
      icon: TrendingDown,
      color: 'text-mono-terracotta',
      bg: 'bg-mono-terracotta/8',
      key: 'low_stock' as const
    },
    {
      label: 'Out of Stock',
      value: stats.outOfStock,
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/5',
      key: 'out_of_stock' as const
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statItems.map(({ label, value, color, bg, icon: Icon, key }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={`${bg} rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
            activeFilter === key ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </button>
      ))}
    </div>
  );
}
