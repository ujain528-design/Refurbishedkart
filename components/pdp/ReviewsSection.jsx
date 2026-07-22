import { StarIcon } from "@/components/Icons";
import { reviewSummary } from "@/lib/pdp";

const Stars = ({ rating, size = 15 }) => (
  <span className="inline-flex items-center gap-0.5 text-amber-400">
    {Array.from({ length: 5 }).map((_, i) => (
      <StarIcon
        key={i}
        filled={i < Math.round(rating)}
        style={{ width: size, height: size }}
        className={i < Math.round(rating) ? "" : "text-neutral-300"}
      />
    ))}
  </span>
);

/* PDP customer reviews — approved mock reviews only (PRD §6.6). */
export default function ReviewsSection({ reviews }) {
  const summary = reviewSummary(reviews);

  return (
    <div className="mt-8 max-w-3xl lg:mt-16">
      {/* "Write a Review" intentionally absent — returns once auth + order
          history exist, so only verified buyers can submit (PRD §6.6). */}
      <h2 className="section-heading">Customer Reviews</h2>

      {!summary ? (
        /* empty state */
        <div className="mt-8 rounded-card bg-neutral-50 py-9 text-center lg:py-16">
          <p className="text-[13px] font-bold text-ink lg:text-[15px]">Be the first to review this product</p>
          <p className="mt-1.5 text-sm text-neutral-500">
            Bought this device? Your experience helps other buyers trust refurbished.
          </p>
        </div>
      ) : (
        <>
          {/* average + breakdown bars */}
          <div className="mt-8 flex flex-col gap-4 rounded-card border border-black/5 bg-white p-4 shadow-card sm:flex-row sm:items-center lg:gap-8 lg:p-6">
            <div className="shrink-0 text-center sm:px-4">
              <p className="text-5xl font-extrabold tracking-tight text-ink">{summary.avg}</p>
              <div className="mt-2">
                <Stars rating={summary.avg} size={18} />
              </div>
              <p className="mt-1.5 text-[13px] text-neutral-500">
                Based on {summary.total} review{summary.total > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.counts[star - 1];
                const pct = Math.round((count / summary.total) * 100);
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-10 shrink-0 text-[13px] font-semibold text-neutral-600">
                      {star} ★
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[12px] text-neutral-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* review list */}
          <div className="mt-8 space-y-7">
            {reviews.map((r, i) => (
              <article key={i} className="border-b border-black/5 pb-7 last:border-b-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-[13px] font-bold text-brand">
                    {r.name[0]}
                  </span>
                  <span className="text-sm font-bold text-ink">{r.name}</span>
                  {r.verified && (
                    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold text-brand">
                      ✓ Verified Purchase
                    </span>
                  )}
                  <span className="ml-auto text-[12px] text-neutral-400">{r.date}</span>
                </div>
                <div className="mt-2.5">
                  <Stars rating={r.rating} />
                </div>
                {r.title && <p className="mt-2 text-sm font-bold text-ink">{r.title}</p>}
                <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">{r.text}</p>
                {Array.isArray(r.images) && r.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.images.map((src, k) => (
                      <a key={k} href={src} target="_blank" rel="noopener noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border border-black/10 transition-opacity hover:opacity-90">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Review photo ${k + 1}`} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
