'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  // `unstable_retry` is the Next 16 recovery prop; `reset` is kept as a fallback.
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset ?? (() => window.location.reload());

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: '#F6F3EE' }}
    >
      <div className="text-center max-w-md">
        <p
          className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
          style={{ color: '#C8703A', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
        >
          Something went wrong
        </p>
        <h1
          className="leading-[1.05] mb-5"
          style={{
            fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 700,
            color: '#1A1A18',
          }}
        >
          We hit a snag
        </h1>
        <p
          className="text-sm leading-relaxed mb-9"
          style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
        >
          An unexpected error occurred while loading this page. You can try again,
          or head back home.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: '#1A1A18',
              color: '#F6F3EE',
              fontFamily: 'var(--font-body, Jost, sans-serif)',
              letterSpacing: '0.06em',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium border transition-colors hover:border-[#C8703A]"
            style={{
              borderColor: '#1A1A18',
              color: '#1A1A18',
              fontFamily: 'var(--font-body, Jost, sans-serif)',
              letterSpacing: '0.06em',
            }}
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
