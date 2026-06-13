"use client";

import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";

/* Pages & Navigation CMS is not built — there is no backend for creating/editing
   static pages, footer columns, or header nav from the admin. The previous version
   of this screen was a UI mock whose "Save" buttons silently discarded input. It is
   now an honest placeholder so no admin loses work. The store details it used to
   fake (GSTIN, phone, email, address, WhatsApp, delivery, announcement) are managed
   for real under Settings. Build a real Pages CMS post-launch (needs a Pages
   collection + CRUD routes + /blog or /pages rendering). */
export default function PagesNav() {
  return (
    <div>
      <PageHeader title="Pages & Navigation" subtitle="Static content & navigation management." />

      <div className="mx-auto mt-8 max-w-xl rounded-card border border-black/5 bg-white p-8 text-center shadow-card">
        <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          Coming Soon
        </span>
        <h2 className="mt-4 text-lg font-bold text-ink">Page & navigation editing isn&apos;t available yet</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          A content manager for static pages, footer columns and header navigation is planned
          for after launch. Until then, these are managed in code.
        </p>
        <p className="mt-4 text-sm text-neutral-500">
          Store contact details, GST number, delivery thresholds and the announcement bar are
          editable now under{" "}
          <Link href="/admin/settings" className="font-bold text-brand hover:underline">Settings</Link>.
        </p>
      </div>
    </div>
  );
}
