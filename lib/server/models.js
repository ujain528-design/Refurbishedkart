// Mongoose models. The Product schema is intentionally loose (strict:false) so
// the full rich catalogue object from lib/data.js (nested attrs, variants source
// fields, image arrays) round-trips unchanged and the pricing engine in lib/pdp
// keeps working on documents read back from Mongo.
import mongoose from "mongoose";

const { Schema } = mongoose;

const ProductSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    // SEO URL slug (e.g. "dell-latitude-7420-core-i7-11th-gen"). Unique; the PDP
    // resolves by slug, numeric id 301-redirects to it. Generated on create/import
    // and backfilled for existing products (see lib/server/slug.js).
    slug: { type: String, index: true, unique: true, sparse: true },
    // Optional admin SEO overrides — when set, they win over the auto-generated
    // title/description (see lib/generateTitle.js, lib/generateMetaDescription.js).
    seoTitle: String,
    seoDescription: String,
    // Per-product warranty/tax overrides. Empty/0 ⇒ fall back to store defaults.
    warrantyPeriod: String, // "3 months" | "6 months" | "1 year" | "2 years" | ""
    gstRate: Number,        // 5 | 12 | 18 | 28 | 0 (0 ⇒ store default)
    hsnCode: String,        // "" ⇒ store default
    // Refurbished cosmetic/functional grade. Mirrored to attrs.condition so the
    // PDP badge + Compare "Condition" row (which read attrs) pick it up.
    condition: { type: String, enum: ["Excellent", "Good", "Fair"], default: "Excellent" },
    // Number of physical CPUs — only meaningful for servers/workstations (dual/quad
    // socket). The PDP shows it as "2 × <processor>" when > 1. Default 1.
    processorCount: { type: Number, default: 1 },
  },
  { strict: false, minimize: false, timestamps: true }
);

const AddressSchema = new Schema(
  {
    label: String, name: String, phone: String, email: { type: String, default: "" },
    line1: String, line2: String,
    city: String, state: String, pincode: String, isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema(
  {
    email: { type: String, index: true, sparse: true },
    phone: { type: String, index: true, sparse: true },
    name: String,
    image: String,
    provider: String, // "google" | "otp"
    role: { type: String, default: "customer" }, // customer | admin | superadmin
    addresses: { type: [AddressSchema], default: [] },
    wishlist: { type: [Number], default: [] },
  },
  { timestamps: true }
);

const OrderSchema = new Schema(
  {
    orderId: { type: String, unique: true, index: true },
    userId: { type: String, index: true },
    lines: { type: Array, default: [] },
    subtotal: Number, discount: Number, delivery: Number,
    shippingCharge: Number, // explicit shipping fee (mirrors delivery): 0 or the flat fee
    gst: Object, total: Number,
    couponCode: String, paymentMethod: String,
    // Coupon usage is claimed once, at payment confirmation. couponClaimed is the
    // idempotency guard (flipped false→true atomically by claimCouponSlotOnce);
    // couponSlotUnavailable flags the rare case where the coupon's usage limit was
    // already exhausted by the time this (already-paid) order confirmed — for admin review.
    couponClaimed: { type: Boolean, default: false },
    couponSlotUnavailable: { type: Boolean, default: false },
    shippingAddress: Object, buyerGstin: String,
    status: { type: String, default: "Confirmed" }, // payment_pending | Pending | Confirmed | Packed | Shipped | Delivered | Cancelled | Returned
    cancelledAt: Date,
    deliveredAt: Date, // stamped when status first set to "Delivered" (return-window base)
    packedAt: Date,    // stamped when status first set to "Packed"
    shippedAt: Date,   // stamped when status first set to "Shipped"
    trackingNumber: String,
    trackingUrl: String,    // optional courier tracking link
    courier: String,        // legacy courier field (kept in sync with courierName)
    courierName: String,    // courier/logistics partner name (shown in dispatch email)
    refundAmount: Number,   // amount refunded (mirrors the return refund when applicable)
    customerName: String,
    // Razorpay payment
    razorpayOrderId: String,
    paymentId: String,
    razorpayPaymentId: String,     // payment id from webhook/verify (rzp payment.captured)
    razorpaySignature: String,     // signature recorded at verification time
    paidAt: Date,                  // when payment was captured/confirmed
    codAdvancePaid: { type: Boolean, default: false },
    // Cash on Delivery: 10% charged upfront via Razorpay, 90% collected on delivery.
    // codStatus tracks the delivery leg: pending → delivered | failed.
    codUpfront: Number,            // 10% of total, paid now
    codRemaining: Number,          // 90% of total, due on delivery
    codStatus: { type: String, enum: ["pending", "delivered", "failed"] },
    // Explicit confirmation that the COD balance (codRemaining) was actually
    // collected at delivery — admin ticks a box when marking the order delivered.
    // Distinguishes "delivered" (status) from "cash actually received" (this flag).
    codBalanceCollected: { type: Boolean, default: false },
    codBalanceCollectedAt: Date,
    stockReleased: { type: Boolean, default: false },
    invoiceNumber: String,
    invoicePath: String,
    // Payment lifecycle (30-min pay window + auto-cancel)
    paymentDeadline: Date,                 // Date.now() + 30 min, set at creation
    cancellationReason: String,            // payment_timeout | payment_failed | user_cancelled
    // Shiprocket fulfillment (stubbed for now — populated when integration goes live)
    shiprocketOrderId: { type: String, default: "" },
    shiprocketStatus: { type: String, default: "" },
  },
  { timestamps: true }
);

const CouponSchema = new Schema(
  {
    code: { type: String, unique: true, uppercase: true, index: true },
    type: { type: String, default: "percent" }, // percent | flat
    value: { type: Number, required: true },
    minSubtotal: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    expiry: Date,
    usageLimit: Number,
    used: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const BulkEnquirySchema = new Schema(
  {
    name: String, company: String, email: String, phone: String,
    category: String, quantity: Number, message: String,
    status: { type: String, default: "New" },
  },
  { timestamps: true }
);

const OtpSchema = new Schema(
  {
    phone: { type: String, index: true },
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CounterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });

const MasterDataSchema = new Schema(
  { tableName: { type: String, unique: true, index: true }, rows: { type: Array, default: [] } },
  { timestamps: true }
);

// Guard against model re-registration during hot reload.
export const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
export const BulkEnquiry = mongoose.models.BulkEnquiry || mongoose.model("BulkEnquiry", BulkEnquirySchema);
export const Otp = mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
export const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);
export const MasterData = mongoose.models.MasterData || mongoose.model("MasterData", MasterDataSchema);

// Global component price tables (single doc, _id "pricing").
const PricingConfigSchema = new Schema(
  { _id: String, ram: { type: Object, default: {} }, ssd: { type: Object, default: {} }, settings: { type: Object, default: {} } },
  { timestamps: true }
);
export const PricingConfig = mongoose.models.PricingConfig || mongoose.model("PricingConfig", PricingConfigSchema);

const ReviewSchema = new Schema(
  {
    productId: { type: Number, index: true },
    productName: String,
    reviewer: String,
    rating: { type: Number, min: 1, max: 5 },
    text: String,
    status: { type: String, default: "pending" }, // pending | approved | rejected
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

const BannerSchema = new Schema(
  {
    headline: String,
    sub: String,
    slide: String,
    gradient: String,
    backgroundImage: String, // uploaded image URL (wins over colour/gradient)
    backgroundColor: { type: String, default: "#2D5016" }, // solid fallback when no image
    // Homepage placement slot. "hero" = the existing carousel; others render as a
    // full-width promo poster at a named position. Legacy banners default to hero.
    placement: { type: String, default: "hero" },
    cta: Object,
    clickable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    start: Date,
    end: Date,
  },
  { timestamps: true }
);
export const Banner = mongoose.models.Banner || mongoose.model("Banner", BannerSchema);

const TagSchema = new Schema(
  {
    name: { type: String, unique: true },
    slug: String,
    type: { type: String, default: "custom" }, // system | custom
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export const Tag = mongoose.models.Tag || mongoose.model("Tag", TagSchema);

// Curated product collections (e.g. "Diwali Deals"). Intentionally SEPARATE from
// the Tag system + homepage rows — a collection is a hand-picked, ordered list of
// product ids that a banner can link to and a /collections/[slug] page renders.
const CollectionSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    description: String,
    productIds: { type: [String], default: [] }, // product `id`s, in display order
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export const Collection = mongoose.models.Collection || mongoose.model("Collection", CollectionSchema);

// Store-wide settings (single doc, _id "store").
const SettingsSchema = new Schema({ _id: String, data: { type: Object, default: {} } }, { timestamps: true });
export const Settings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

// Admin-added custom dropdown values (processor models, GPUs, OS, RAM/storage types,
// chassis, …) that aren't in the built-in option lists. `family` scopes a value to a
// group (e.g. processor model "E5-2650 V3" under family "Intel Xeon"); "" for
// flat fields. Uniqueness is enforced case-insensitively in the POST route.
const CustomFieldValueSchema = new Schema(
  {
    field: { type: String, required: true, index: true }, // "processor" | "gpu" | "os" | ...
    family: { type: String, default: "" },                // "Intel Xeon" | "" (flat)
    value: { type: String, required: true },
    category: { type: [String], default: [] },            // ["servers","workstations"]
  },
  { timestamps: true }
);
CustomFieldValueSchema.index({ field: 1, family: 1 });
export const CustomFieldValue =
  mongoose.models.CustomFieldValue || mongoose.model("CustomFieldValue", CustomFieldValueSchema);

// Customer return requests. status: Requested → Approved/Rejected → Received → Refunded.
// Refunds are processed MANUALLY by the team (no auto Razorpay) — the refund/deduction
// fields just record what was charged; refundedAt is stamped when marked Refunded.
const ReturnSchema = new Schema(
  {
    returnId: { type: String, unique: true, index: true }, // RET-YYYY-NNNNN
    orderId: { type: String, index: true },                // RK-2026-NNNNN
    orderObjectId: { type: Schema.Types.ObjectId, ref: "Order" },
    userId: { type: String, index: true },
    userEmail: String,
    userName: String,
    productName: String,
    productId: String,
    reason: String,
    description: String,
    photos: { type: [String], default: [] },
    whatsappNumber: String,   // 10-digit mobile the unboxing video was sent from
    status: { type: String, enum: ["Requested", "Approved", "Rejected", "Picked Up", "Received", "Refunded"], default: "Requested", index: true },
    // Append-only audit trail of every status transition (drives the customer timeline).
    statusHistory: {
      type: [{ status: String, timestamp: Date, note: String, updatedBy: String }],
      default: [],
    },
    adminNotes: String,
    paidAmount: Number,       // line total captured at request time (refund basis)
    refundAmount: Number,     // admin-entered (paid − deduction)
    deductionAmount: Number,  // charges deducted
    deductionReason: String,
    addedToStock: { type: Boolean, default: false },
    refundedAt: Date,
    // Customer's refund payout target — collected AFTER the return is Approved.
    // SECURITY: the FULL bank/UPI details are NEVER stored here — they are emailed
    // (once) to support@ at submission time, which is the documented record. The DB
    // keeps only MASKED values (last-4 / first-3+domain) plus the holder name, so a
    // DB leak can't expose payable account numbers. Locked once submittedAt is set;
    // an admin can request resubmission (clears this + sets bankResubmissionRequested).
    refundBankDetails: {
      method: { type: String, enum: ["bank", "upi"] },
      accountHolderName: String,
      accountNumberMasked: String, // e.g. "XXXX XXXX 1234"
      upiIdMasked: String,         // e.g. "utk***@okhdfc"
      submittedAt: Date,
    },
    // Admin asked the customer to resubmit corrected details — unlocks their form.
    bankResubmissionRequested: { type: Boolean, default: false },
    bankResubmissionNote: String, // reason shown to the customer
  },
  { timestamps: true }
);
export const Return = mongoose.models.Return || mongoose.model("Return", ReturnSchema);

// ── Admin credentials (single doc, _id "admin") — custom ID/password login that
// is SEPARATE from customer NextAuth. passwordHash is bcrypt. failedAttempts +
// lockedUntil drive the 5-strikes / 15-min lockout. ──
const AdminCredentialSchema = new Schema(
  {
    _id: { type: String, default: "admin" },
    adminId: { type: String, required: true }, // not sensitive — stored plain
    passwordHash: { type: String, required: true },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
  },
  { timestamps: true, _id: false }
);
export const AdminCredential =
  mongoose.models.AdminCredential || mongoose.model("AdminCredential", AdminCredentialSchema);

// Admin OTP for credential changes (single doc, _id "admin"). otpHash is bcrypt;
// 10-minute expiry; single-use (used flag). Replaced on each new send.
const AdminOtpSchema = new Schema(
  {
    _id: { type: String, default: "admin" },
    otpHash: String,
    expiresAt: Date,
    used: { type: Boolean, default: false },
  },
  { timestamps: true, _id: false }
);
export const AdminOtp = mongoose.models.AdminOtp || mongoose.model("AdminOtp", AdminOtpSchema);

export async function nextOrderId() {
  const c = await Counter.findByIdAndUpdate(
    "order",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `RK-2026-${String(c.seq).padStart(5, "0")}`;
}

export async function nextReturnId() {
  const c = await Counter.findByIdAndUpdate(
    "return",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `RET-${new Date().getFullYear()}-${String(c.seq).padStart(5, "0")}`;
}
