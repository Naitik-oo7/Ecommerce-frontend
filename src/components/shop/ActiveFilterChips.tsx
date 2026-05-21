'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  filters: ActiveFilter[];
  onClearAll?: () => void;
}

export function ActiveFilterChips({ filters, onClearAll }: ActiveFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence mode="popLayout">
        {filters.map((filter) => (
          <motion.button
            key={filter.key}
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            onClick={filter.onRemove}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F3EE] text-[#111111] border border-[#C7A27C]/40 text-xs font-medium rounded-full hover:border-[#C7A27C] hover:bg-[#EDE8E0] transition-colors group"
          >
            <span>{filter.label}</span>
            <X className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}

        {filters.length > 1 && onClearAll && (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-[#E5E2DD] text-[#6B6B6B] text-xs font-medium rounded-full hover:border-[#111111] hover:text-[#111111] transition-colors"
          >
            Clear all
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
