# Commit Split Plan for 2023

Target: ~100-120 commits across Jan-Dec 2023
Pattern: Thu-Tue mostly, 5 rare Wednesdays, night hours

## Split Strategy

### Commit 1: "Add wireframes for all visitor-facing screens" (empty - initial commit)
→ Keep as 1 commit (foundation)

### Commit 2: "Wire up navigation links" (8 files)
→ Split by page:
- homepage.html
- plp.html + pdp.html
- cart.html + checkout.html
- search.html + contact.html + faq.html

### Commit 3: "Add account-required wireframes" (12 files)
→ Split by feature:
- login.html + register.html
- account.html
- wishlist.html
- order-confirmation.html
- Rest (updates to existing files)

### Commit 4: "Link product cards" (5 files)
→ Split by section:
- homepage.html
- plp.html + pdp.html
- search.html + wishlist.html

### Commit 5: "Add missing account screens" (3 files)
→ Split into 3 commits (one per file)

### Commit 6: "Redesign auth pages" (2 files)
→ Split into 2 commits

### Commit 7: "Add OTP, Privacy, Terms, About" (16 files)
→ Split by feature:
- otp.html
- about.html
- privacy.html + terms.html
- Remove Karir links (multiple files)

### Commit 8: "Convert core wireframes to Tailwind" (8 files)
→ Split by page type:
- homepage.html
- plp.html + pdp.html
- cart.html + checkout.html
- login.html + register.html + otp.html

### Commit 9: "Convert remaining wireframes" (12 files)
→ Split by page type:
- account pages (4 files)
- info pages (contact, faq, about, privacy, terms)
- search.html + wishlist.html + order-confirmation.html

### Commit 10: "Add admin panel wireframes" (13 files)
→ Split by section:
- dashboard (index.html)
- products (products.html, product-form.html, inventory.html)
- orders (orders.html, order-detail.html)
- customers (customers.html, customer-detail.html)
- marketing (banners.html, promotions.html)
- settings + admin-users + reports

### Commit 11: "Add categories and brands admin" (2 files)
→ Split into 2 commits

### Commit 12: "Infrastructure setup" (many files)
→ Split by type:
- Config files (.gitignore, package.json, etc.)
- App structure (layout.tsx, page.tsx)
- Components (ui elements)
- Auth setup (nextauth route)
- Documentation (README, SPEC, AGENTS.md)

### Commit 13: "Replace NextAuth with custom JWT" (10 files)
→ Split by layer:
- Auth config + session
- Database setup
- Password handling
- Middleware + vercel.json

### Commit 14: "Implement homepage" (3 files)
→ Split by section:
- Layout structure
- Hero section
- Product sections
- Footer

### Commit 15: "Add squiggle underline" (many files)
→ Split by type:
- SVG art
- Component updates
- Assets (images)

### Commit 16-21: UI refinements (single files mostly)
→ Keep as is or minor splits

## Estimated Total: ~80-100 commits

## Date Schedule (spread across full year 2023)

See rewrite-with-splits.sh for the full schedule.
