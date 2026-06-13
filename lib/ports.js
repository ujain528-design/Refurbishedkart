// Ports master + helpers. Ports are stored on a product as a map of
// portType → quantity, with only qty > 0 persisted, e.g. { "USB-A": 2, "HDMI": 1 }.
// Isomorphic (no imports) so the editor, PDP, Compare, bulk template + server
// validation all share one definition.

// Canonical port types (the "Ports master table"). Order here is the display order.
export const PORT_TYPES = [
  "USB-A",
  "USB-C",
  "Thunderbolt",
  "HDMI",
  "VGA",
  "DisplayPort",
  "Ethernet (RJ45)",
  "Audio Jack",
  "SD Card Reader",
  "Mini DisplayPort",
];

const PORT_SET = new Set(PORT_TYPES);

/* Coerce an arbitrary ports object into the canonical { type: qty } map, keeping
   only known port types with a positive integer quantity. */
export function normalizePorts(ports) {
  const out = {};
  if (!ports || typeof ports !== "object") return out;
  for (const [k, v] of Object.entries(ports)) {
    if (!PORT_SET.has(k)) continue;
    const n = Math.max(0, Math.round(Number(v) || 0));
    if (n > 0) out[k] = n;
  }
  return out;
}

/* Buyer-facing string: "2× USB-A · 1× USB-C · 1× HDMI" (qty > 0 only, canonical
   order). Returns "" when there are no ports — callers hide the row/section. */
export function formatPorts(ports) {
  const np = normalizePorts(ports);
  return PORT_TYPES.filter((t) => np[t] > 0).map((t) => `${np[t]}× ${t}`).join(" · ");
}
