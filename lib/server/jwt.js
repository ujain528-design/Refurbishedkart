// Minimal HS256 JWT — sign/verify with Node crypto, no external dependency.
import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || "refurbishedkart-dev-secret";
const b64url = (buf) => Buffer.from(buf).toString("base64url");
const fromB64url = (s) => Buffer.from(s, "base64url").toString("utf8");

export function signJwt(payload, expiresInSec = 60 * 60 * 24 * 30) {
  const header = { alg: "HS256", typ: "JWT" };
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresInSec };
  const head = b64url(JSON.stringify(header));
  const data = b64url(JSON.stringify(body));
  const sig = crypto.createHmac("sha256", SECRET).update(`${head}.${data}`).digest("base64url");
  return `${head}.${data}.${sig}`;
}

export function verifyJwt(token) {
  try {
    const [head, data, sig] = token.split(".");
    if (!head || !data || !sig) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(`${head}.${data}`).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(fromB64url(data));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/* Extract + verify the bearer token from a Request. Returns payload or null. */
export function userFromRequest(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  return token ? verifyJwt(token) : null;
}
