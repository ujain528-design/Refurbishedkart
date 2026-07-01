// Refund bank-detail helpers: validation + masking. IMPORTANT: full bank/UPI values
// are never persisted — they are emailed once to support@ (the documented record),
// and only the masked forms below are stored on the Return. So nothing here writes a
// full account number to the DB or to an API response.

// "XXXX XXXX 1234" — keep only the last 4 digits visible.
export function maskAccountNumber(num) {
  const s = String(num || "").replace(/\s+/g, "");
  if (!s) return "";
  if (s.length <= 4) return s; // nothing meaningful to mask
  return `XXXX XXXX ${s.slice(-4)}`;
}

// "utk***@okhdfc" — first 3 chars of the handle + domain. Domain kept (not payable
// on its own); the handle is obscured.
export function maskUpiId(upi) {
  const s = String(upi || "").trim();
  const at = s.indexOf("@");
  if (at < 0) return s ? `${s.slice(0, 3)}***` : "";
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  return `${local.slice(0, 3)}***@${domain}`;
}

// Build the MASKED subdocument that gets stored on the Return, from a validated
// payload (see validateBankDetails). No submittedAt — the route stamps that.
export function buildMaskedBankDetails(value = {}) {
  if (value.method === "upi") {
    return { method: "upi", upiIdMasked: maskUpiId(value.upiId) };
  }
  return {
    method: "bank",
    accountHolderName: value.accountHolderName || "",
    accountNumberMasked: maskAccountNumber(value.accountNumber),
  };
}

// Validate a submitted payload. Returns { ok, error?, value? } where value carries
// the cleaned RAW fields (used only to build the email + the masked subdoc, never
// stored raw).
export function validateBankDetails(input = {}) {
  const method = input.method === "upi" ? "upi" : input.method === "bank" ? "bank" : null;
  if (!method) return { ok: false, error: "Choose a refund method (bank or UPI)" };

  if (method === "upi") {
    const upiId = String(input.upiId || "").trim();
    // "name@handle" — must contain a single @ with non-empty sides.
    if (!/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z][a-zA-Z0-9.\-_]{1,}$/.test(upiId)) {
      return { ok: false, error: "Enter a valid UPI ID (e.g. name@bank)" };
    }
    return { ok: true, value: { method, upiId } };
  }

  // Bank transfer.
  const accountHolderName = String(input.accountHolderName || "").trim();
  const accountNumber = String(input.accountNumber || "").replace(/\s+/g, "");
  const ifscCode = String(input.ifscCode || "").trim().toUpperCase();
  if (accountHolderName.length < 2) return { ok: false, error: "Enter the account holder name" };
  if (!/^\d{9,18}$/.test(accountNumber)) return { ok: false, error: "Account number must be 9–18 digits" };
  // Standard IFSC: 4 letters + '0' + 6 alphanumerics (11 chars total).
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) return { ok: false, error: "Enter a valid 11-character IFSC code" };
  return { ok: true, value: { method, accountHolderName, accountNumber, ifscCode } };
}
