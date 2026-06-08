"use client";

/* Reusable loading / error / empty states for every page that fetches data.
   SkeletonCard mirrors ProductCard's exact box (w-[260px], h-[190px] image). */

export function SkeletonCard({ className = "w-[260px] shrink-0 snap-start" }) {
  return (
    <div className={`${className} animate-pulse overflow-hidden rounded-card border border-black/5 bg-white shadow-card`}>
      <div className="h-[190px] bg-neutral-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-neutral-200" />
        <div className="h-3 w-full rounded bg-neutral-100" />
        <div className="mt-3 h-5 w-1/2 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

/* Horizontal skeleton row (homepage carousels). */
export function SkeletonRow({ count = 4 }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-hidden px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/* Grid of skeletons (listing / search). */
export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="w-full" />
      ))}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 rounded-card border border-black/5 bg-white px-6 py-14 text-center ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500">!</div>
      <p className="text-sm font-semibold text-neutral-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", message, children, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-black/10 bg-neutral-50 px-6 py-16 text-center ${className}`}>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {message && <p className="max-w-sm text-sm text-neutral-500">{message}</p>}
      {children && <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}
