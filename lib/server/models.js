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
  },
  { strict: false, minimize: false, timestamps: true }
);

const AddressSchema = new Schema(
  {
    label: String, name: String, phone: String, line1: String, line2: String,
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
    gst: Object, total: Number,
    couponCode: String, paymentMethod: String,
    shippingAddress: Object, buyerGstin: String,
    status: { type: String, default: "Confirmed" }, // pending_payment | Pending | Confirmed | Packed | Shipped | Delivered | Cancelled | Returned
    cancelledAt: Date,
    deliveredAt: Date, // stamped when status first set to "Delivered" (return-window base)
    trackingNumber: String,
    courier: String,
    customerName: String,
    // Razorpay payment
    razorpayOrderId: String,
    paymentId: String,
    codAdvancePaid: { type: Boolean, default: false },
    stockReleased: { type: Boolean, default: false },
    invoiceNumber: String,
    invoicePath: String,
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
    status: { type: String, enum: ["Requested", "Approved", "Rejected", "Received", "Refunded"], default: "Requested", index: true },
    adminNotes: String,
    paidAmount: Number,       // line total captured at request time (refund basis)
    refundAmount: Number,     // admin-entered (paid − deduction)
    deductionAmount: Number,  // charges deducted
    deductionReason: String,
    addedToStock: { type: Boolean, default: false },
    refundedAt: Date,
  },
  { timestamps: true }
);
export const Return = mongoose.models.Return || mongoose.model("Return", ReturnSchema);

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
