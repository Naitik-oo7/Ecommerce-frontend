'use client';

import { useState, useRef, useCallback } from 'react';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export function PriceRangeSlider({ min, max, value, onChange }: PriceRangeSliderProps) {
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercent = (val: number) => ((val - min) / (max - min)) * 100;

  const getValueFromPercent = useCallback(
    (percent: number) => {
      const raw = (percent / 100) * (max - min) + min;
      return Math.round(Math.max(min, Math.min(max, raw)));
    },
    [min, max]
  );

  const handleTrackInteraction = useCallback(
    (clientX: number) => {
      if (!trackRef.current || !dragging) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      const newVal = getValueFromPercent(Math.max(0, Math.min(100, percent)));

      if (dragging === 'min') {
        onChange([Math.min(newVal, value[1] - 1), value[1]]);
      } else {
        onChange([value[0], Math.max(newVal, value[0] + 1)]);
      }
    },
    [dragging, value, onChange, getValueFromPercent]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => handleTrackInteraction(e.clientX),
    [handleTrackInteraction]
  );

  const handleMouseUp = () => setDragging(null);

  const leftPercent = getPercent(value[0]);
  const rightPercent = getPercent(value[1]);

  return (
    <div
      className="select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Price Labels */}
      <div className="flex justify-between mb-3">
        <span className="text-sm font-medium text-mono-charcoal">₹{value[0].toLocaleString()}</span>
        <span className="text-sm font-medium text-mono-charcoal">₹{value[1].toLocaleString()}</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-1.5 bg-[#E5E2DD] rounded-full cursor-pointer"
        onClick={(e) => {
          if (!trackRef.current) return;
          const rect = trackRef.current.getBoundingClientRect();
          const percent = ((e.clientX - rect.left) / rect.width) * 100;
          const newVal = getValueFromPercent(Math.max(0, Math.min(100, percent)));
          const distToMin = Math.abs(newVal - value[0]);
          const distToMax = Math.abs(newVal - value[1]);
          if (distToMin <= distToMax) {
            onChange([Math.min(newVal, value[1] - 1), value[1]]);
          } else {
            onChange([value[0], Math.max(newVal, value[0] + 1)]);
          }
        }}
      >
        {/* Active range fill */}
        <div
          className="absolute top-0 h-full bg-mono-terracotta rounded-full"
          style={{ left: `${leftPercent}%`, width: `${rightPercent - leftPercent}%` }}
        />

        {/* Min thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-mono-terracotta rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform"
          style={{ left: `${leftPercent}%` }}
          onMouseDown={(e) => { e.preventDefault(); setDragging('min'); }}
        />

        {/* Max thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-mono-terracotta rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform"
          style={{ left: `${rightPercent}%` }}
          onMouseDown={(e) => { e.preventDefault(); setDragging('max'); }}
        />
      </div>

      {/* Range labels */}
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-mono-stone">₹{min.toLocaleString()}</span>
        <span className="text-[10px] text-mono-stone">₹{max.toLocaleString()}</span>
      </div>
    </div>
  );
}
