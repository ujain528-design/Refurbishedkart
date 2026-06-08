#!/usr/bin/env bash
# Verifies the MongoDB-backed backend against your RUNNING dev server.
# Prereqs: (1) mongod running locally, (2) `npm run dev` running on :3000
#          AFTER you added the new .env.local keys (restart it so they load).
#
# Usage:  bash scripts/verify-backend.sh
set -uo pipefail
BASE="${BASE:-http://localhost:3000}"
pass=0; fail=0
ok(){ echo "  ✅ $1"; pass=$((pass+1)); }
no(){ echo "  ❌ $1"; fail=$((fail+1)); }
hr(){ printf '%s\n' "------------------------------------------------------------"; }

command -v jq >/dev/null 2>&1 || echo "(tip: install jq for prettier output — not required)"

hr; echo "1) MongoDB connection  →  GET /api/health/db"
H=$(curl -s "$BASE/api/health/db")
echo "   $H"
echo "$H" | grep -q '"ok":true' && echo "$H" | grep -q '"state":"connected"' \
  && ok "Mongo connected" || no "Mongo NOT connected (is mongod running? did you restart dev after editing .env.local?)"

hr; echo "2) Seed catalogue into Mongo  →  POST /api/dev/seed"
S=$(curl -s -X POST "$BASE/api/dev/seed")
echo "   $S"
echo "$S" | grep -q '"ok":true' && ok "Seeded products into MongoDB" || no "Seed failed"

hr; echo "3) Product loads FROM DB  →  GET /api/products/2"
P=$(curl -s "$BASE/api/products/2")
echo "   $P" | head -c 240; echo
echo "$P" | grep -q '"name":"Lenovo ThinkPad T14"' && ok "Product #2 loaded from DB" || no "Product not returned from DB"

hr; echo "4) Server-side pricing  →  POST /api/pricing/calculate {productId:2, ram:32, ssd:256GB}"
C=$(curl -s -X POST "$BASE/api/pricing/calculate" -H 'content-type: application/json' \
     -d '{"productId":2,"ram":32,"ssd":"256GB"}')
echo "   $C"
echo "$C" | grep -q '"unitPrice":30099' && ok "Pricing correct (₹30,099)" || no "Unexpected price (expected 30099)"

hr; echo "5) Coupon validation  →  POST /api/coupons/apply {SAVE10, 50000}"
K=$(curl -s -X POST "$BASE/api/coupons/apply" -H 'content-type: application/json' \
     -d '{"code":"SAVE10","subtotal":50000}')
echo "   $K"
echo "$K" | grep -q '"discount":5000' && ok "SAVE10 → ₹5,000 off" || no "Coupon failed"

hr; echo "6) OTP send + real email  →  POST /api/auth/otp/send"
O=$(curl -s -X POST "$BASE/api/auth/otp/send" -H 'content-type: application/json' \
     -d '{"phone":"9876500000"}')
echo "   $O" | head -c 240; echo
echo "$O" | grep -q '"emailed":true' && ok "OTP emailed via Gmail SMTP" \
  || no "Email not sent (check EMAIL_PASS app-password / see emailError above) — devCode still returned"

hr
echo "RESULT: $pass passed, $fail failed"
echo
echo "Check #7 (Google login) is interactive — open $BASE/login and click"
echo "\"Continue with Google\".  REQUIRED in Google Cloud Console first:"
echo "  Authorized redirect URI : $BASE/api/auth/callback/google"
echo "  Authorized JS origin    : $BASE"
