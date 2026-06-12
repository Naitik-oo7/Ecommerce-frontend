'use client';

import { useConnection } from '@/context/ConnectionContext';
import { Loader2 } from 'lucide-react';

export function ConnectionIndicator() {
  const { isConnecting, connectionError } = useConnection();

  if (!isConnecting && !connectionError) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/90 text-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm font-medium">
        {connectionError || 'Connecting to backend...'}
      </span>
    </div>
  );
}
