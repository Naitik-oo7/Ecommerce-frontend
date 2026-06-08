'use client';

import { useState } from 'react';
import {
  useGetCacheStatsQuery,
  useClearAllCacheMutation,
  useClearCacheNamespaceMutation,
} from '@/services/api/cacheApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DatabaseZap, Trash2, Loader2, RefreshCw, AlertTriangle, X,
  CheckCircle2, Layers, Power,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Friendly labels for known namespaces; unknown ones fall back to the raw key.
const NAMESPACE_LABELS: Record<string, string> = {
  products: 'Products',
  categories: 'Categories',
};

export default function AdminCachePage() {
  const { data: stats, isLoading, isFetching, refetch } = useGetCacheStatsQuery();
  const [clearAllCache, { isLoading: isClearingAll }] = useClearAllCacheMutation();
  const [clearNamespace] = useClearCacheNamespaceMutation();

  const [clearingNs, setClearingNs] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const enabled = stats?.enabled ?? false;
  const namespaces = stats?.namespaces ?? {};
  const total = stats?.total ?? 0;
  const namespaceKeys = Object.keys(namespaces);

  const flash = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const handleClearAll = async () => {
    if (!confirm('Clear ALL caches? Pages will be rebuilt from the database on the next request.')) return;
    setActionError('');
    try {
      const res = await clearAllCache().unwrap();
      flash(`Cleared all caches (${res.cleared.join(', ')}).`);
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to clear cache');
    }
  };

  const handleClearNamespace = async (ns: string) => {
    setActionError('');
    setClearingNs(ns);
    try {
      await clearNamespace(ns).unwrap();
      flash(`Cleared "${NAMESPACE_LABELS[ns] || ns}" cache.`);
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setActionError(e?.data?.message || 'Failed to clear cache');
    } finally {
      setClearingNs(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DatabaseZap className="h-6 w-6 text-primary" />
            Cache Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Redis caches product &amp; category responses for speed. Clear them to force fresh data.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-9 gap-2"
            onClick={handleClearAll}
            disabled={isClearingAll || !enabled || total === 0}
          >
            {isClearingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Clear All Cache
          </Button>
        </div>
      </div>

      {/* Banners */}
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
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/30 px-4 py-2.5 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Redis status */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div
            className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
              enabled ? 'bg-green-50 dark:bg-green-950/40' : 'bg-muted'
            )}
          >
            <Power className={cn('h-5 w-5', enabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">
              Redis is {enabled ? 'connected' : 'disabled'}
            </p>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? `${total} cached ${total === 1 ? 'entry' : 'entries'} across ${namespaceKeys.length} namespaces.`
                : 'Caching is off (REDIS_URL not set or unreachable). The app serves directly from the database.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Per-namespace */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Cache Namespaces
          </h2>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : namespaceKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
              <DatabaseZap className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No cache namespaces reported.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {namespaceKeys.map((ns) => {
                const count = namespaces[ns];
                const busy = clearingNs === ns;
                return (
                  <div key={ns} className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{NAMESPACE_LABELS[ns] || ns}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} cached {count === 1 ? 'entry' : 'entries'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleClearNamespace(ns)}
                      disabled={busy || !enabled || count === 0}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Clear
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
