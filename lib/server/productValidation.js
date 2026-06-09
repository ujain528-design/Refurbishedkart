// Server-side validation for admin product create/update. Returns an array of
// human-readable error strings (empty array = valid). Used by both the POST
// (create) and PUT (update) admin product routes so the rules can't be bypassed
// by hitting the API directly — the editor's client checks are a convenience, not
// the gate.
export function validateProduct(data = {}) {
  const errors = [];
  const str = (v) => (typeof v === "string" ? v.trim() : v ?? "");

  if (!str(data.name) && !str(data.model)) errors.push("Name/model is required");
  if (!str(data.brand)) errors.push("Brand is required");
  if (!str(data.category)) errors.push("Category is required");

  const lp = Number(data.listedPrice ?? data.price ?? 0);
  if (!lp || lp <= 0) errors.push("Listed price is required and must be greater than 0");

  if (!str(data.defaultRam?.capacity)) errors.push("Default RAM capacity is required");
  if (!str(data.defaultSsd?.capacity)) errors.push("Default SSD capacity is required");

  return errors;
}
