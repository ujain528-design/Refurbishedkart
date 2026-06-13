import { categoryColor } from "@/lib/categoryColors";

// Single source of truth for the category cards used by both the homepage
// "Shop by Category" section and the budget→category picker modal, so they match.
export const CATEGORY_TILES = [
  { slug: "laptops", name: "Laptops", tagline: "Portable workstations" },
  { slug: "desktops", name: "Desktops", tagline: "Tower & SFF systems" },
  { slug: "monitors", name: "Monitors", tagline: "Professional displays" },
  { slug: "servers", name: "Servers", tagline: "Rack & tower servers" },
  { slug: "workstations", name: "Workstations", tagline: "High-performance rigs" },
];

// Precise thin-line device icons (1.5px stroke), monochrome via currentColor.
export function CatIcon({ slug, size = 32 }) {
  const p = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", style: { width: size, height: size } };
  switch (slug) {
    case "laptops":
      return <svg {...p}><rect x="3.5" y="5" width="17" height="10.5" rx="1.5" /><path d="M2 19h20" /></svg>;
    case "desktops":
      return <svg {...p}><rect x="7" y="3.5" width="10" height="17" rx="1.5" /><path d="M10 6.5h4M10 9h4" /><circle cx="12" cy="17" r="0.7" /></svg>;
    case "monitors":
      return <svg {...p}><rect x="3" y="4.5" width="18" height="11.5" rx="1.5" /><path d="M9 20h6M12 16v4" /></svg>;
    case "servers":
      return <svg {...p}><rect x="3.5" y="4" width="17" height="6" rx="1" /><rect x="3.5" y="14" width="17" height="6" rx="1" /><path d="M6.5 7h2M6.5 17h2" /><circle cx="17" cy="7" r="0.55" /><circle cx="17" cy="17" r="0.55" /></svg>;
    case "workstations":
      return <svg {...p}><rect x="7" y="7" width="10" height="10" rx="1.5" /><rect x="10" y="10" width="4" height="4" rx="0.5" /><path d="M10 3.5v3.5M14 3.5v3.5M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" /></svg>;
    default:
      return null;
  }
}

// The card wrapper classes — caller wraps the inner in <Link> or <button>.
export const TILE_CLASS =
  "shopcat-card flex flex-col items-start rounded-[14px] border border-warm-border bg-white p-7 text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-200 ease-out";

// Inner content: monochrome icon → thin colour accent → name → muted subtitle.
export function TileInner({ slug, name, tagline }) {
  const cc = categoryColor(slug);
  return (
    <>
      <span className="text-dark">
        <CatIcon slug={slug} />
      </span>
      <span className="mt-4 block h-[2px] w-7 rounded-full" style={{ background: cc.color }} aria-hidden="true" />
      <span className="mt-4 text-[1.05rem] font-semibold leading-tight text-dark">{name}</span>
      <span className="mt-1 text-[0.85rem] text-muted">{tagline}</span>
    </>
  );
}
