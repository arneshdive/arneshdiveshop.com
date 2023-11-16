# Request for Proposal (RFP)
## Arne's Dive Shop E-Commerce Platform - Backend Completion

**Date:** July 12, 2026  
**Project:** Arne's Dive Shop E-Commerce Platform  
**Status:** UI Complete, Backend Required  
**Est. Timeline:** 8-12 weeks  

---

## 1. Executive Summary

Arne's Dive Shop requires the completion of a modern e-commerce platform for selling dive equipment and related products. The frontend user interface has been fully developed. This RFP seeks qualified developers/agencies to implement the backend infrastructure, database integration, authentication system, payment processing, and administrative functionality.

---

## 2. Project Overview

### 2.1 Current State

The project is approximately **40% complete**. The following components are ready:

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend UI (Storefront) | ✅ Complete | Homepage, product listings, cart, checkout flow, account pages |
| Frontend UI (Admin Dashboard) | ✅ Complete | Products, orders, customers, banners, settings pages |
| UI Components Library | ✅ Complete | Radix UI + Tailwind CSS components |
| Responsive Design | ✅ Complete | Mobile-first, works on all devices |
| Backend API Routes | ❌ Missing | No API endpoints implemented |
| Database Schema | ❌ Missing | Not yet designed |
| Database Connection | ❌ Missing | No schema, not connected |
| Authentication System | ❌ Missing | No login/register/validation |
| Payment Integration | ❌ Missing | Midtrans not integrated |
| Admin Functionality | ❌ Missing | CRUD operations not functional |
| Order Processing | ❌ Missing | No order creation/management |
| Email Notifications | ❌ Missing | No transactional emails |
| Deployment Setup | ❌ Missing | Not deployed to production |

### 2.2 Technology Stack

The project uses modern, production-ready technologies:

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Neon serverless) |
| State Management | Zustand + TanStack Query |
| Payment | Midtrans (Indonesia) |
| UI Components | Radix UI primitives |
| Forms | React Hook Form + Zod |

### 2.3 Project Goals

1. **Functional E-Commerce Store** - Customers can browse products, add to cart, checkout, and pay
2. **Admin Dashboard** - Store staff can manage products, orders, customers, and promotions
3. **Payment Processing** - Secure payment via Midtrans (credit cards, bank transfer, e-wallets)
4. **Customer Accounts** - Registration, login, order history, saved addresses
5. **Order Management** - Full order lifecycle from placement to delivery

---

## 3. Scope of Work

### 3.1 Phase 1: Foundation & Authentication (Weeks 1-3)

#### 3.1.1 Database Setup
- [ ] Configure PostgreSQL database connection (Neon serverless)
- [ ] Run database migrations to create all tables
- [ ] Seed initial data (categories, sample products, admin users)
- [ ] Verify all foreign key relationships

#### 3.1.2 Authentication System
- [ ] Implement email/password registration with validation
- [ ] Implement secure login with session management
- [ ] Implement "Forgot Password" flow with email OTP
- [ ] Implement email verification for new accounts
- [ ] Create role-based access control (customer, admin, super_admin)
- [ ] Protect admin routes from unauthorized access
- [ ] Implement secure password hashing (bcrypt/argon2)

#### 3.1.3 API Routes for Auth
```
POST /api/auth/register     - Create new user account
POST /api/auth/login        - Authenticate user
POST /api/auth/logout       - End session
POST /api/auth/forgot-password - Send reset OTP
POST /api/auth/reset-password  - Reset with OTP
POST /api/auth/verify-email - Verify email address
GET  /api/auth/session      - Get current session
```

### 3.2 Phase 2: Product Management (Weeks 3-5)

#### 3.2.1 Public API Routes
```
GET  /api/products              - List all active products
GET  /api/products/[slug]       - Get single product details
GET  /api/categories            - List all categories
GET  /api/categories/[slug]     - Get category with products
GET  /api/search                - Search products by name/description
GET  /api/banners               - Get active banners for homepage
```

#### 3.2.2 Admin API Routes
```
GET    /api/admin/products      - List all products (including inactive)
POST   /api/admin/products      - Create new product
GET    /api/admin/products/[id] - Get product for editing
PUT    /api/admin/products/[id] - Update product
DELETE /api/admin/products/[id] - Soft delete product
POST   /api/admin/products/[id]/images - Upload product images

GET    /api/admin/categories    - List all categories
POST   /api/admin/categories    - Create category
PUT    /api/admin/categories/[id] - Update category
DELETE /api/admin/categories/[id] - Delete category

GET    /api/admin/brands        - List all brands
POST   /api/admin/brands        - Create brand
PUT    /api/admin/brands/[id]   - Update brand
DELETE /api/admin/brands/[id]   - Delete brand

GET    /api/admin/banners       - List all banners
POST   /api/admin/banners       - Create banner
PUT    /api/admin/banners/[id]  - Update banner
DELETE /api/admin/banners/[id]  - Delete banner
```

#### 3.2.3 Product Features
- [ ] Product CRUD with image upload (to cloud storage or local)
- [ ] Product variants (size, color) with individual pricing
- [ ] Category management with hierarchical structure
- [ ] Brand management
- [ ] Product search and filtering
- [ ] Featured products selection
- [ ] Product status (active/inactive)

### 3.3 Phase 3: Shopping Cart & Checkout (Weeks 5-7)

#### 3.3.1 Cart System
- [ ] Server-side cart storage (database) for logged-in users
- [ ] Cart persistence across sessions
- [ ] Add/remove/update cart items
- [ ] Cart item quantity validation
- [ ] Real-time cart total calculation

#### 3.3.2 Checkout Flow
```
POST /api/cart/add          - Add item to cart
POST /api/cart/remove       - Remove item from cart
POST /api/cart/update       - Update item quantity
GET  /api/cart              - Get current cart
DELETE /api/cart            - Clear cart

POST /api/checkout/validate - Validate cart before checkout
POST /api/checkout/shipping - Calculate shipping costs
POST /api/orders            - Create order from cart
GET  /api/orders/[id]       - Get order details
GET  /api/orders            - List user's orders
```

#### 3.3.3 Checkout Features
- [ ] Multi-step checkout process (Contact → Shipping → Payment → Confirm)
- [ ] Shipping address form with validation
- [ ] Indonesia-specific address fields (province, city, postal code)
- [ ] Multiple shipping address storage per customer
- [ ] Order summary review before payment
- [ ] Order confirmation page with details

### 3.4 Phase 4: Payment Integration (Weeks 7-9)

#### 3.4.1 Midtrans Integration
```
POST /api/payment/create    - Create Midtrans transaction
POST /api/payment/webhook   - Handle Midtrans webhook
GET  /api/payment/status/[id] - Check payment status
```

#### 3.4.2 Payment Features
- [ ] Midtrans Snap integration for checkout
- [ ] Support for multiple payment methods:
  - Credit/Debit Cards
  - Bank Transfer (VA)
  - E-wallets (GoPay, OVO, ShopeePay)
  - QRIS
- [ ] Payment status tracking (pending, paid, failed, expired)
- [ ] Webhook handler for payment notifications
- [ ] Automatic order status updates on payment
- [ ] Payment retry for failed transactions
- [ ] Idempotency keys to prevent duplicate charges

### 3.5 Phase 5: Admin Dashboard Completion (Weeks 8-10)

#### 3.5.1 Order Management
```
GET    /api/admin/orders        - List all orders
GET    /api/admin/orders/[id]   - Get order details
PUT    /api/admin/orders/[id]/status - Update order status
POST   /api/admin/orders/[id]/notes - Add admin note
```

#### 3.5.2 Customer Management
```
GET    /api/admin/customers     - List all customers
GET    /api/admin/customers/[id] - Get customer details
PUT    /api/admin/customers/[id] - Update customer info
```

#### 3.5.3 Dashboard Analytics
```
GET /api/admin/dashboard/stats    - Sales statistics
GET /api/admin/dashboard/revenue  - Revenue by period
GET /api/admin/dashboard/top-products - Best selling products
```

#### 3.5.4 Admin Features
- [ ] Order list with filtering (status, date range, search)
- [ ] Order detail view with customer info, items, payment
- [ ] Order status updates (processing, shipped, delivered, cancelled)
- [ ] Customer list with purchase history
- [ ] Dashboard with sales metrics and charts
- [ ] Export orders to CSV/Excel

### 3.6 Phase 6: Additional Features (Weeks 10-12)

#### 3.6.1 Promotions System
```
GET    /api/admin/promotions     - List all promotions
POST   /api/admin/promotions     - Create promotion
PUT    /api/admin/promotions/[id] - Update promotion
DELETE /api/admin/promotions/[id] - Delete promotion
POST   /api/checkout/apply-promo - Apply promo code to order
```

#### 3.6.2 Email Notifications
- [ ] Order confirmation email
- [ ] Payment received email
- [ ] Order shipped email with tracking
- [ ] Welcome email for new registrations
- [ ] Password reset email

#### 3.6.3 Additional Features
- [ ] Product reviews and ratings (optional)
- [ ] Wishlist functionality (optional)
- [ ] Newsletter subscription (optional)
- [ ] Inventory alerts (optional)

---

## 4. Technical Requirements

### 4.1 Security Requirements
- [ ] All API routes must validate authentication
- [ ] Admin routes must check user role
- [ ] Input validation on all forms (Zod schemas)
- [ ] SQL injection prevention (via Drizzle ORM parameterized queries)
- [ ] XSS prevention (React's built-in escaping)
- [ ] CSRF protection for server actions
- [ ] Rate limiting on auth endpoints
- [ ] Secure HTTP-only cookies for sessions
- [ ] Environment variables for all secrets

### 4.2 Performance Requirements
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Optimistic updates for cart operations
- [ ] Image optimization for product photos
- [ ] Static generation for product pages (ISR)
- [ ] Database query optimization with indexes

### 4.3 Data Requirements
- [ ] All prices stored as integer cents (avoid floating-point issues)
- [ ] Order numbers in format: ORD-YYYYMMDD-XXXX
- [ ] Soft deletes for products/customers (not hard deletes)
- [ ] Audit trail for order status changes
- [ ] Idempotency keys for payment operations

---

## 5. Deliverables

### 5.1 Code Deliverables
1. **Complete backend implementation** - All API routes functional
2. **Database migration files** - For production deployment
3. **Seed scripts** - For initial data setup
4. **Test suite** - Unit and integration tests for critical paths
5. **API documentation** - OpenAPI/Swagger spec or equivalent

### 5.2 Documentation Deliverables
1. **Deployment guide** - Step-by-step production deployment
2. **Environment variables list** - All required configuration
3. **Admin user guide** - How to use the dashboard
4. **API reference** - All endpoints documented

### 5.3 Training Deliverables
1. **Admin training session** - 2-hour session for store staff
2. **Handover meeting** - Technical walkthrough for dev team

---

## 6. Acceptance Criteria

The project will be considered complete when:

### Customer Journey
- [ ] Customer can register and verify email
- [ ] Customer can login and manage their account
- [ ] Customer can browse and search products
- [ ] Customer can add items to cart
- [ ] Customer can complete checkout with valid shipping address
- [ ] Customer can pay via Midtrans (in sandbox mode)
- [ ] Customer receives order confirmation
- [ ] Customer can view order history
- [ ] Customer can track order status

### Admin Operations
- [ ] Admin can login to dashboard
- [ ] Admin can create/edit/delete products with images
- [ ] Admin can manage categories and brands
- [ ] Admin can view and process orders
- [ ] Admin can update order status
- [ ] Admin can view customer list
- [ ] Admin can manage homepage banners
- [ ] Admin can create promotion codes

### Technical Validation
- [ ] All TypeScript compiles without errors
- [ ] All tests pass
- [ ] No console errors in browser
- [ ] Production build succeeds
- [ ] Application deployed and accessible
- [ ] Payment webhooks working in sandbox

---

## 7. Database Schema Reference

The following tables are defined and ready:

| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles |
| `customers` | Customer profiles |
| `addresses` | Customer shipping addresses |
| `categories` | Product categories (hierarchical) |
| `brands` | Product brands |
| `products` | Product catalog |
| `product_variants` | Product variations (size, color) |
| `orders` | Customer orders |
| `order_items` | Items within orders |
| `payments` | Payment records |
| `promotions` | Discount codes |
| `banners` | Homepage banner images |
| `verification_tokens` | Email verification OTPs |

---

## 8. Response Requirements

Proposals should include:

### 8.1 Qualifications
- Experience with Next.js App Router and server actions
- Experience with Drizzle ORM and PostgreSQL
- Experience with Midtrans payment integration
- Examples of similar e-commerce projects

### 8.2 Proposed Approach
- Development methodology
- Communication and progress reporting
- Testing strategy
- Deployment plan

### 8.3 Pricing
- Fixed-price or hourly rate
- Payment schedule (milestone-based recommended)
- What is included/excluded

### 8.4 Timeline
- Estimated start date
- Estimated completion date
- Key milestones

### 8.5 Support
- Post-launch support period
- Bug fix warranty
- Maintenance options

---

## 9. Budget Range

**Expected budget range:** IDR 50,000,000 - 100,000,000  
*(approximately USD 3,000 - 6,000)*

This is an estimate based on the scope. Proposals outside this range with strong justification will be considered.

---

## 10. Contact Information

**Primary Contact:** [Your Name]  
**Email:** [Your Email]  
**Phone:** [Your Phone]  
**Project Repository:** Available upon NDA signature  

---

## 11. Timeline

| Milestone | Target Date |
|-----------|-------------|
| RFP Release | July 12, 2026 |
| Proposal Deadline | July 26, 2026 |
| Vendor Selection | August 2, 2026 |
| Development Start | August 5, 2026 |
| Phase 1 Complete | August 26, 2026 |
| Phase 2 Complete | September 16, 2026 |
| Phase 3 Complete | October 7, 2026 |
| Phase 4 Complete | October 21, 2026 |
| Phase 5 Complete | November 4, 2026 |
| Final Delivery | November 18, 2026 |
| Go-Live | November 25, 2026 |

*Dates are tentative and will be finalized with selected vendor.*

---

## 12. Terms and Conditions

1. All code developed becomes property of Arne's Dive Shop
2. Vendor must sign NDA before accessing full codebase
3. Vendor must maintain code confidentiality
4. Late delivery may result in penalty clauses
5. Bug fixes during warranty period included in price
6. Changes to scope require written agreement

---

## Appendix A: UI Screenshots

*(Attach screenshots of completed UI pages)*

- Homepage
- Product listing page
- Product detail page
- Cart page
- Checkout pages
- Account pages
- Admin dashboard
- Admin product management
- Admin order management

---

## Appendix B: Technical Reference Documents

The following documents are available for reference:

1. **SPEC.md** - Full technical specification (47KB)
2. **Database schema** - lib/db/schema.ts
3. **UI components** - components/ directory
4. **Page structure** - app/ directory

These will be shared via the private repository after NDA signature.

---

*End of RFP*
