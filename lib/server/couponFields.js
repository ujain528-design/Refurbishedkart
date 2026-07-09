// Normalize an admin coupon form payload into the DB shape. Shared by the create
// (POST) and update (PUT) admin routes so both persist the FULL field set — segment
// config, restrictions, limits, auto-apply — not just a cherry-picked subset.

const TYPES = ["percent", "flat", "free_shipping"];
const SEGMENTS = ["all", "first_order", "nth_order", "returning", "new_signup", "high_value", "inactive", "whatsapp", "specific"];

const num = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// Accept an array, or a newline/comma-separated string, → trimmed non-empty array.
const toList = (v) => {
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  return String(v ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const toDate = (v) => (v ? new Date(v) : undefined);

export function couponFieldsFromBody(d = {}) {
  const type = TYPES.includes(d.type) ? d.type : "percent";
  const segment = SEGMENTS.includes(d.customerSegment) ? d.customerSegment : "all";
  const expiry = toDate(d.expiryDate || d.expiry);
  return {
    code: String(d.code || "").trim().toUpperCase(),
    description: String(d.description || ""),
    active: d.active !== false,

    type,
    value: num(d.value),
    maxDiscount: num(d.maxDiscount),
    minSubtotal: num(d.minSubtotal ?? d.min),

    // undefined usageLimit → unlimited (schema leaves it unset)
    usageLimit: d.usageLimit === "" || d.usageLimit == null ? undefined : num(d.usageLimit),
    perCustomerLimit: d.perCustomerLimit === "" || d.perCustomerLimit == null ? 1 : num(d.perCustomerLimit, 1),

    startDate: toDate(d.startDate),
    expiryDate: expiry,
    expiry, // keep legacy alias in sync

    customerSegment: segment,
    nthOrder: num(d.nthOrder),
    newSignupDays: num(d.newSignupDays),
    highValueAmount: num(d.highValueAmount),
    inactiveDays: num(d.inactiveDays),
    allowedEmails: toList(d.allowedEmails),
    allowedPhones: toList(d.allowedPhones),

    applicableCategories: toList(d.applicableCategories),
    applicableBrands: toList(d.applicableBrands),

    autoApply: d.autoApply === true,
  };
}
