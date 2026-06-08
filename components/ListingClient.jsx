"use client";

/* Listing page interactive shell — PRD §4.3.
   Sticky filter sidebar (desktop) / slide-in drawer (mobile), multi-select
   checkbox groups, dual-handle price slider, removable chips, sort, counts,
   empty state. Reads ?brand= from the URL (set by navbar mega dropdown). */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import { CloseIcon } from "@/components/Icons";

// Order per Session 2 brief. Groups with no values in a category auto-hide.
const FILTER_FIELDS = [
  { key: "brand", label: "Brand", get: (p) => p.brand },
  // price slider renders between brand and processor
  { key: "processor", label: "Processor", get: (p) => p.attrs.processor },
  { key: "gen", label: "Processor Generation", get: (p) => p.attrs.gen },
  { key: "ram", label: "RAM (GB)", get: (p) => p.attrs.ram, format: (v) => `${v} GB` },
  { key: "ramType", label: "RAM Type", get: (p) => p.attrs.ramType },
  { key: "ssd", label: "SSD Capacity", get: (p) => p.attrs.ssd },
  { key: "screen", label: "Screen Size", get: (p) => p.attrs.screen },
  { key: "touch", label: "Touchscreen", get: (p) => (p.attrs.touchscreen === undefined ? undefined : p.attrs.touchscreen ? "Yes" : "No") },
  { key: "gpu", label: "Graphics / GPU", get: (p) => p.attrs.gpu },
  { key: "os", label: "Operating System", get: (p) => p.attrs.os },
  { key: "warranty", label: "Warranty Period", get: (p) => p.attrs.warranty },
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
    Number(b.tags.includes("bestseller")) - Number(a.tags.includes("bestseller")) || b.stock - a.stock,
};

function FilterGroup({ field, options, selected, onToggle }) {
  return (
    <fieldset>
      <legend className="text-[12px] font-bold uppercase tracking-wide text-ink">
        {field.label}
      </legend>
      <div className="mt-3 space-y-2.5">
        {options.map((opt) => (
          <label
            key={String(opt)}
            className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-600 hover:text-ink"
          >
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

export default function ListingClient({ products, categoryName }) {
  const searchParams = useSearchParams();
  const brandParam = searchParams.get("brand");

  const bounds = useMemo(() => {
    const prices = products.map((p) => p.price);
    return [
      Math.floor(Math.min(...prices) / 1000) * 1000,
      Math.ceil(Math.max(...prices) / 1000) * 1000,
    ];
  }, [products]);

  const [selected, setSelected] = useState(() => (brandParam ? { brand: [brandParam] } : {}));
  const [price, setPrice] = useState(bounds);
  const [sort, setSort] = useState("bestselling");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // navbar dropdown navigates to ?brand=X — sync it into filter state
  useEffect(() => {
    if (brandParam) setSelected((s) => ({ ...s, brand: [brandParam] }));
  }, [brandParam]);

  // lock body scroll while mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const fieldsWithOptions = useMemo(
    () =>
      FILTER_FIELDS.map((f) => ({
        field: f,
        options: [...new Set(products.map(f.get).filter((v) => v !== undefined))].sort((a, b) =>
          typeof a === "number" ? a - b : String(a).localeCompare(String(b))
        ),
      })).filter(({ options }) => options.length > 0),
    [products]
  );

  const toggle = (key, val) =>
    setSelected((s) => {
      const cur = s[key] || [];
      const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
      return { ...s, [key]: next };
    });

  const priceNarrowed = price[0] !== bounds[0] || price[1] !== bounds[1];
  const activeCount = Object.values(selected).flat().length + (priceNarrowed ? 1 : 0);

  const clearAll = () => {
    setSelected({});
    setPrice(bounds);
  };

  const filtered = useMemo(() => {
    const get = Object.fromEntries(FILTER_FIELDS.map((f) => [f.key, f.get]));
    return products
      .filter(
        (p) =>
          p.price >= price[0] &&
          p.price <= price[1] &&
          Object.entries(selected).every(
            ([key, vals]) => vals.length === 0 || vals.includes(get[key](p))
          )
      )
      .sort(sortFns[sort]);
  }, [products, selected, price, sort]);

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

  const panel = (
    <div className="space-y-7">
      {fieldsWithOptions.map(({ field, options }) => (
        <div key={field.key}>
          <FilterGroup
            field={field}
            options={options}
            selected={selected[field.key] || []}
            onToggle={toggle}
          />
          {/* price slider sits right after Brand, per spec */}
          {field.key === "brand" && (
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
      {/* ── desktop sidebar: fixed 260px, sticky ── */}
      <aside className="hidden self-start lg:sticky lg:top-[136px] lg:block lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto lg:pr-2">
        {panel}
      </aside>

      {/* ── mobile slide-in drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-label="Filters">
          <div className="absolute inset-0 bg-ink/50 animate-overlay-in" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[300px] flex-col bg-white shadow-card-hover animate-modal-in">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <p className="text-sm font-bold text-ink">Filters</p>
              <button
                aria-label="Close filters"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-ink"
              >
                <CloseIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">{panel}</div>
            <div className="border-t border-black/5 p-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded-full bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark"
              >
                Show {filtered.length} products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── grid column ── */}
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* mobile filter button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand lg:hidden"
            >
              Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </button>
            <p className="text-sm text-neutral-500">
              Showing <span className="font-bold text-ink">{filtered.length}</span> of{" "}
              <span className="font-bold text-ink">{products.length}</span> products
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-500">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* active filter chips */}
        {chips.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {chips.map(({ label, remove }) => (
              <button
                key={label}
                onClick={remove}
                className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
              >
                {label} <span aria-hidden="true">×</span>
              </button>
            ))}
            <button
              onClick={clearAll}
              className="text-[12px] font-semibold text-neutral-400 underline hover:text-ink"
            >
              Clear All
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-card bg-neutral-50 py-24 text-center">
            <p className="text-lg font-bold text-ink">No products found</p>
            <p className="mt-1 text-sm text-neutral-500">
              No {categoryName.toLowerCase()} match these filters.
            </p>
            <button
              onClick={clearAll}
              className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} className="w-full" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
