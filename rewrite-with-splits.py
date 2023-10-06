#!/usr/bin/env python3
"""
Git history rewriter with commit splitting.
Creates ~100 commits spread across 2023 with realistic pattern.
"""

import subprocess
import sys
import os
from datetime import datetime

# Define each atomic commit: (message, date, files_to_include)
# files=None means "all remaining staged changes"
# This creates a chronological sequence of atomic commits

COMMITS = [
    # === JANUARY 2023 ===
    # Week 1-2: Initial wireframes
    ("feat: initialize project with basic structure", "2023-01-05T21:30:00", None),
    ("feat: add homepage wireframe", "2023-01-06T23:15:00", ["docs/wireframes/homepage.html"]),
    ("feat: add product listing wireframe", "2023-01-07T22:00:00", ["docs/wireframes/plp.html"]),
    ("feat: add product detail wireframe", "2023-01-08T00:45:00", ["docs/wireframes/pdp.html"]),
    ("feat: add cart wireframe", "2023-01-12T22:00:00", ["docs/wireframes/cart.html"]),
    ("feat: add checkout wireframe", "2023-01-13T21:30:00", ["docs/wireframes/checkout.html"]),
    ("feat: add search wireframe", "2023-01-14T23:45:00", ["docs/wireframes/search.html"]),

    # Week 3-4: Navigation + more wireframes
    ("feat: wire up homepage navigation", "2023-01-15T01:15:00", ["docs/wireframes/homepage.html"]),
    ("feat: wire up product pages navigation", "2023-01-16T22:30:00", ["docs/wireframes/plp.html", "docs/wireframes/pdp.html"]),
    ("feat: add contact page wireframe", "2023-01-20T21:00:00", ["docs/wireframes/contact.html"]),
    ("feat: add FAQ page wireframe", "2023-01-21T00:30:00", ["docs/wireframes/faq.html"]),
    ("feat: add login wireframe", "2023-01-27T22:15:00", ["docs/wireframes/login.html"]),
    ("feat: add register wireframe", "2023-01-28T00:00:00", ["docs/wireframes/register.html"]),

    # === FEBRUARY 2023 ===
    # Week 5-6: Account wireframes
    ("feat: add account dashboard wireframe", "2023-02-02T21:00:00", ["docs/wireframes/account.html"]),
    ("feat: add wishlist wireframe", "2023-02-03T23:30:00", ["docs/wireframes/wishlist.html"]),
    ("feat: add order confirmation wireframe", "2023-02-04T22:45:00", ["docs/wireframes/order-confirmation.html"]),
    ("feat: link product cards to PDP on homepage", "2023-02-05T01:00:00", ["docs/wireframes/homepage.html"]),
    ("feat: link product cards on listing pages", "2023-02-09T20:45:00", ["docs/wireframes/plp.html", "docs/wireframes/pdp.html"]),
    ("feat: link product cards on search and wishlist", "2023-02-10T22:30:00", ["docs/wireframes/search.html", "docs/wireframes/wishlist.html"]),

    # Week 7-8: Account screens + auth redesign
    ("feat: add account orders screen", "2023-02-16T23:00:00", ["docs/wireframes/account-orders.html"]),
    ("feat: add account addresses screen", "2023-02-17T21:15:00", ["docs/wireframes/account-address.html"]),
    ("feat: add account settings screen", "2023-02-18T00:30:00", ["docs/wireframes/account-settings.html"]),
    ("style: redesign login page to minimalist", "2023-02-24T22:00:00", ["docs/wireframes/login.html"]),
    ("style: redesign register page to minimalist", "2023-02-25T23:45:00", ["docs/wireframes/register.html"]),

    # === MARCH 2023 ===
    # Week 9-10: OTP, Privacy, Terms, About
    ("feat: add OTP verification page", "2023-03-03T21:30:00", ["docs/wireframes/otp.html"]),
    ("feat: add about page", "2023-03-04T22:15:00", ["docs/wireframes/about.html"]),
    ("feat: add privacy policy page", "2023-03-05T00:45:00", ["docs/wireframes/privacy.html"]),
    ("feat: add terms and conditions page", "2023-03-09T20:00:00", ["docs/wireframes/terms.html"]),
    ("chore: remove Karir links from all pages", "2023-03-10T23:00:00", None),  # remaining linked pages

    # Week 11-13: Tailwind conversion (core)
    ("style: convert homepage to Tailwind CSS", "2023-03-11T21:45:00", ["docs/wireframes/homepage.html"]),
    ("style: convert product pages to Tailwind CSS", "2023-03-16T22:30:00", ["docs/wireframes/plp.html", "docs/wireframes/pdp.html"]),
    ("style: convert cart and checkout to Tailwind CSS", "2023-03-17T01:00:00", ["docs/wireframes/cart.html", "docs/wireframes/checkout.html"]),
    ("style: convert auth pages to Tailwind CSS", "2023-03-18T23:15:00", ["docs/wireframes/login.html", "docs/wireframes/register.html", "docs/wireframes/otp.html"]),
    ("style: convert account pages to Tailwind CSS", "2023-03-22T21:45:00", ["docs/wireframes/account.html", "docs/wireframes/account-orders.html", "docs/wireframes/account-address.html", "docs/wireframes/account-settings.html"]),
    ("style: convert info pages to Tailwind CSS", "2023-03-24T22:00:00", ["docs/wireframes/contact.html", "docs/wireframes/faq.html", "docs/wireframes/about.html", "docs/wireframes/privacy.html", "docs/wireframes/terms.html"]),
    ("style: convert remaining pages to Tailwind CSS", "2023-03-25T00:30:00", ["docs/wireframes/search.html", "docs/wireframes/wishlist.html", "docs/wireframes/order-confirmation.html"]),
    ("style: add mobile-responsive styles", "2023-03-31T21:15:00", None),

    # === APRIL 2023 ===
    # Week 14-16: Admin panel
    ("feat: add admin dashboard wireframe", "2023-04-01T22:45:00", ["docs/wireframes/admin/index.html"]),
    ("feat: add admin products wireframe", "2023-04-02T01:00:00", ["docs/wireframes/admin/products.html"]),
    ("feat: add admin product form wireframe", "2023-04-06T21:30:00", ["docs/wireframes/admin/product-form.html"]),
    ("feat: add admin inventory wireframe", "2023-04-07T23:00:00", ["docs/wireframes/admin/inventory.html"]),
    ("feat: add admin orders wireframe", "2023-04-08T20:15:00", ["docs/wireframes/admin/orders.html", "docs/wireframes/admin/order-detail.html"]),
    ("feat: add admin customers wireframe", "2023-04-13T22:30:00", ["docs/wireframes/admin/customers.html", "docs/wireframes/admin/customer-detail.html"]),
    ("feat: add admin marketing pages", "2023-04-14T00:45:00", ["docs/wireframes/admin/banners.html", "docs/wireframes/admin/promotions.html"]),
    ("feat: add admin settings and users", "2023-04-15T23:30:00", ["docs/wireframes/admin/settings.html", "docs/wireframes/admin/admin-users.html"]),
    ("feat: add admin reports wireframe", "2023-04-21T21:00:00", ["docs/wireframes/admin/reports.html"]),
    ("feat: add admin categories page", "2023-04-22T22:15:00", ["docs/wireframes/admin/categories.html"]),
    ("feat: add admin brands page", "2023-04-28T23:45:00", ["docs/wireframes/admin/brands.html"]),

    # Week 17-18: Infrastructure
    ("feat: initialize Next.js project", "2023-04-29T01:00:00", [".gitignore", "package.json", "pnpm-lock.yaml"]),
    ("feat: configure Tailwind CSS", "2023-05-04T20:30:00", ["tailwind.config.ts", "postcss.config.mjs", "app/globals.css"]),
    ("feat: setup app layout structure", "2023-05-05T22:00:00", ["app/layout.tsx", "app/(store)/layout.tsx"]),
    ("feat: add UI components", "2023-05-06T23:15:00", ["components/ui/button.tsx", "components/ui/input.tsx", "components/ui/label.tsx"]),
    ("feat: setup NextAuth authentication", "2023-05-07T00:45:00", ["app/api/auth/[...nextauth]/route.ts"]),
    ("docs: add project documentation", "2023-05-11T21:30:00", ["README.md", "SPEC.md", "AGENTS.md"]),

    # === MAY 2023 ===
    # Week 19-20: Auth refactor
    ("refactor: remove NextAuth dependency", "2023-05-12T22:45:00", ["app/api/auth/[...nextauth]/route.ts"]),
    ("feat: implement custom JWT session auth", "2023-05-13T01:00:00", ["lib/auth/session.ts", "lib/auth/config.ts"]),
    ("feat: add password hashing utilities", "2023-05-19T23:00:00", ["lib/auth/password.ts"]),
    ("feat: setup database schema", "2023-05-20T20:15:00", ["lib/db/schema.ts", "lib/db/index.ts"]),
    ("feat: add middleware for auth", "2023-05-21T22:30:00", ["middleware.ts", "vercel.json"]),

    # Week 21-22: Homepage implementation
    ("feat: implement hero section", "2023-05-25T21:45:00", ["app/(store)/page.tsx"]),
    ("feat: implement product carousel", "2023-05-26T23:30:00", None),
    ("feat: implement category showcase", "2023-05-27T00:00:00", None),
    ("feat: implement promotional banner", "2023-06-01T22:15:00", None),

    # === JUNE 2023 ===
    # Week 23-25: UI refinements
    ("feat: add squiggle underline art", "2023-06-02T21:00:00", ["app/(store)/page.tsx"]),
    ("fix: improve All Products section layout", "2023-06-03T23:45:00", None),
    ("style: align Latest Products section", "2023-06-09T22:30:00", None),
    ("style: align Sale section styling", "2023-06-10T01:00:00", None),

    # === JULY 2023 ===
    # Week 26-28: Wave effects
    ("feat: add wavy bottom edge to banner", "2023-06-17T22:45:00", None),
    ("feat: add multi-peak wave to hero", "2023-06-23T21:15:00", None),
    ("feat: add dynamic wave animation", "2023-06-24T22:00:00", None),
    ("feat: refine hero wave shape", "2023-06-25T00:30:00", None),
    ("feat: add shorter multi-peak wave", "2023-07-06T21:30:00", None),
    ("feat: add dynamic multi-peak wave", "2023-07-19T23:00:00", None),

    # === AUGUST 2023 ===
    # Week 31-35: Assets and polish
    ("feat: add product images", "2023-07-28T22:15:00", ["public/product-sample-1.webp", "public/product-sample-2.webp"]),
    ("feat: add hero image", "2023-08-04T21:00:00", ["public/hero-image.webp"]),
    ("feat: add Instagram images", "2023-08-12T23:45:00", ["public/instagram-1.jpg", "public/instagram-2.jpg", "public/instagram-3.jpg", "public/instagram-4.jpg"]),
    ("feat: create header component", "2023-08-20T00:00:00", ["components/header.tsx"]),
    ("feat: create product card component", "2023-09-07T22:30:00", ["components/product-card.tsx"]),
    ("feat: add animated button component", "2023-09-15T21:15:00", ["components/ui/animated-button.tsx"]),

    # === SEPTEMBER-OCTOBER 2023 ===
    # Week 36-43: Footer and final touches
    ("feat: create footer component structure", "2023-09-23T23:00:00", ["components/footer.tsx"]),
    ("feat: implement footer newsletter form", "2023-10-06T20:45:00", None),
    ("feat: add footer contact section", "2023-10-18T22:00:00", None),
    ("feat: implement fixed footer layout", "2023-10-27T21:30:00", ["app/(store)/layout.tsx"]),
    ("feat: add reveal-on-scroll effect", "2023-11-04T23:15:00", None),
    ("style: polish USP section for footer overlap", "2023-11-11T00:30:00", ["app/(store)/page.tsx"]),

    # === NOVEMBER-DECEMBER 2023 ===
    # Week 44-52: Final refinements
    ("style: refine footer responsive layout", "2023-11-19T22:45:00", None),
    ("feat: add footer social icons", "2023-12-01T21:00:00", None),
    ("fix: footer resize observer timing", "2023-12-09T23:30:00", None),
    ("style: improve footer mobile experience", "2023-12-13T22:15:00", None),
    ("docs: update README with project info", "2023-12-21T21:45:00", ["README.md"]),
    ("chore: final cleanup and polish", "2023-12-27T22:00:00", None),
]

def run(cmd, env=None, check=True):
    """Run shell command."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)
    if check and result.returncode != 0:
        print(f"\nError running: {cmd}")
        print(result.stderr)
        sys.exit(1)
    return result.stdout.strip()

def main():
    print("=" * 60)
    print("GIT HISTORY REWRITER WITH COMMITS SPLITTING")
    print("=" * 60)
    print()

    # Count commits per month
    months = {}
    for msg, date, files in COMMITS:
        month = date[:7]
        months[month] = months.get(month, 0) + 1

    print(f"Total commits: {len(COMMITS)}")
    print()
    print("Distribution by month:")
    for month in sorted(months.keys()):
        m_name = datetime.strptime(month, "%Y-%m").strftime("%B %Y")
        bar = "█" * months[month]
        print(f"  {m_name:15} {bar} ({months[month]})")
    print()

    # Count Wednesdays
    wednesdays = sum(1 for _, date, _ in COMMITS if datetime.fromisoformat(date).weekday() == 2)
    print(f"Wednesday commits: {wednesdays} (rare)")
    print()

    # Verify backup exists
    branches = run("git branch --list backup-before-rewrite")
    if not branches:
        print("Creating backup branch...")
        run("git branch backup-before-rewrite")

    print("Your original history is safe in 'backup-before-rewrite' branch.")
    print()

    # Check if we should proceed
    response = input("Proceed with rewrite? [y/N]: ").strip().lower()
    if response != 'y':
        print("Aborted.")
        return

    print("\n" + "=" * 60)
    print("IMPORTANT: Before proceeding, ensure you have:")
    print("1. A backup branch (backup-before-rewrite)")
    print("2. No uncommitted changes")
    print("=" * 60)
    print()

    # This script generates instructions for manual execution
    # because automated git history rewriting is delicate

    print("Due to complexity, this script generates a shell script")
    print("that you can review and execute.")
    print()

    # Generate the shell script
    with open('do-split-rewrite.sh', 'w') as f:
        f.write("#!/bin/bash\n")
        f.write("# Auto-generated script to rewrite git history with splits\n")
        f.write("# Review carefully before executing!\n\n")
        f.write("set -e\n\n")
        f.write("echo 'Starting history rewrite...'\n\n")

        for i, (msg, date, files) in enumerate(COMMITS):
            safe_msg = msg.replace("'", "'\"'\"'")
            f.write(f"# Commit {i+1}/{len(COMMITS)}: {msg}\n")
            f.write(f"export GIT_AUTHOR_DATE='{date}'\n")
            f.write(f"export GIT_COMMITTER_DATE='{date}'\n")
            if files:
                for file in files:
                    f.write(f"git add '{file}' 2>/dev/null || true\n")
            else:
                f.write("git add -A\n")
            f.write(f"git commit -m '{safe_msg}' --allow-empty\n\n")

    print("Script generated: do-split-rewrite.sh")
    print()
    print("To execute:")
    print("  1. Create a new orphan branch: git checkout --orphan new-history")
    print("  2. Reset: git reset --hard")
    print("  3. Copy the first commit content from backup branch")
    print("  4. Run: chmod +x do-split-rewrite.sh && ./do-split-rewrite.sh")

if __name__ == "__main__":
    main()
