Product Requirements Document (PRD) — DeliveryPrint MVP

**Overview**
- Web app for custom printing and digital products with end-to-end flow: account → browse → design → cart → checkout → payment → confirmation → production → shipping or digital download.
- Stack: Next.js 14, React 18, Supabase (auth, data), Resend (email), PayPal/Wompi (payments), Vercel (hosting).

**Goals**
- Enable customers to register/login, browse products, customize designs, place orders, pay securely, and receive either shipped items or instant downloads.
- Provide an Admin portal to manage catalog, categories, orders, transactions, email settings and templates.

**Non-Goals**
- Complex subscription management, multi-tenant billing, or multi-currency price engines beyond current scope.
- Deep design tooling beyond current Design Studio capabilities.

**Personas**
- Customer: purchases physical or digital products, customizes designs, tracks orders.
- Admin/Operator: manages products, categories, orders, transactions, email settings, templates.
- Supplier (future-facing): limited portal; out of MVP scope for rich features.

**User Journey**
- Account: Login/Register (`/auth/login`, `/auth/register`).
- Browse: Discover products (`/products`) and services (`/services/*`).
- Design: Customize or upload via Design Studio (`/ai-studio/*`).
- Cart: Add items; review cart (sheet/cart contexts).
- Checkout: Provide billing/shipping, select payment, confirm (`/checkout`).
- Payment: Pay via Wompi/PayPal; handle 3DS where applicable (`/payment-3ds`, `/payment-complete`).
- Confirmation: View order status (`/orders/[id]/confirmation`).
- Production: System prepares prints or digital files.
- Shipping/Delivery: Physical shipments with tracking; digital orders available in Downloads (`/digital-downloads`).
- Roadmap: Interactive guide on homepage under hero (component installed).

**Feature Requirements**
- Authentication
  - Register with email confirmation; login with Supabase auth.
  - Forgot/reset password flow.
  - Keep session persistence and redirect appropriately.
- Product Catalog
  - List products, featured products; filter by category.
  - Product details with images, description, price, category and customizable flags.
- Categories Management (Admin)
  - Create/update/delete categories.
  - Use categories in product form and filters.
- Design Studio
  - AI logo/image/font tools (`/ai-studio/*`).
  - Upload files, preview, basic customization; save designs.
- Cart & Checkout
  - Add items (physical/digital), quantity updates.
  - Billing/shipping forms, delivery method selection; support digital-only orders.
  - Taxes and totals display.
- Payments
  - Wompi (card) and PayPal integration (create/capture order, 3DS).
  - Transaction recording and status updates.
- Orders
  - Create order, confirm payment, cancellation option, generate invoice/receipt; order pages.
  - Admin order list and details; transactions view.
- Digital Products & Downloads
  - Generate and validate secure links; download by item/format.
  - Instant availability after successful payment.
- Email Notifications
  - Admin notification on new order; customer order confirmation; status updates.
  - Manage templates and provider settings (Resend). Test send/connection.
- Localization (i18n)
  - English/Spanish with `useLanguage` and `translations` keys.
  - Roadmap content localized.
- Accessibility & UX
  - Keyboard navigable components, visible focus, color contrast, readable copy.
  - Error handling and toasts.

**Admin Portal**
- Navigation links and pages:
  - Dashboard: `/admin`
  - Products: CRUD with image upload; CSV import/export: `/admin/products`
  - Categories: manage via modal in Products page
  - Orders & Transactions: `/admin/orders`, `/admin/transactions`
  - Payments: status/test: `/admin/payments`
  - Email Settings & Templates: `/admin/email-settings`
  - Users, Quotes, Translations, Tenants: pages present for administration

**Key Routes & APIs (examples)**
- Auth pages: `/auth/*`
- Products: `/products`, `/products/[id]`
- Orders: `/orders`, `/orders/[id]`, `/orders/[id]/confirmation`
- Admin APIs: `/api/admin/*` (products import/export, payments, transactions, email settings)
- Payments: `/api/payments/paypal/*`, `/api/payments/wompi/*`, `/api/payments/confirm`
- Email: `/api/email/*` including admin new-order notification
- Digital downloads: `/api/digital-downloads/*`, `/api/downloads/generate-links`

**Data Models (summary)**
- Products: `id, name, description, price, category, image, is_active, is_featured, is_customizable, created_at`
- Categories: `id, name, slug, description, parent_id, image_url, is_active, created_at, updated_at`
- Orders: `id, order_number, user_id, email, status, subtotal, tax, shipping, discount, total, shipping_address, billing_address, payment_method, shipping_method, notes, currency, created_at`
- Order Items: link products/designs/files with quantity and pricing
- User Profiles: `id, first_name, last_name, email, role, status`
- Email Templates & Logs: template metadata and send logs

**Integrations & Environment Variables**
- Supabase
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server)
- Resend
  - `RESEND_API_KEY`
  - `EMAIL_FROM` (optional)
- App URL
  - `NEXT_PUBLIC_SITE_URL` for redirects
- Payments
  - Wompi/PayPal credentials per provider test/production.

**Localization**
- Two languages (en, es) via `useLanguage` context; translations include product, checkout, services and roadmap content.

**Security & Compliance**
- Do not log or store sensitive card data.
- Use HTTPS everywhere; payment providers handle PCI compliance.
- Protect keys via environment variables; avoid client exposure of service keys.
- Validate user access to orders/downloads; secure links.

**Performance & Reliability**
- Static generation for many pages; server-rendered routes where data needed.
- Optimize images; avoid blocking operations; minimal JS for roadmap component.
- Error boundaries and graceful fallbacks.

**Analytics & Observability (future)**
- Track key events: roadmap interactions, add-to-cart, checkout start, payment success, downloads.
- Monitor API errors and latency.

**Deployment & CI/CD**
- Hosted on Vercel; linked via `.vercel/project.json`.
- Production deploy requires authenticated CLI session or token and properly set env vars.

**Acceptance Criteria (samples)**
- Customer can register, confirm email, login and reach the dashboard.
- Browsing shows featured products; adding to cart and checkout flows complete.
- Payment success redirects to confirmation; order state updates; emails sent.
- Digital orders provide a working download link; physical orders show shipping method.
- Admin can manage products, categories, email settings, and view transactions.

**Open Questions / Next Steps**
- Add tracking and analytics to roadmap and checkout funnel.
- Implement order tracking number integration for shipping providers.
- Extend design tooling and asset validation before production.

**Code References (illustrative)**
- Auth provider: `lib/auth-context.tsx:64` sign-in; session initialization `lib/auth-context.tsx:237`.
- Supabase client: `lib/supabase.ts:20` client creation; env usage at `lib/supabase.ts:3–7`.
- Admin products page (categories CRUD): `app/admin/products/page.tsx:812` dialog; `app/admin/products/page.tsx:108–117` load categories.
- Admin email settings: `app/admin/email-settings/page.tsx:454` UI and actions; templates editor at `app/admin/email-settings/page.tsx:683`.
- New-order admin email API: `app/api/email/admin/new-order/route.ts:1`.
- Homepage roadmap: `components/user-roadmap.tsx:1`; integration `app/page.tsx:124`.
