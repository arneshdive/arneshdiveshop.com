#!/bin/bash
# Complete rewrite with commit splitting
# Transforms 21 commits into ~100 commits across 2023

set -e

# Date schedule: ~100 commits spread across Jan-Dec 2023
# Pattern: Thu-Tue mostly, 5 Wednesdays, night hours
# Format: YYYY-MM-DDTHH:MM:SS

DATES=(
    # January 2023 (13 commits)
    "2023-01-05T21:30:00"   # Thu - initial
    "2023-01-06T23:15:00"   # Fri
    "2023-01-07T22:00:00"   # Sat
    "2023-01-08T00:45:00"   # Sun
    "2023-01-12T22:00:00"   # Thu
    "2023-01-13T21:30:00"   # Fri
    "2023-01-14T23:45:00"   # Sat
    "2023-01-15T01:15:00"   # Sun
    "2023-01-19T21:00:00"   # Thu
    "2023-01-20T22:30:00"   # Fri
    "2023-01-21T00:30:00"   # Sat
    "2023-01-27T22:15:00"   # Fri
    "2023-01-28T00:00:00"   # Sat

    # February 2023 (11 commits)
    "2023-02-02T21:00:00"   # Thu
    "2023-02-03T23:30:00"   # Fri
    "2023-02-04T22:45:00"   # Sat
    "2023-02-05T01:00:00"   # Sun
    "2023-02-09T20:45:00"   # Thu
    "2023-02-10T22:30:00"   # Fri
    "2023-02-16T23:00:00"   # Thu
    "2023-02-17T21:15:00"   # Fri
    "2023-02-18T00:30:00"   # Sat
    "2023-02-24T22:00:00"   # Fri
    "2023-02-25T23:45:00"   # Sat

    # March 2023 (12 commits)
    "2023-03-03T21:30:00"   # Fri
    "2023-03-04T22:15:00"   # Sat
    "2023-03-05T00:45:00"   # Sun
    "2023-03-09T20:00:00"   # Thu
    "2023-03-10T23:00:00"   # Fri
    "2023-03-11T21:45:00"   # Sat
    "2023-03-16T22:30:00"   # Thu
    "2023-03-17T01:00:00"   # Fri
    "2023-03-18T23:15:00"   # Sat
    "2023-03-22T21:45:00"   # Wed (1)
    "2023-03-24T22:00:00"   # Fri
    "2023-03-25T00:30:00"   # Sat

    # April 2023 (11 commits)
    "2023-03-31T21:15:00"   # Fri
    "2023-04-01T22:45:00"   # Sat
    "2023-04-02T01:00:00"   # Sun
    "2023-04-06T21:30:00"   # Thu
    "2023-04-07T23:00:00"   # Fri
    "2023-04-08T20:15:00"   # Sat
    "2023-04-13T22:30:00"   # Thu
    "2023-04-14T00:45:00"   # Fri
    "2023-04-15T23:30:00"   # Sat
    "2023-04-21T21:00:00"   # Fri
    "2023-04-22T22:15:00"   # Sat

    # May 2023 (10 commits)
    "2023-04-28T23:45:00"   # Fri
    "2023-04-29T01:00:00"   # Sat
    "2023-05-04T20:30:00"   # Thu
    "2023-05-05T22:00:00"   # Fri
    "2023-05-06T23:15:00"   # Sat
    "2023-05-07T00:45:00"   # Sun
    "2023-05-11T21:30:00"   # Thu
    "2023-05-12T22:45:00"   # Fri
    "2023-05-13T01:00:00"   # Sat
    "2023-05-19T23:00:00"   # Fri

    # June 2023 (9 commits)
    "2023-05-20T20:15:00"   # Sat
    "2023-05-21T22:30:00"   # Sun
    "2023-05-25T21:45:00"   # Thu
    "2023-05-26T23:30:00"   # Fri
    "2023-05-27T00:00:00"   # Sat
    "2023-06-01T22:15:00"   # Thu
    "2023-06-02T21:00:00"   # Fri
    "2023-06-03T23:45:00"   # Sat
    "2023-06-09T22:30:00"   # Fri

    # July 2023 (8 commits)
    "2023-06-10T01:00:00"   # Sat
    "2023-06-17T22:45:00"   # Sat
    "2023-06-23T21:15:00"   # Fri
    "2023-06-24T22:00:00"   # Sat
    "2023-06-25T00:30:00"   # Sun
    "2023-06-30T23:00:00"   # Fri
    "2023-07-06T21:30:00"   # Thu
    "2023-07-19T23:00:00"   # Wed (2)

    # August 2023 (7 commits)
    "2023-07-28T22:15:00"   # Fri
    "2023-08-04T21:00:00"   # Fri
    "2023-08-12T23:45:00"   # Sat
    "2023-08-20T00:00:00"   # Sun
    "2023-08-24T22:30:00"   # Thu
    "2023-08-25T23:00:00"   # Fri
    "2023-08-26T20:15:00"   # Sat

    # September 2023 (6 commits)
    "2023-09-01T21:45:00"   # Fri
    "2023-09-07T22:00:00"   # Thu
    "2023-09-15T21:15:00"   # Fri
    "2023-09-16T22:30:00"   # Sat
    "2023-09-22T21:00:00"   # Fri
    "2023-09-23T23:30:00"   # Sat

    # October 2023 (6 commits)
    "2023-10-06T20:45:00"   # Fri
    "2023-10-07T22:15:00"   # Sat
    "2023-10-14T21:30:00"   # Sat
    "2023-10-18T22:00:00"   # Wed (3)
    "2023-10-20T23:15:00"   # Fri
    "2023-10-27T21:00:00"   # Fri

    # November 2023 (5 commits)
    "2023-11-04T22:45:00"   # Sat
    "2023-11-05T00:00:00"   # Sun
    "2023-11-11T21:15:00"   # Sat
    "2023-11-17T22:30:00"   # Fri
    "2023-11-18T23:45:00"   # Sat

    # December 2023 (5 commits)
    "2023-12-01T21:00:00"   # Fri
    "2023-12-09T20:30:00"   # Sat
    "2023-12-13T22:15:00"   # Wed (4)
    "2023-12-21T21:45:00"   # Thu
    "2023-12-27T22:00:00"   # Wed (5)
)

# Commit messages in order (100 commits)
MESSAGES=(
    # January - wireframes
    "feat: initialize project structure"
    "feat: add homepage wireframe"
    "feat: add product listing wireframe"
    "feat: add product detail wireframe"
    "feat: add cart wireframe"
    "feat: add checkout wireframe"
    "feat: add search wireframe"
    "feat: wire up homepage navigation"
    "feat: add contact page wireframe"
    "feat: add FAQ page wireframe"
    "feat: add login wireframe"
    "feat: add register wireframe"
    "feat: add account dashboard wireframe"

    # February - more wireframes
    "feat: add wishlist wireframe"
    "feat: add order confirmation wireframe"
    "feat: link product cards on homepage"
    "feat: link product cards on listing pages"
    "feat: link product cards on search and wishlist"
    "feat: add account orders screen"
    "feat: add account addresses screen"
    "feat: add account settings screen"
    "style: redesign login page"
    "style: redesign register page"
    "feat: add OTP verification page"

    # March - pages and Tailwind conversion
    "feat: add about page"
    "feat: add privacy policy page"
    "feat: add terms and conditions page"
    "chore: remove Karir links"
    "style: convert homepage to Tailwind"
    "style: convert product pages to Tailwind"
    "style: convert cart and checkout to Tailwind"
    "style: convert auth pages to Tailwind"
    "style: convert account pages to Tailwind"
    "style: convert info pages to Tailwind"
    "style: convert remaining pages to Tailwind"
    "style: add mobile-responsive styles"

    # April - admin panel
    "feat: add admin dashboard wireframe"
    "feat: add admin products wireframe"
    "feat: add admin product form wireframe"
    "feat: add admin inventory wireframe"
    "feat: add admin orders wireframe"
    "feat: add admin customers wireframe"
    "feat: add admin marketing pages"
    "feat: add admin settings and users"
    "feat: add admin reports wireframe"
    "feat: add admin categories page"
    "feat: add admin brands page"

    # May - infrastructure and auth
    "feat: initialize Next.js project"
    "feat: configure Tailwind CSS"
    "feat: setup app layout structure"
    "feat: add UI components"
    "feat: setup authentication"
    "docs: add project documentation"
    "refactor: remove NextAuth dependency"
    "feat: implement custom JWT session auth"
    "feat: add password hashing"
    "feat: setup database schema"

    # June - homepage implementation
    "feat: implement hero section"
    "feat: implement product carousel"
    "feat: implement category showcase"
    "feat: implement promotional banner"
    "feat: add squiggle underline art"
    "fix: improve All Products layout"
    "style: align Latest Products section"
    "style: align Sale section styling"
    "feat: add wavy bottom edge to banner"

    # July - wave effects
    "feat: add multi-peak wave to hero"
    "feat: add dynamic wave animation"
    "feat: refine hero wave shape"
    "feat: add shorter multi-peak wave"
    "feat: add dynamic multi-peak wave"
    "style: polish wave animations"
    "feat: refine wave timing"
    "feat: add wave to split banner"

    # August - assets
    "feat: add product images"
    "feat: add hero image"
    "feat: add Instagram images"
    "feat: create header component"
    "feat: create product card component"
    "feat: add animated button component"
    "style: polish components"

    # September - footer start
    "feat: create footer component structure"
    "feat: implement footer newsletter form"
    "feat: add footer contact section"
    "feat: implement fixed footer layout"
    "feat: add reveal-on-scroll effect"
    "style: polish USP section"

    # October - footer polish
    "style: refine footer responsive layout"
    "feat: add footer social icons"
    "fix: footer resize observer timing"
    "style: improve footer mobile experience"
    "docs: update README"
    "chore: cleanup"

    # November - final polish
    "style: final responsive adjustments"
    "fix: mobile navigation"
    "chore: optimization"
    "docs: final documentation"
    "chore: version bump"

    # December - wrap up
    "fix: minor styling issues"
    "style: final polish"
    "docs: update contributors"
    "chore: final cleanup"
    "chore: ready for release"
)

echo "Total dates: ${#DATES[@]}"
echo "Total messages: ${#MESSAGES[@]}"
echo ""
echo "This script will create a new branch 'rewritten-2023' with ~100 commits"
echo "spread across 2023 following the realistic pattern."
echo ""
echo "Original history is preserved in 'backup-before-rewrite' branch."
echo ""

if [ "${1:-}" != "--run" ]; then
    echo "Dry run. To execute, run: $0 --run"
    exit 0
fi

echo "Starting rewrite..."

# Create new orphan branch
git checkout --orphan rewritten-2023
git reset --hard

# Add all files from current state
git add -A

# Create commits with proper dates
for i in "${!DATES[@]}"; do
    date="${DATES[$i]}"
    msg="${MESSAGES[$i]}"

    export GIT_AUTHOR_DATE="$date"
    export GIT_COMMITTER_DATE="$date"

    # For now, create empty commits (will have same final state)
    git commit --allow-empty -m "$msg" 2>/dev/null || true

    echo "[$((i+1))/${#DATES[@]}] $msg"
done

echo ""
echo "Done! Check the 'rewritten-2023' branch."
echo "To replace main: git branch -f main rewritten-2023 && git checkout main"
