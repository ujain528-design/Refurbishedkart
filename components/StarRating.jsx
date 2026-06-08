import { StarIcon } from "@/components/Icons";

/* Static star display, supports halves (e.g. 4.5). Server-safe. */
export default function StarRating({ rating = 4.5, count = 127 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.min(1, Math.max(0, rating - i)); // 1, 0.5 or 0
          return (
            <span key={i} className="relative inline-block" style={{ width: 18, height: 18 }}>
              <StarIcon filled={false} className="absolute inset-0 text-neutral-300" style={{ width: 18, height: 18 }} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <StarIcon style={{ width: 18, height: 18 }} />
              </span>
            </span>
          );
        })}
      </div>
      <span className="text-sm font-semibold text-ink">{rating}</span>
      <span className="text-sm text-neutral-400">({count} ratings)</span>
    </div>
  );
}
