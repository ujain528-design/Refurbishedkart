# RefurbishedKart

E-commerce storefront for certified refurbished electronics (laptops, desktops, monitors, servers, workstations) for the Indian market. Built for MMT Global Recycling Pvt. Ltd.

> **⚠️ Status: Frontend prototype — UI only, no backend.**
> Every page is built and interactive, but all data is **mock data** and all
> state lives in the browser's `localStorage`. There is **no server, no
> database, no authentication, and no payment processing.** Orders, logins,
> and the "pay" buttons are visual simulations. Do not treat this as a working
> store. See [What is *not* built](#what-is-not-built) below.

## Tech stack

- **Next.js 14** (App Router)
- **Tailwind CSS** (pure utility classes, no component library)
- **React Context + localStorage** for cart, wishlist, and mock auth state
- No backend, no external services

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

```bash
npm run build   # production build (all routes prerender)
npm start       # serve the production build
```

## What is built (UI)

- **Home** — full-width auto-playing poster carousel, tag-driven product rows
  (Bestsellers / Students / New Arrivals), clickable Flash Sale banner with
  countdown, brand & budget strips, "Why Buy Refurbished" counters, reviews
  marquee, Bulk Enquiry modal, FAQ, policy strip, footer with newsletter.
- **Category listing** `/products/[category]` — sticky filter sidebar
  (brand, price slider, processor, RAM, SSD, screen, touchscreen, GPU, OS,
  warranty…), sort, removable filter chips, stock states, mobile filter drawer.
- **Product detail** `/products/[category]/[id]` — image gallery with zoom,
  RAM/SSD variant selector driving a **component-based pricing engine**
  (type × capacity, onboard/soldered handling), trust-badge policy modals,
  spec table, description, customer reviews, related carousels.
- **Cart / Checkout / Order confirmation** — GST-inclusive pricing with
  CGST/SGST/IGST breakup extracted from the discounted amount, coupon (SAVE10),
  delivery rules, COD with ₹500 advance flow, login-gated checkout.
- **Account** `/account` — Orders, Coupons, Addresses, Profile (login-gated).
- **Wishlist** `/wishlist` — public, guest-accessible, localStorage-backed.
- **Login** `/login` — Google + phone-OTP **mock** (no real auth).
- **Search** `/search?q=` — fuzzy match + abbreviation synonyms
  (TFT→monitors, PC→desktops, AIO→All-in-One only, etc.).
- **Static pages** — About, Contact, Privacy Policy, Terms, Return Policy, Warranty.

## What is *not* built

These are simulated in the UI and require the backend (see PRD §5):

- **No real authentication** — "login" just flips a localStorage flag; OTP isn't sent or verified.
- **No orders backend** — order ID is a hardcoded string; nothing is persisted server-side. Cart state lives only in the current browser.
- **No payment gateway** — "Place Order" navigates to a confirmation page; no money moves.
- **No server-side pricing/stock** — the pricing engine runs client-side in `lib/pdp.js`; production must move it server-side so prices can't be tampered with.
- **No admin panel, master data, invoices, coupons engine, reviews moderation, search index, logistics, or email/SMS.**
- **Cross-device sync** (e.g. wishlist merge on login) is a documented stub, not functional.

## Project layout

```
app/            routes (App Router)
components/     UI components (Navbar, ProductCard, pdp/, cart/, checkout/, account/, …)
lib/            mock data + logic (data.js, pdp.js, search.js, *Context.jsx)
public/         product images
*.docx          PRD versions and the pricing-engine spec (project documents)
```

The PRD (`RefurbishedKart_PRD_v9.docx`) is the source of truth for requirements.
