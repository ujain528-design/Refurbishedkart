// Server-only admin credential + OTP helpers. Custom ID/password admin auth,
// fully separate from the customer NextAuth/Google flow. bcrypt for hashing.
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/server/mongoose";
import { AdminCredential, AdminOtp } from "@/lib/server/models";

export const MAX_FAILED = 5;                 // attempts before lockout
export const LOCKOUT_MS = 15 * 60 * 1000;    // 15-minute lockout
export const OTP_TTL_MS = 10 * 60 * 1000;    // OTP valid 10 minutes
const BCRYPT_ROUNDS = 10;

// ── Validation (mirrors the client; server is the source of truth) ──
export const ID_RE = /^[A-Za-z0-9]{4,20}$/;  // alphanumeric, 4–20 chars
export const validId = (s) => ID_RE.test(String(s || ""));
export const validPassword = (s) => String(s || "").length >= 8; // min 8, no max

/* Whether first-time setup is still available (no credentials saved yet). */
export async function adminSetupRequired() {
  await dbConnect();
  const doc = await AdminCredential.findById("admin").lean();
  return !doc;
}

/* First-time setup — succeeds only ONCE. Returns { ok } or { error }. */
export async function setupAdmin(adminId, password) {
  await dbConnect();
  if (!validId(adminId)) return { error: "Admin ID must be 4–20 alphanumeric characters." };
  if (!validPassword(password)) return { error: "Password must be at least 8 characters." };
  const existing = await AdminCredential.findById("admin").lean();
  if (existing) return { error: "Admin account already exists." };
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await AdminCredential.create({ _id: "admin", adminId, passwordHash });
  return { ok: true };
}

/* Verify login. Enforces the 5-strike / 15-min lockout. Returns
   { ok, adminId } | { error, lockedMs? }. */
export async function verifyAdminLogin(adminId, password) {
  await dbConnect();
  const doc = await AdminCredential.findById("admin");
  if (!doc) return { error: "Admin account not set up yet." };

  const now = Date.now();
  if (doc.lockedUntil && doc.lockedUntil.getTime() > now) {
    return { error: "Too many failed attempts. Try again later.", lockedMs: doc.lockedUntil.getTime() - now };
  }

  const idOk = String(adminId || "") === doc.adminId;
  const pwOk = idOk && (await bcrypt.compare(String(password || ""), doc.passwordHash));
  if (!idOk || !pwOk) {
    doc.failedAttempts = (doc.failedAttempts || 0) + 1;
    if (doc.failedAttempts >= MAX_FAILED) {
      doc.lockedUntil = new Date(now + LOCKOUT_MS);
      doc.failedAttempts = 0; // reset the counter; the lock is the penalty
    }
    await doc.save();
    return { error: "Invalid ID or password." };
  }

  // Success — clear strikes.
  doc.failedAttempts = 0;
  doc.lockedUntil = undefined;
  await doc.save();
  return { ok: true, adminId: doc.adminId };
}

/* Create + store a fresh 6-digit OTP (bcrypt-hashed). Returns the plain code so
   the caller can email it. Any previous OTP is overwritten (single active OTP). */
export async function createAdminOtp() {
  await dbConnect();
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const otpHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  await AdminOtp.findByIdAndUpdate(
    "admin",
    { $set: { otpHash, expiresAt: new Date(Date.now() + OTP_TTL_MS), used: false } },
    { upsert: true }
  );
  return code;
}

/* Check an OTP without consuming it. Returns { ok } | { error }. */
export async function checkAdminOtp(code) {
  await dbConnect();
  const doc = await AdminOtp.findById("admin").lean();
  if (!doc || !doc.otpHash) return { error: "No OTP requested. Please request a new code." };
  if (doc.used) return { error: "This OTP has already been used. Request a new code." };
  if (!doc.expiresAt || doc.expiresAt.getTime() < Date.now()) return { error: "OTP expired. Request a new code." };
  const ok = await bcrypt.compare(String(code || ""), doc.otpHash);
  return ok ? { ok: true } : { error: "Incorrect OTP." };
}

/* Mark the current OTP consumed (single-use). */
export async function consumeAdminOtp() {
  await dbConnect();
  await AdminOtp.findByIdAndUpdate("admin", { $set: { used: true } });
}

/* Change credentials AFTER a valid, unused OTP. Validates + consumes the OTP. */
export async function changeAdminCreds(code, newAdminId, newPassword) {
  if (!validId(newAdminId)) return { error: "Admin ID must be 4–20 alphanumeric characters." };
  if (!validPassword(newPassword)) return { error: "Password must be at least 8 characters." };
  const otp = await checkAdminOtp(code);
  if (otp.error) return { error: otp.error };
  await dbConnect();
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await AdminCredential.findByIdAndUpdate(
    "admin",
    { $set: { adminId: newAdminId, passwordHash, failedAttempts: 0, lockedUntil: null } },
    { upsert: true }
  );
  await consumeAdminOtp();
  return { ok: true };
}
