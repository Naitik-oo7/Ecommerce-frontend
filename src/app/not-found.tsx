import Link from 'next/link';

export default function NotFound() {
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
          Error 404
        </p>
        <h1
          className="leading-[1.05] mb-5"
          style={{
            fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 700,
            color: '#1A1A18',
          }}
        >
          Page not found
        </h1>
        <p
          className="text-sm leading-relaxed mb-9"
          style={{ color: '#6B6560', fontFamily: 'var(--font-body, Jost, sans-serif)' }}
        >
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: '#1A1A18',
              color: '#F6F3EE',
              fontFamily: 'var(--font-body, Jost, sans-serif)',
              letterSpacing: '0.06em',
            }}
          >
            Back to home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium border transition-colors hover:border-[#C8703A]"
            style={{
              borderColor: '#1A1A18',
              color: '#1A1A18',
              fontFamily: 'var(--font-body, Jost, sans-serif)',
              letterSpacing: '0.06em',
            }}
          >
            Shop products
          </Link>
        </div>
      </div>
    </div>
  );
}
