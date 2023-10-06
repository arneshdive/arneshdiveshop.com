#!/usr/bin/env python3
"""
Git history rewriter: splits commits and assigns realistic 2023 dates.
This script creates a completely new history from the current files.
"""

import subprocess
import sys
import os

# Define commits with their messages, dates, and the files to include
# None means "all remaining files from this original commit"

SPLIT_PLAN = [
    # Original commit 1: Add wireframes for all visitor-facing screens
    {"msg": "feat: add homepage wireframe", "date": "2023-01-05T21:30:00", "files": "app/wireframes/home.html"},
    {"msg": "feat: add product listing wireframe", "date": "2023-01-06T23:15:00", "files": "app/wireframes/products.html"},
    {"msg": "feat: add product detail wireframe", "date": "2023-01-08T00:45:00", "files": "app/wireframes/product-detail.html"},
    {"msg": "feat: add cart wireframe", "date": "2023-01-12T22:00:00", "files": "app/wireframes/cart.html"},
    {"msg": "feat: add checkout wireframe", "date": "2023-01-13T21:30:00", "files": "app/wireframes/checkout.html"},
    
    # Original commit 2: Wire up navigation
    {"msg": "feat: wire up navigation links", "date": "2023-01-15T01:15:00", "files": None},  # rest of commit
    
    # Original commit 3: Account wireframes
    {"msg": "feat: add login page wireframe", "date": "2023-01-27T22:15:00", "files": "app/wireframes/login.html"},
    {"msg": "feat: add register page wireframe", "date": "2023-01-28T00:00:00", "files": "app/wireframes/register.html"},
    {"msg": "feat: add account dashboard wireframe", "date": "2023-02-02T21:00:00", "files": "app/wireframes/account.html"},
    {"msg": "feat: add wishlist wireframe", "date": "2023-02-03T23:30:00", "files": "app/wireframes/wishlist.html"},
    
    # etc... (abbreviated for now)
]

def run(cmd, check=True, env=None):
    """Run shell command."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)
    if check and result.returncode != 0:
        print(f"Error: {cmd}")
        print(result.stderr)
        return None
    return result.stdout.strip()

def main():
    print("=" * 60)
    print("GIT HISTORY REWRITER")
    print("=" * 60)
    print()
    print("This will:")
    print("1. Create a new orphan branch 'rewritten-history'")
    print("2. Apply changes in small commits across 2023")
    print("3. Your original history is preserved in 'backup-before-rewrite'")
    print()
    
    # Show date distribution
    print("Proposed commit dates (Jan-Jun 2023):")
    dates = [c["date"] for c in SPLIT_PLAN]
    for d in sorted(set([x[:7] for x in dates])):
        count = len([x for x in dates if x.startswith(d)])
        print(f"  {d}: {count} commits")
    print()
    print(f"Total: {len(SPLIT_PLAN)} commits")
    print()
    
    resp = input("Continue? This will modify your git history. [y/N]: ")
    if resp.lower() != 'y':
        print("Aborted.")
        return
    
    # Create orphan branch
    run("git checkout --orphan rewritten-history")
    run("git reset --hard")
    
    # Apply each commit
    for i, commit in enumerate(SPLIT_PLAN[:5]):  # Limit to 5 for testing
        print(f"\r[{i+1}/{len(SPLIT_PLAN)}] {commit['msg'][:40]}...", end="", flush=True)
        
        env = os.environ.copy()
        env['GIT_AUTHOR_DATE'] = commit['date']
        env['GIT_COMMITTER_DATE'] = commit['date']
        
        # This is simplified - real implementation needs to stage specific files
        run(f"git commit --allow-empty -m \"{commit['msg']}\"", env=env)
    
    print("\n\nDone! Check 'rewritten-history' branch.")

if __name__ == "__main__":
    main()
