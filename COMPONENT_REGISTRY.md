# Odeta Component Registry
# Version: 1.0.0
# The AI reads this file to decide which components to install.
# To add a new component: copy any entry and fill in the fields.

---

## COMPONENT: better-auth-ui
NAME: Better Auth UI
CATEGORY: auth
COMMAND: pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json
TRIGGERS: auth, authentication, login, sign in, sign up, register, user accounts, password reset, oauth, social login, sessions, protected routes
WHAT_IT_INCLUDES: Sign in, sign up, forgot password, reset password, email verification, OAuth buttons, session management
WHEN_TO_USE: Any time users need to create accounts or log in. Install first if auth is needed.
ENV_VARS_NEEDED: BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL
CREDITS_COST: 2

---

## COMPONENT: stripe-ui
NAME: Stripe Payments UI
CATEGORY: payment
COMMAND: pnpm dlx shadcn@latest add https://stripe-ui-component.desishub.com/r/stripe-ui-component.json
TRIGGERS: payment, payments, stripe, billing, subscription, checkout, pricing, paid plan, charge, invoice payment, credit card, purchase
WHAT_IT_INCLUDES: Pricing table, checkout flow, subscription management, billing portal, payment history
WHEN_TO_USE: Any time the app needs to accept money. Requires better-auth-ui first.
ENV_VARS_NEEDED: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
CREDITS_COST: 2

---

## COMPONENT: file-storage
NAME: File Storage UI
CATEGORY: storage
COMMAND: pnpm dlx shadcn@latest add https://file-storage-registry.vercel.app/r/file-storage.json
TRIGGERS: file upload, image upload, upload, storage, avatar, profile picture, document, attachment, media, photos, files
WHAT_IT_INCLUDES: File upload UI, drag-and-drop, progress bar, image preview, direct-to-R2 upload
WHEN_TO_USE: Any time users need to upload files, images, or documents.
ENV_VARS_NEEDED: CLOUDFLARE_R2_BUCKET, CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY
CREDITS_COST: 2

---

## COMPONENT: data-table
NAME: Data Table (TanStack)
CATEGORY: data
COMMAND: pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json
TRIGGERS: table, data table, list view, sortable, filterable, pagination, grid view, records, CRUD list, management list, admin table
WHAT_IT_INCLUDES: TanStack Table with column sorting, filtering, pagination, column visibility, row selection
WHEN_TO_USE: Any list of data that needs sorting, filtering, or pagination.
ENV_VARS_NEEDED: none
CREDITS_COST: 2

---

## COMPONENT: multi-step-form
NAME: Multi-Step Form
CATEGORY: form
COMMAND: pnpm dlx shadcn@latest add https://jb.desishub.com/r/multi-step-form.json
TRIGGERS: multi step, wizard, onboarding, stepper, step by step form, setup wizard, registration wizard
WHAT_IT_INCLUDES: Stepper UI, per-step validation, back/next navigation, progress bar
WHEN_TO_USE: Onboarding flows, complex forms with 3+ sections, setup wizards.
ENV_VARS_NEEDED: none
CREDITS_COST: 2

---

## COMPONENT: zustand-cart
NAME: Zustand Shopping Cart
CATEGORY: ecommerce
COMMAND: pnpm dlx shadcn@latest add https://jb.desishub.com/r/zustand-cart.json
TRIGGERS: cart, shopping cart, add to cart, ecommerce, shop, store, products, checkout cart, basket
WHAT_IT_INCLUDES: Cart state (Zustand), cart drawer, add/remove/update quantity, cart total
WHEN_TO_USE: Any e-commerce or store feature. Pair with stripe-ui for checkout.
ENV_VARS_NEEDED: none
CREDITS_COST: 2

---

## COMPONENT: consent-manager
NAME: Cookie Consent Manager
CATEGORY: legal
COMMAND: pnpm dlx shadcn@latest add https://jb.desishub.com/r/consent-manager.json
TRIGGERS: GDPR, cookie consent, privacy, cookie banner, analytics consent, EU compliance
WHAT_IT_INCLUDES: Cookie consent banner, granular consent controls, localStorage persistence
WHEN_TO_USE: Any app that uses analytics or serves EU users.
ENV_VARS_NEEDED: none
CREDITS_COST: 2

---

## COMPONENT: tag-input
NAME: Tag Input
CATEGORY: form
COMMAND: pnpm dlx shadcn@latest add https://jb.desishub.com/r/tag-input.json
TRIGGERS: tags, labels, categories input, multi-value input, chips, keywords, skills input
WHAT_IT_INCLUDES: Tag creation/deletion, keyboard navigation, max tags, custom validation
WHEN_TO_USE: Skills lists, category assignment, keyword tagging.
ENV_VARS_NEEDED: none
CREDITS_COST: 2

---

## COMPONENT: searchable-select
NAME: Searchable Select
CATEGORY: form
COMMAND: pnpm dlx shadcn@latest add https://jb.desishub.com/r/searchable-select.json
TRIGGERS: searchable dropdown, combobox, autocomplete select, filterable dropdown, typeahead
WHAT_IT_INCLUDES: Searchable dropdown with keyboard navigation, async search support
WHEN_TO_USE: Any dropdown with 10+ options where search helps.
ENV_VARS_NEEDED: none
CREDITS_COST: 2

---

## COMPONENT: testimonial
NAME: Testimonials
CATEGORY: marketing
COMMAND: pnpm dlx shadcn@latest add https://jb.desishub.com/r/testimonial.json
TRIGGERS: testimonials, reviews, social proof, customer quotes, feedback, ratings, trust signals
WHAT_IT_INCLUDES: Testimonial cards, avatar, rating stars, carousel/grid layout
WHEN_TO_USE: Landing pages, about pages — social proof sections.
ENV_VARS_NEEDED: none
CREDITS_COST: 2

---

## COMPONENT: copy-button
NAME: Copy to Clipboard Button
CATEGORY: ui
COMMAND: pnpm dlx shadcn@latest add https://jb.desishub.com/r/copy-button.json
TRIGGERS: copy, clipboard, copy to clipboard, share code, copy link, API key copy
WHAT_IT_INCLUDES: Copy button with checkmark feedback
WHEN_TO_USE: API key displays, code snippets, invite links.
ENV_VARS_NEEDED: none
CREDITS_COST: 2

---

## COMPONENT: currency-input
NAME: Currency Input
CATEGORY: form
COMMAND: pnpm dlx shadcn@latest add https://jb.desishub.com/r/currency-input.json
TRIGGERS: currency, price input, money input, amount, dollar, price field
WHAT_IT_INCLUDES: Formatted currency input, locale support, min/max validation
WHEN_TO_USE: Any form that accepts money amounts.
ENV_VARS_NEEDED: none
CREDITS_COST: 2

---

## COMPONENT: glow-card-grid
NAME: Glow Card Grid
CATEGORY: marketing
COMMAND: pnpm dlx shadcn@latest add https://jb.desishub.com/r/glow-card-grid.json
TRIGGERS: features section, feature cards, glow effect, animated cards, marketing features
WHAT_IT_INCLUDES: Responsive card grid with interactive glow/spotlight effect on hover
WHEN_TO_USE: Landing page features sections.
ENV_VARS_NEEDED: none
CREDITS_COST: 2

---

## COMPONENT: scroll-fade-effect
NAME: Scroll Fade Effect
CATEGORY: marketing
COMMAND: pnpm dlx shadcn@latest add https://jb.desishub.com/r/scroll-fade-effect.json
TRIGGERS: scroll animation, fade in on scroll, scroll reveal, animate on scroll, entrance animation
WHAT_IT_INCLUDES: Intersection Observer-based fade/slide animations on scroll
WHEN_TO_USE: Landing pages, marketing sections.
ENV_VARS_NEEDED: none
CREDITS_COST: 2

---

# COMPONENT SELECTION RULES:
# - ALWAYS prefer a component command over writing code from scratch
# - Install the MINIMUM components needed
# - Check ENV_VARS_NEEDED and add those to the project env vars
# - Install components IN ORDER: auth → data → form → ui → marketing
# - Never install two components that do the same thing
