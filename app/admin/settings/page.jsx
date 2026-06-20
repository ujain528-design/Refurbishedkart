"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader, Tabs, Toggle, Field, useToast, inputCls, btnPrimary } from "@/components/admin/ui";
import { adminGetSettings, adminSaveSettings, adminGetIntegrations, adminUploadImage } from "@/lib/api";
import HeroCarouselManager from "@/components/admin/HeroCarouselManager";
import { resolveHeroSlides } from "@/lib/heroSlides";

const TABS = ["General", "Policies", "Delivery", "Appearance", "Flash Sale", "Social", "SEO & Scripts", "Email Templates", "Security", "Integrations", "Admin Users"];

// Quick-pick destinations for the CTA link (free text still allowed via the input).
const FLASH_LINK_SUGGESTIONS = ["/flash-sale", "/products/laptops", "/products/desktops", "/products/monitors", "/products/workstations", "/products/servers", "/shop/bestseller"];
const FLASH_BAR_POSITIONS = [["top", "Top of page (above navbar)"], ["below-navbar", "Below navbar"], ["bottom", "Bottom of page"]];
const FLASH_BANNER_POSITIONS = [["top", "Top of page"], ["below-title", "Below title"], ["above-products", "Above products"], ["hero", "Full-width hero"]];
const FLASH_HOME_POSITIONS = [["after-hero", "After hero"], ["after-featured", "After featured products"], ["before-budget", "Before shop by budget"], ["before-footer", "Before footer"]];

const WARRANTY_OPTS = ["3 Months", "6 Months", "1 Year", "2 Years"];
const GST_OPTS = [5, 12, 18, 28];
const EMAIL_STATUSES = ["Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"];
const EMAIL_VARS = ["{{customerName}}", "{{orderNumber}}", "{{orderTotal}}", "{{trackingNumber}}", "{{courierName}}", "{{storeName}}", "{{supportEmail}}", "{{deliveryDate}}"];
const DEFAULT_ROWS = [
  { key: "bestsellers", label: "Bestsellers", visible: true },
  { key: "new-arrivals", label: "New Arrivals", visible: true },
  { key: "flash-sale", label: "Flash Sale", visible: true },
  { key: "students", label: "Best for Students", visible: true },
  { key: "coding", label: "Best for Coding", visible: true },
];

function Label({ children }) {
  return <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{children}</span>;
}

export default function Settings() {
  const toast = useToast();
  const { isSuperAdmin, user } = useAuth();
  const [tab, setTab] = useState("General");
  const [s, setS] = useState(null);
  const [status, setStatus] = useState("loading");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    adminGetSettings().then((d) => {
      // Seed the editable hero slides from the legacy single-hero fields the first
      // time (so existing content shows as slide 1, no data loss).
      if (!Array.isArray(d.heroSlides) || d.heroSlides.length === 0) d.heroSlides = resolveHeroSlides(d);
      setS(d);
      setStatus("ready");
    }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const setTpl = (st, field, v) => setS((x) => ({ ...x, emailTemplates: { ...(x.emailTemplates || {}), [st]: { ...(x.emailTemplates?.[st] || {}), [field]: v } } }));

  const save = async () => {
    setSaving(true);
    try { const next = await adminSaveSettings(s); setS(next); toast("Settings saved"); }
    catch (e) { toast(e.message || "Save failed", "error"); }
    finally { setSaving(false); }
  };

  const uploadTo = async (key, file) => {
    if (!file) return;
    try { const { url } = await adminUploadImage(file); set(key, url); toast("Image uploaded — remember to Save"); }
    catch (e) { toast(e.message || "Upload failed", "error"); }
  };

  if (status === "loading") return <div><PageHeader title="Settings" subtitle="Store configuration." /><p className="py-16 text-center text-sm text-neutral-400">Loading…</p></div>;
  if (status === "error") return (
    <div><PageHeader title="Settings" subtitle="Store configuration." />
      <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card"><p className="text-sm font-semibold text-neutral-600">Couldn&apos;t load settings.</p><button onClick={load} className={`${btnPrimary} mt-4`}>Retry</button></div>
    </div>
  );

  const rows = Array.isArray(s.homepageRows) && s.homepageRows.length ? s.homepageRows : DEFAULT_ROWS;
  const moveRow = (i, dir) => {
    const next = [...rows]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set("homepageRows", next);
  };
  const toggleRow = (i) => set("homepageRows", rows.map((r, idx) => idx === i ? { ...r, visible: !r.visible } : r));

  const savable = !["Security", "Integrations", "Admin Users"].includes(tab);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Store configuration — every editable tab saves to the database." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="mt-6 max-w-3xl">
        {tab === "General" && (
          <div className="space-y-5 rounded-card border border-black/5 bg-white p-5 shadow-card">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Store Name"><input className={inputCls} value={s.storeName || ""} onChange={(e) => set("storeName", e.target.value)} /></Field>
              <Field label="Tagline"><input className={inputCls} value={s.tagline || ""} onChange={(e) => set("tagline", e.target.value)} /></Field>
              <Field label="GSTIN"><input className={inputCls} value={s.gstin || ""} onChange={(e) => set("gstin", e.target.value)} /></Field>
              <Field label="CIN"><input className={inputCls} value={s.cin || ""} onChange={(e) => set("cin", e.target.value)} /></Field>
              <Field label="PAN"><input className={inputCls} value={s.pan || ""} onChange={(e) => set("pan", e.target.value)} /></Field>
              <Field label="Support Email"><input className={inputCls} value={s.supportEmail || ""} onChange={(e) => set("supportEmail", e.target.value)} /></Field>
              <Field label="Support Phone"><input className={inputCls} value={s.supportPhone || ""} onChange={(e) => set("supportPhone", e.target.value)} /></Field>
              <Field label="WhatsApp Number"><input className={inputCls} value={s.whatsappNumber || ""} onChange={(e) => set("whatsappNumber", e.target.value)} /></Field>
            </div>
            <div><Label>Business Address</Label><textarea rows={2} className={inputCls} value={s.address || ""} onChange={(e) => set("address", e.target.value)} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Store Logo (replaces navbar text)</Label>{s.logoUrl ? <img src={s.logoUrl} alt="logo" className="mb-2 h-10 object-contain" /> : null}<input type="file" accept="image/*" onChange={(e) => uploadTo("logoUrl", e.target.files?.[0])} className="text-[13px]" />{s.logoUrl && <button onClick={() => set("logoUrl", "")} className="ml-2 text-[12px] font-bold text-red-600">Remove</button>}</div>
              <div><Label>Favicon</Label>{s.faviconUrl ? <img src={s.faviconUrl} alt="favicon" className="mb-2 h-8 w-8 object-contain" /> : null}<input type="file" accept="image/*" onChange={(e) => uploadTo("faviconUrl", e.target.files?.[0])} className="text-[13px]" /></div>
            </div>
          </div>
        )}

        {tab === "Policies" && (
          <div className="space-y-5 rounded-card border border-black/5 bg-white p-5 shadow-card">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Return Policy (days)"><input type="number" className={inputCls} value={s.returnDays ?? 7} onChange={(e) => set("returnDays", Number(e.target.value))} /></Field>
              <div><Label>Default Warranty</Label><select className={inputCls} value={s.warrantyDefault || "6 Months"} onChange={(e) => set("warrantyDefault", e.target.value)}>{WARRANTY_OPTS.map((o) => <option key={o}>{o}</option>)}</select></div>
              <div><Label>Default GST Rate</Label><select className={inputCls} value={s.gstRate ?? 18} onChange={(e) => set("gstRate", Number(e.target.value))}>{GST_OPTS.map((o) => <option key={o} value={o}>{o}%</option>)}</select></div>
            </div>
            <Field label="Default HSN Code"><input className={inputCls} value={s.hsnDefault || "8471"} onChange={(e) => set("hsnDefault", e.target.value)} /></Field>
            <p className="text-[12px] text-neutral-400">Policy texts save now; wiring the static policy pages to read them is in progress (see report).</p>
            {[["privacyText", "Privacy Policy"], ["termsText", "Terms & Conditions"], ["returnText", "Return Policy"], ["warrantyText", "Warranty Policy"]].map(([k, lbl]) => (
              <div key={k}><Label>{lbl} text</Label><textarea rows={4} className={inputCls} value={s[k] || ""} onChange={(e) => set(k, e.target.value)} placeholder={`${lbl} body…`} /></div>
            ))}
          </div>
        )}

        {tab === "Delivery" && (
          <div className="space-y-5 rounded-card border border-black/5 bg-white p-5 shadow-card">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Values are coerced through Number() so a stale string like "0199"
                  saved in the DB renders as 199 (no leading zeros). */}
              <Field label="Free Delivery Above (₹)"><input type="number" min={0} step={1} className={inputCls} value={Number(s.freeDeliveryAbove ?? 7999)} onChange={(e) => set("freeDeliveryAbove", Number(e.target.value))} /></Field>
              <Field label="Delivery Charge (₹)"><input type="number" min={0} step={1} className={inputCls} value={Number(s.deliveryFee ?? 199)} onChange={(e) => set("deliveryFee", Number(e.target.value))} /></Field>
              <Field label="Est. Delivery Days (min)"><input type="number" min={0} step={1} className={inputCls} value={Number(s.deliveryDaysMin ?? 3)} onChange={(e) => set("deliveryDaysMin", Number(e.target.value))} /></Field>
              <Field label="Est. Delivery Days (max)"><input type="number" min={0} step={1} className={inputCls} value={Number(s.deliveryDaysMax ?? 5)} onChange={(e) => set("deliveryDaysMax", Number(e.target.value))} /></Field>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-ink">Cash on Delivery</span><Toggle on={s.codEnabled !== false} onChange={(v) => set("codEnabled", v)} /></div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="COD Max Order Value (₹)"><input type="number" min={0} step={1} className={inputCls} value={Number(s.codLimit ?? 29999)} onChange={(e) => set("codLimit", Number(e.target.value))} disabled={s.codEnabled === false} /></Field>
                {/* COD advance is a fixed 10% of order value (computed at checkout),
                    not an editable rupee amount — shown read-only for clarity. */}
                <Field label="COD Advance (%)"><input type="number" readOnly disabled value={10} className={`${inputCls} cursor-not-allowed bg-neutral-100 text-neutral-500`} title="Fixed at 10% of the order value, calculated automatically at checkout." /></Field>
              </div>
              <p className="mt-2 text-[12px] text-neutral-400">COD advance is fixed at 10% of the order value (plus shipping) and is calculated automatically at checkout — it isn&apos;t a fixed rupee amount.</p>
            </div>
            <div><Label>Serviceable Pincodes (one per line — empty = all India)</Label><textarea rows={4} className={inputCls} value={s.serviceablePincodes || ""} onChange={(e) => set("serviceablePincodes", e.target.value)} placeholder={"560001\n110001"} /></div>
          </div>
        )}

        {tab === "Appearance" && (
          <div className="space-y-5 rounded-card border border-black/5 bg-white p-5 shadow-card">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Primary Colour</Label><input type="color" value={s.primaryColor || "#1B5E20"} onChange={(e) => set("primaryColor", e.target.value)} className="h-9 w-full rounded border border-black/10" /></div>
              <div><Label>Secondary Colour</Label><input type="color" value={s.secondaryColor || "#B71C1C"} onChange={(e) => set("secondaryColor", e.target.value)} className="h-9 w-full rounded border border-black/10" /></div>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-ink">Announcement Bar</span><Toggle on={s.announcementActive !== false} onChange={(v) => set("announcementActive", v)} /></div>
              <Field label="Announcement Text"><input className={`${inputCls} mt-2`} value={s.announcementText || ""} onChange={(e) => set("announcementText", e.target.value)} /></Field>
              <div className="mt-2"><Label>Announcement Background</Label><input type="color" value={s.announcementBg || "#1B5E20"} onChange={(e) => set("announcementBg", e.target.value)} className="h-9 w-24 rounded border border-black/10" /></div>
            </div>

            <HeroCarouselManager slides={s.heroSlides || []} onChange={(v) => set("heroSlides", v)} uploadImage={adminUploadImage} />

            <div>
              <Label>Homepage Section Order &amp; Visibility</Label>
              <div className="divide-y divide-black/5 rounded-lg border border-black/10">
                {rows.map((r, i) => (
                  <div key={r.key} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex-1 text-sm font-medium text-ink">{r.label}</span>
                    <button onClick={() => moveRow(i, -1)} disabled={i === 0} className="rounded px-2 text-neutral-500 disabled:opacity-30" aria-label="Move up">↑</button>
                    <button onClick={() => moveRow(i, 1)} disabled={i === rows.length - 1} className="rounded px-2 text-neutral-500 disabled:opacity-30" aria-label="Move down">↓</button>
                    <Toggle on={r.visible} onChange={() => toggleRow(i)} />
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[12px] text-neutral-400">Order + visibility persist; the homepage reads this once wired (in progress).</p>
            </div>
          </div>
        )}

        {tab === "Flash Sale" && <FlashSaleCard s={s} set={set} uploadTo={uploadTo} />}

        {tab === "Social" && (
          <div className="grid gap-4 rounded-card border border-black/5 bg-white p-5 shadow-card sm:grid-cols-2">
            {[["facebookUrl", "Facebook URL"], ["instagramUrl", "Instagram URL"], ["twitterUrl", "Twitter / X URL"], ["linkedinUrl", "LinkedIn URL"], ["youtubeUrl", "YouTube URL"], ["googleBusinessUrl", "Google Business URL"]].map(([k, lbl]) => (
              <Field key={k} label={lbl}><input className={inputCls} value={s[k] || ""} onChange={(e) => set(k, e.target.value)} placeholder="https://…" /></Field>
            ))}
            <p className="text-[12px] text-neutral-400 sm:col-span-2">The footer shows only the icons whose URL is set.</p>
          </div>
        )}

        {tab === "SEO & Scripts" && (
          <div className="space-y-5 rounded-card border border-black/5 bg-white p-5 shadow-card">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Google Analytics ID (GA4)"><input className={inputCls} value={s.gaId || ""} onChange={(e) => set("gaId", e.target.value)} placeholder="G-XXXXXXX" /></Field>
              <Field label="Search Console Code"><input className={inputCls} value={s.gscVerification || ""} onChange={(e) => set("gscVerification", e.target.value)} /></Field>
              <Field label="Facebook Pixel ID"><input className={inputCls} value={s.fbPixelId || ""} onChange={(e) => set("fbPixelId", e.target.value)} /></Field>
            </div>
            <div><Label>Custom Header Scripts (injected into &lt;head&gt;)</Label><textarea rows={4} className={`${inputCls} font-mono text-[12px]`} value={s.headerScripts || ""} onChange={(e) => set("headerScripts", e.target.value)} /></div>
            <div><Label>Custom Footer Scripts (before &lt;/body&gt;)</Label><textarea rows={4} className={`${inputCls} font-mono text-[12px]`} value={s.footerScripts || ""} onChange={(e) => set("footerScripts", e.target.value)} /></div>
            <p className="text-[12px] text-amber-700">These save now; injecting them into the live site is wired separately (in progress) — see report.</p>
          </div>
        )}

        {tab === "Email Templates" && (
          <div className="space-y-5 rounded-card border border-black/5 bg-white p-5 shadow-card">
            <div className="flex flex-wrap gap-1.5">
              {EMAIL_VARS.map((v) => <span key={v} className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[11px] text-neutral-600">{v}</span>)}
            </div>
            {EMAIL_STATUSES.map((st) => (
              <div key={st} className="rounded-lg border border-black/10 p-4">
                <p className="mb-2 text-[13px] font-bold text-ink">Order {st}</p>
                <Field label="Subject"><input className={inputCls} value={s.emailTemplates?.[st]?.subject || ""} onChange={(e) => setTpl(st, "subject", e.target.value)} placeholder={`Your order is ${st.toLowerCase()}`} /></Field>
                <div className="mt-2"><Label>Body</Label><textarea rows={3} className={inputCls} value={s.emailTemplates?.[st]?.body || ""} onChange={(e) => setTpl(st, "body", e.target.value)} placeholder={`Hi {{customerName}}, your order {{orderNumber}} is ${st.toLowerCase()}…`} /></div>
              </div>
            ))}
            <p className="text-[12px] text-amber-700">Templates save now; the order-status emails read them once wired (in progress).</p>
          </div>
        )}

        {tab === "Security" && <ComingSoon title="Login logs & security" note="Admin login-attempt logging (email, IP, time, success/fail) needs a LoginLog model + auth instrumentation. Planned in a later priority." />}

        {tab === "Integrations" && <IntegrationsTab onConfigure={(href) => href && setTab("SEO & Scripts")} />}

        {tab === "Admin Users" && (
          isSuperAdmin
            ? <ComingSoon title="Admin user management" note={`Adding/removing admins from the UI needs user-role endpoints (Priority 12). For now, admin is granted to ADMIN_EMAIL (.env) on Google sign-in. You are ${user?.email || "—"} (${user?.role || "—"}).`} />
            : <ComingSoon title="Admin users" note="Only a superadmin can manage admin users." />
        )}

        {savable && (
          <button onClick={save} disabled={saving} className={`${btnPrimary} mt-5`}>{saving ? "Saving…" : "Save Changes"}</button>
        )}
      </div>
    </div>
  );
}

function FlashSaleCard({ s, set, uploadTo }) {
  const card = "space-y-4 rounded-lg border border-black/10 p-4";
  const colorInput = "h-9 w-full rounded border border-black/10";
  return (
    <div className="space-y-5">
      {/* ── Sale ── */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">Flash Sale</span>
          <Toggle on={s.flashSaleActive === true} onChange={(v) => set("flashSaleActive", v)} label="Sale on/off" />
        </div>
        <p className="text-[12px] text-neutral-400">When OFF, the sale page redirects home and every flash element disappears sitewide.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sale Title"><input className={inputCls} value={s.flashSaleTitle || ""} onChange={(e) => set("flashSaleTitle", e.target.value)} placeholder="Flash Sale" /></Field>
          <Field label="CTA Button Text"><input className={inputCls} value={s.flashSaleCtaText || ""} onChange={(e) => set("flashSaleCtaText", e.target.value)} placeholder="Shop the Sale" /></Field>
        </div>
        <div><Label>Sale Subtitle</Label><textarea rows={2} className={inputCls} value={s.flashSaleSubtitle || ""} onChange={(e) => set("flashSaleSubtitle", e.target.value)} /></div>
        <div>
          <Label>CTA Button Link <span className="font-normal text-neutral-400">(pick a page or type any path)</span></Label>
          <input className={inputCls} list="flash-link-opts" value={s.flashSaleCtaLink || ""} onChange={(e) => set("flashSaleCtaLink", e.target.value)} placeholder="/flash-sale" />
          <datalist id="flash-link-opts">{FLASH_LINK_SUGGESTIONS.map((l) => <option key={l} value={l} />)}</datalist>
        </div>
      </div>

      {/* ── Timer ── */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">Countdown Timer</span>
          <Toggle on={s.flashTimerActive === true} onChange={(v) => set("flashTimerActive", v)} label="Timer on/off" />
        </div>
        <p className="text-[12px] text-neutral-400">Independent of the sale toggle. At zero the page shows “Sale Ended” (no redirect, page stays).</p>
        <Field label="Sale End Date &amp; Time"><input type="datetime-local" className={inputCls} value={s.flashSaleEndsAt || ""} onChange={(e) => set("flashSaleEndsAt", e.target.value)} /></Field>
      </div>

      {/* ── Announcement bar ── */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">Announcement Bar</span>
          <Toggle on={s.flashBarActive === true} onChange={(v) => set("flashBarActive", v)} label="Bar on/off" />
        </div>
        <Field label="Bar Text"><input className={inputCls} value={s.flashBarText || ""} onChange={(e) => set("flashBarText", e.target.value)} placeholder="Flash Sale Live — Up to 60% off!" /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label>Background</Label><input type="color" value={s.flashBarBg || "#B5532A"} onChange={(e) => set("flashBarBg", e.target.value)} className={colorInput} /></div>
          <div><Label>Text Colour</Label><input type="color" value={s.flashBarTextColor || "#FFFFFF"} onChange={(e) => set("flashBarTextColor", e.target.value)} className={colorInput} /></div>
          <div><Label>Position</Label><select className={inputCls} value={s.flashBarPosition || "top"} onChange={(e) => set("flashBarPosition", e.target.value)}>{FLASH_BAR_POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        </div>
        <p className="text-[12px] text-neutral-400">Shows the live countdown when the timer is on. Clicking the bar opens the sale page; visitors can dismiss it for the session.</p>
      </div>

      {/* ── Banner ── */}
      <div className={card}>
        <span className="text-sm font-bold text-ink">Page Banner</span>
        <div className="rounded-lg bg-neutral-50 p-3">
          <Label>Banner Image</Label>
          {s.flashBannerImage ? <img src={s.flashBannerImage} alt="flash banner" className="mb-2 w-full rounded object-cover" style={{ aspectRatio: "3 / 1" }} /> : null}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadTo("flashBannerImage", e.target.files?.[0])} className="text-[13px]" />
          {s.flashBannerImage && <button onClick={() => set("flashBannerImage", "")} className="ml-2 text-[12px] font-bold text-red-600">Remove</button>}
          <p className="mt-1 text-[11px] text-neutral-400">Recommended: 1440×480px, max 2MB, JPG/PNG/WebP. Keep text/logo centred for mobile.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label>Background (no image)</Label><input type="color" value={s.flashBannerBg || "#1B5E20"} onChange={(e) => set("flashBannerBg", e.target.value)} className={colorInput} /></div>
          <div><Label>Text Colour</Label><input type="color" value={s.flashBannerTextColor || "#FFFFFF"} onChange={(e) => set("flashBannerTextColor", e.target.value)} className={colorInput} /></div>
          <div><Label>Position on Page</Label><select className={inputCls} value={s.flashBannerPosition || "hero"} onChange={(e) => set("flashBannerPosition", e.target.value)}>{FLASH_BANNER_POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        </div>
      </div>

      {/* ── Page URL ── */}
      <div className={card}>
        <span className="text-sm font-bold text-ink">Flash Sale Page URL</span>
        <div>
          <Label>Slug</Label>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-neutral-400">/</span>
            <input className={inputCls} value={s.flashSaleSlug || "flash-sale"} onChange={(e) => set("flashSaleSlug", e.target.value.replace(/^\/+/, ""))} placeholder="flash-sale" />
          </div>
          <p className="mt-1 text-[12px] text-neutral-400">e.g. <code>flash-sale</code>, <code>sale</code>, <code>offers</code>. When changed, the old URL permanently redirects to the new one.</p>
        </div>
      </div>

      {/* ── Homepage section ── */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">Homepage Section</span>
          <Toggle on={s.flashHomeActive !== false} onChange={(v) => set("flashHomeActive", v)} label="Homepage section on/off" />
        </div>
        <div><Label>Position</Label><select className={inputCls} value={s.flashHomePosition || "after-hero"} onChange={(e) => set("flashHomePosition", e.target.value)}>{FLASH_HOME_POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <p className="text-[12px] text-neutral-400">Shows the sale title, countdown, CTA and up to 4 flash-sale products. Only appears while the sale is on.</p>
      </div>
    </div>
  );
}

function ComingSoon({ title, note }) {
  return (
    <div className="rounded-card border border-black/5 bg-white p-8 text-center shadow-card">
      <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Coming Soon</span>
      <h3 className="mt-3 text-base font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{note}</p>
    </div>
  );
}

function IntegrationsTab({ onConfigure }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { adminGetIntegrations().then(setRows).catch(() => setRows([])); }, []);
  const dot = (st) => (st === "ok" ? "bg-green-500" : st === "down" ? "bg-red-500" : st === "soon" ? "bg-amber-400" : "bg-neutral-300");
  const badge = (st) => (st === "ok" ? "Connected" : st === "down" ? "Not configured" : st === "soon" ? "Coming soon" : "Off");
  if (!rows) return <p className="py-10 text-center text-sm text-neutral-400">Checking integrations…</p>;
  return (
    <div className="divide-y divide-black/5 rounded-card border border-black/5 bg-white shadow-card">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-3 px-5 py-3.5">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot(r.status)}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{r.name}</p>
            <p className="text-[12px] text-neutral-500">{r.detail}{r.lastUsed ? ` · last used ${new Date(r.lastUsed).toLocaleDateString("en-IN")}` : ""}</p>
          </div>
          <span className="text-[12px] font-semibold text-neutral-400">{badge(r.status)}</span>
          {r.configureHref && <button onClick={() => onConfigure(r.configureHref)} className="ml-1 text-[12px] font-bold text-brand hover:underline">Configure</button>}
        </div>
      ))}
    </div>
  );
}
