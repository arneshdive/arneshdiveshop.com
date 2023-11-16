# Feature Queue — Arne's Dive Shop E-Commerce Platform

> Projection of `.sandwich/registry/` · 22 features · generated 2026-07-12

## Queue

### Eligible now

| # | ID | Title | Module | Priority | Status | Spec |
|---|----|-------|--------|----------|--------|------|
| 1 | F-001 | Database schema & connection setup | Infrastructure | 26 | 🟡 queued | [specs/F-001.md](specs/F-001.md) |

### Blocked by dependency

| ID | Title | Waiting on | Spec |
|----|-------|------------|------|
| F-002 | Core authentication (registration, login, session, RBAC, rate limiting) | F-001 (Database schema & connection setup) | [specs/F-002.md](specs/F-002.md) |
| F-003 | Email verification (OTP) for new accounts | F-002 (Core authentication (registration, login, session, RBAC, rate limiting)) | [specs/F-003.md](specs/F-003.md) |
| F-004 | Forgot password / reset flow (OTP) | F-002 (Core authentication (registration, login, session, RBAC, rate limiting)) | [specs/F-004.md](specs/F-004.md) |
| F-005 | Product CRUD (images, status, availability, featured) | F-001 (Database schema & connection setup) | [specs/F-005.md](specs/F-005.md) |
| F-006 | Product variants (size, color) with individual pricing | F-005 (Product CRUD (images, status, availability, featured)) | [specs/F-006.md](specs/F-006.md) |
| F-007 | Category management (hierarchical) | F-001 (Database schema & connection setup) | [specs/F-007.md](specs/F-007.md) |
| F-008 | Brand management | F-001 (Database schema & connection setup) | [specs/F-008.md](specs/F-008.md) |
| F-009 | Product search & filtering | F-005 (Product CRUD (images, status, availability, featured)), F-007 (Category management (hierarchical)), F-008 (Brand management) | [specs/F-009.md](specs/F-009.md) |
| F-010 | Server-side shopping cart (persistence, add/remove/update, real-time totals) | F-001 (Database schema & connection setup), F-002 (Core authentication (registration, login, session, RBAC, rate limiting)) | [specs/F-010.md](specs/F-010.md) |
| F-011 | Multi-step checkout flow (guest checkout, auto-registration, confirmation) | F-002 (Core authentication (registration, login, session, RBAC, rate limiting)), F-005 (Product CRUD (images, status, availability, featured)), F-010 (Server-side shopping cart (persistence, add/remove/update, real-time totals)) | [specs/F-011.md](specs/F-011.md) |
| F-012 | Midtrans payment integration (Snap, VA, e-wallets, QRIS, webhook, idempotency) | F-005 (Product CRUD (images, status, availability, featured)), F-011 (Multi-step checkout flow (guest checkout, auto-registration, confirmation)) | [specs/F-012.md](specs/F-012.md) |
| F-013 | Order creation from cart (atomic transaction) | F-005 (Product CRUD (images, status, availability, featured)), F-011 (Multi-step checkout flow (guest checkout, auto-registration, confirmation)), F-012 (Midtrans payment integration (Snap, VA, e-wallets, QRIS, webhook, idempotency)) | [specs/F-013.md](specs/F-013.md) |
| F-014 | Admin order list & detail view | F-002 (Core authentication (registration, login, session, RBAC, rate limiting)), F-013 (Order creation from cart (atomic transaction)) | [specs/F-014.md](specs/F-014.md) |
| F-015 | Order status updates & audit trail | F-014 (Admin order list & detail view) | [specs/F-015.md](specs/F-015.md) |
| F-016 | Export orders to CSV/Excel | F-014 (Admin order list & detail view) | [specs/F-016.md](specs/F-016.md) |
| F-017 | Customer account (profile, order history, saved addresses) | F-002 (Core authentication (registration, login, session, RBAC, rate limiting)), F-013 (Order creation from cart (atomic transaction)) | [specs/F-017.md](specs/F-017.md) |
| F-018 | Admin customer list with purchase history | F-002 (Core authentication (registration, login, session, RBAC, rate limiting)), F-017 (Customer account (profile, order history, saved addresses)) | [specs/F-018.md](specs/F-018.md) |
| F-019 | Admin dashboard (sales metrics, revenue chart, top-selling products) | F-002 (Core authentication (registration, login, session, RBAC, rate limiting)), F-005 (Product CRUD (images, status, availability, featured)), F-013 (Order creation from cart (atomic transaction)) | [specs/F-019.md](specs/F-019.md) |
| F-020 | Promotions (promo code creation, management, application) | F-001 (Database schema & connection setup), F-011 (Multi-step checkout flow (guest checkout, auto-registration, confirmation)) | [specs/F-020.md](specs/F-020.md) |
| F-021 | Homepage banner CRUD & display | F-001 (Database schema & connection setup), F-002 (Core authentication (registration, login, session, RBAC, rate limiting)) | [specs/F-021.md](specs/F-021.md) |
| F-022 | Transactional email notifications (Mailgun) | F-002 (Core authentication (registration, login, session, RBAC, rate limiting)), F-013 (Order creation from cart (atomic transaction)), F-015 (Order status updates & audit trail) | [specs/F-022.md](specs/F-022.md) |

---
