import { REVIEWS } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import { StarIcon } from "@/components/Icons";

function ReviewCard({ review }) {
  return (
    <figure className="w-[260px] shrink-0 rounded-card border border-black/5 bg-white p-4 shadow-card lg:w-[340px] lg:p-6">
      <div className="flex items-center gap-1 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            filled={i < review.rating}
            style={{ width: 14, height: 14 }}
            className={i < review.rating ? "" : "text-neutral-300"}
          />
        ))}
      </div>
      <blockquote className="mt-2.5 text-[0.8rem] leading-snug text-neutral-600 lg:mt-4 lg:text-sm lg:leading-relaxed">
        “{review.text}”
      </blockquote>
      <figcaption className="mt-3.5 flex items-center gap-2.5 lg:mt-5 lg:gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-[0.72rem] font-bold text-brand lg:h-10 lg:w-10 lg:text-sm">
          {review.name.split(" ").map((w) => w[0]).join("")}
        </span>
        <span>
          <span className="block text-[0.78rem] font-bold text-ink lg:text-sm">
            {review.name} · {review.city}
          </span>
          <span className="block text-[11px] text-neutral-400 lg:text-[12px]">{review.product}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function Reviews() {
  // List duplicated once; track animates -50% then loops = seamless marquee.
  const loop = [...REVIEWS, ...REVIEWS];
  return (
    <section className="overflow-hidden py-10 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="What Buyers Say"
          subtitle="Unfiltered words from people who took the refurbished bet."
        />
      </div>
      <div className="group relative mt-2">
        {/* edge fades */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
        <div className="flex w-max gap-3.5 animate-marquee group-hover:[animation-play-state:paused] lg:gap-6">
          {loop.map((review, i) => (
            <ReviewCard key={`${review.name}-${i}`} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
