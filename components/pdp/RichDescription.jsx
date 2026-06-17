import { parseDescriptionBlocks } from "@/lib/pdp";

/* Renders an admin-authored product description with light structure:
   "Heading:" lines → bold subheadings, "- "/"* " lines → bullet list, blank
   lines → spacing, everything else → paragraphs. A bullet of the form
   "Label: detail" bolds the label. No markdown library. */
export default function RichDescription({ text, className = "" }) {
  const blocks = parseDescriptionBlocks(text);
  if (!blocks.length) return null;

  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          return (
            <p key={i} className="mt-5 first:mt-0 text-[14px] font-bold text-ink lg:text-base">{b.text}</p>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={i} className="mt-2.5 space-y-2">
              {b.items.map((item, j) => {
                const m = item.match(/^([^:]{1,40}):\s*(.+)$/);
                return (
                  <li key={j} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">✓</span>
                    <span>
                      {m ? <><strong className="font-bold text-ink">{m[1]}:</strong> {m[2]}</> : item}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }
        return <p key={i} className="mt-3.5 first:mt-0">{b.text}</p>;
      })}
    </div>
  );
}
