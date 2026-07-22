"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getReviewEligibility } from "@/lib/api";
import ReviewForm from "@/components/ReviewForm";

/* PDP "Write a Review" block. Renders one of four states based on the customer's
   login + purchase + prior-review status (all verified server-side). */
export default function WriteReview({ productId, productImages = [] }) {
  const { ready, isLoggedIn } = useAuth();
  const [elig, setElig] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) { setElig({ loggedIn: false }); return; }
    let alive = true;
    getReviewEligibility(productId).then((e) => { if (alive) setElig(e); });
    return () => { alive = false; };
  }, [ready, isLoggedIn, productId]);

  if (!elig) return null;

  const note = (msg, cta = null) => (
    <div className="mt-6 rounded-card border border-warm-border bg-neutral-50 p-5 text-center">
      <p className="text-sm font-semibold text-ink">{msg}</p>
      {cta}
    </div>
  );

  if (submitted || elig.alreadyReviewed) return note("You've already reviewed this product.");
  if (!elig.loggedIn) {
    return note("Login to write a review", (
      <Link href="/login" className="mt-3 inline-block rounded-full bg-brand px-5 py-2 text-[13px] font-bold text-white hover:bg-brand-dark">Login</Link>
    ));
  }
  if (!elig.purchased) return note("Verified purchase required to write a review.");

  return (
    <div className="mt-6 rounded-card border border-warm-border bg-white p-5">
      <p className="mb-3 text-sm font-bold text-ink">Write a Review</p>
      <ReviewForm productId={productId} productImages={productImages} onSubmitted={() => setSubmitted(true)} />
    </div>
  );
}
