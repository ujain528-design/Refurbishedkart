"use client";

/* Listing page interactive shell — PRD §4.3.
   Now fetches products for the category from the API (was a mock prop).
   Sticky filter sidebar (desktop) / drawer (mobile), multi-select groups,
   dual-handle price slider, chips, sort, counts, load-more, skeleton/error/empty.
   URL params (?brand=Dell&ram=16) pre-apply filters. Filter options are derived
   from the fetched set, so the sidebar only ever offers options that return
   results (equivalent to /api/products/filters/:category). */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import { CloseIcon } from "@/components/Icons";
import { SkeletonGrid, ErrorState } from "@/components/ui/States";
import { getProducts } from "@/lib/api";

// All accessors use optional chaining so a product missing `attrs` can never crash
// filter-option derivation or rendering (defensive against malformed catalogue rows).
// `hideFor` excludes a facet from those categories. Desktop towers
// (Workstations/Servers) never expose Screen Size / Touchscreen facets, even if a
// stray row carries those attrs — workstations are desktop-only.
const FILTER_FIELDS = [
  { key: "brand", label: "Brand", get: (p) => p.brand },
  { key: "processor", label: "Processor", get: (p) => p.attrs?.processor },
  { key: "gen", label: "Processor Generation", get: (p) => p.attrs?.gen },
  { key: "ram", label: "RAM (GB)", get: (p) => p.attrs?.ram, format: (v) => `${v} GB` },
  { key: "ramType", label: "RAM Type", get: (p) => p.attrs?.ramType },
  { key: "ssd", label: "SSD Capacity", get: (p) => p.attrs?.ssd },
  { key: "screen", label: "Screen Size", get: (p) => p.attrs?.screen, hideFor: ["Workstations", "Servers"] },
  { key: "touch", label: "Touchscreen", get: (p) => (p.attrs?.touchscreen === undefined ? undefined : p.attrs.touchscreen ? "Yes" : "No"), hideFor: ["Workstations", "Servers"] },
  { key: "gpu", label: "Graphics / GPU", get: (p) => p.attrs?.gpu },
  { key: "os", label: "Operating System", get: (p) => p.attrs?.os },
  { key: "warranty", label: "Warranty Period", get: (p) => p.attrs?.warranty },
];

const SORTS = [
  { id: "bestselling", label: "Bestselling" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "newest", label: "Newest" },
];

const sortFns = {
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  newest: (a, b) => b.id - a.id,
  bestselling: (a, b) =>
    Number((b.tags || []).includes("bestseller")) - Number((a.tags || []).includes("bestseller")) || b.stock - a.stock,
};

const PAGE = 9;

function FilterGroup({ field, options, selected, onToggle }) {
  return (
    <fieldset>
      <legend className="text-[12px] font-bold uppercase tracking-wide text-ink">{field.label}</legend>
      <div className="mt-3 space-y-2.5">
        {options.map((opt) => (
          <label key={String(opt)} className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-600 hover:text-ink">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(field.key, opt)}
              className="h-4 w-4 rounded border-neutral-300 accent-brand"
            />
            {field.format ? field.format(opt) : String(opt)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* Data source (any one):
   - categorySlug  → getProducts({ category })        (listing page)
   - query         → getProducts(query)               (flash-sale: { tags })
   - products      → use the given array, skip fetch   (search results) */
export default function ListingClient({ categorySlug, categoryName, query, products: providedProducts }) {
  const searchParams = useSearchParams();
  const brandParam = searchParams.get("brand");
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");

  const [products, setProducts] = useState(providedProducts || []);
  const [status, setStatus] = useState(providedProducts ? "ready" : "loading"); // loading | ready | error

  // initial filters from URL (?brand=Dell&ram=16 ...)
  const [selected, setSelected] = useState(() => {
    const s = {};
    FILTER_FIELDS.forEach((f) => {
      const v = searchParams.get(f.key);
      if (v != null) s[f.key] = [f.key === "ram" ? Number(v) : v];
    });
    return s;
  });
  const [price, setPrice] = useState(null);
  const [sort, setSort] = useState("bestselling");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE);

  const load = useCallback(() => {
    if (providedProducts) { setProducts(providedProducts); setStatus("ready"); return; }
    let alive = true;
    setStatus("loading");
    getProducts(query || { category: categorySlug })
      .then((rows) => {
        if (!alive) return;
        setProducts(rows);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, JSON.stringify(query), providedProducts]);

  useEffect(load, [load]);

  const bounds = useMemo(() => {
    if (!products.length) return [0, 0];
    const prices = products.map((p) => p.price);
    return [Math.floor(Math.min(...prices) / 1000) * 1000, Math.ceil(Math.max(...prices) / 1000) * 1000];
  }, [products]);

  // initialise the price slider once products arrive — honour ?minPrice&maxPrice
  // (e.g. from a budget tier) clamped to the available bounds.
  useEffect(() => {
    if (!products.length) return;
    const [lo, hi] = bounds;
    const pmin = minPriceParam != null ? Math.min(Math.max(lo, Number(minPriceParam) || lo), hi) : lo;
    const pmax = maxPriceParam != null ? Math.max(Math.min(hi, Number(maxPriceParam) || hi), lo) : hi;
    setPrice(pmin <= pmax ? [pmin, pmax] : [lo, hi]);
  }, [bounds, products.length, minPriceParam, maxPriceParam]);

  useEffect(() => {
    if (brandParam) setSelected((s) => ({ ...s, brand: [brandParam] }));
  }, [brandParam]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // reset pagination when filters/sort change
  useEffect(() => { setVisible(PAGE); }, [selected, price, sort]);

  const fieldsWithOptions = useMemo(
    () =>
      FILTER_FIELDS
        .filter((f) => !(f.hideFor && f.hideFor.includes(categoryName)))
        .map((f) => ({
          field: f,
          options: [...new Set(products.map(f.get).filter((v) => v !== undefined))].sort((a, b) =>
            typeof a === "number" ? a - b : String(a).localeCompare(String(b))
          ),
        })).filter(({ options }) => options.length > 0),
    [products, categoryName]
  );

  const toggle = (key, val) =>
    setSelected((s) => {
      const cur = s[key] || [];
      const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
      return { ...s, [key]: next };
    });

  const priceNarrowed = price && (price[0] !== bounds[0] || price[1] !== bounds[1]);
  const activeCount = Object.values(selected).flat().length + (priceNarrowed ? 1 : 0);

  const clearAll = () => { setSelected({}); setPrice(bounds); };

  const filtered = useMemo(() => {
    const get = Object.fromEntries(FILTER_FIELDS.map((f) => [f.key, f.get]));
    return products
      .filter(
        (p) =>
          (!price || (p.price >= price[0] && p.price <= price[1])) &&
          Object.entries(selected).every(([key, vals]) => vals.length === 0 || vals.includes(get[key](p)))
      )
      .sort(sortFns[sort]);
  }, [products, selected, price, sort]);

  const shown = filtered.slice(0, visible);

  const chips = [
    ...Object.entries(selected).flatMap(([key, vals]) =>
      vals.map((v) => {
        const f = FILTER_FIELDS.find((x) => x.key === key);
        return { label: f.format ? f.format(v) : String(v), remove: () => toggle(key, v) };
      })
    ),
    ...(priceNarrowed
      ? [{ label: `₹${price[0].toLocaleString("en-IN")} – ₹${price[1].toLocaleString("en-IN")}`, remove: () => setPrice(bounds) }]
      : []),
  ];

  if (status === "loading") return <SkeletonGrid count={9} />;
  if (status === "error") return <ErrorState message="Couldn't load products." onRetry={load} />;

  const panel = (
    <div className="space-y-7">
      {fieldsWithOptions.map(({ field, options }) => (
        <div key={field.key}>
          <FilterGroup field={field} options={options} selected={selected[field.key] || []} onToggle={toggle} />
          {field.key === "brand" && price && (
            <div className="mt-7">
              <p className="text-[12px] font-bold uppercase tracking-wide text-ink">Price Range</p>
              <div className="mt-3">
                <PriceRangeSlider min={bounds[0]} max={bounds[1]} value={price} onChange={setPrice} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="gap-10 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden self-start lg:sticky lg:top-[136px] lg:block lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto lg:pr-2">
        {panel}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-label="Filters">
          <div className="absolute inset-0 bg-ink/50 animate-overlay-in" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[300px] flex-col bg-white shadow-card-hover animate-modal-in">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <p className="text-sm font-bold text-ink">Filters</p>
              <button aria-label="Close filters" onClick={() => setDrawerOpen(false)} className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-ink">
                <CloseIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">{panel}</div>
            <div className="border-t border-black/5 p-4">
              <button onClick={() => setDrawerOpen(false)} className="w-full rounded-full bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark">
                Show {filtered.length} products
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand lg:hidden">
              Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </button>
            <p className="text-sm text-neutral-500">
              Showing <span className="font-bold text-ink">{filtered.length}</span> of{" "}
              <span className="font-bold text-ink">{products.length}</span> products
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-500">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none">
              {SORTS.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
            </select>
          </label>
        </div>

        {chips.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {chips.map(({ label, remove }) => (
              <button key={label} onClick={remove} className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white">
                {label} <span aria-hidden="true">×</span>
              </button>
            ))}
            <button onClick={clearAll} className="text-[12px] font-semibold text-neutral-400 underline hover:text-ink">Clear All</button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-card bg-neutral-50 py-24 text-center">
            <p className="text-lg font-bold text-ink">No products found</p>
            <p className="mt-1 text-sm text-neutral-500">No {categoryName.toLowerCase()} match these filters.</p>
            <button onClick={clearAll} className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Clear all filters</button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-[13px] text-neutral-500">
              Showing {shown.length} of {filtered.length} product{filtered.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((p) => (<ProductCard key={p.id} product={p} className="w-full" />))}
            </div>
            {filtered.length > visible ? (
              <div className="mt-10 text-center">
                <button onClick={() => setVisible((v) => Math.min(v + PAGE, filtered.length))} className="rounded-full border border-brand px-8 py-3 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white">
                  Load More ({filtered.length - visible} more)
                </button>
              </div>
            ) : filtered.length > PAGE ? (
              <p className="mt-10 text-center text-[13px] text-neutral-400">No more products</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
