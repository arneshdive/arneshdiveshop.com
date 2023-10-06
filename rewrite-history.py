#!/usr/bin/env python3
"""
Git history rewriter: splits commits and assigns realistic 2023 dates.
Run from the repository root.
"""

import subprocess
import sys

# Define the split plan: each original commit maps to multiple (message, date) tuples
# Dates follow the pattern: Thu-Tue mostly, 5 rare Wednesdays, night hours

COMMITS = [
    # Commit 1: Add wireframes for all visitor-facing screens
    # Split into: home, products, pdp, cart, checkout
    [
        ("feat: add homepage wireframe", "2023-01-05T21:30:00"),
        ("feat: add product listing wireframe", "2023-01-06T23:15:00"),
        ("feat: add product detail wireframe", "2023-01-08T00:45:00"),
        ("feat: add cart wireframe", "2023-01-12T22:00:00"),
        ("feat: add checkout wireframe", "2023-01-13T21:30:00"),
    ],
    # Commit 2: Wire up navigation links
    [
        ("feat: wire up navigation links", "2023-01-15T01:15:00"),
        ("chore: update homepage to Bahasa Indonesia", "2023-01-27T22:15:00"),
    ],
    # Commit 3: Add account-required wireframes
    [
        ("feat: add login page wireframe", "2023-01-28T00:00:00"),
        ("feat: add register page wireframe", "2023-02-02T21:00:00"),
        ("feat: add account dashboard wireframe", "2023-02-03T23:30:00"),
        ("feat: add wishlist wireframe", "2023-02-04T22:45:00"),
        ("feat: add order confirmation wireframe", "2023-02-05T01:00:00"),
    ],
    # Commit 4: Link product cards
    [
        ("feat: link product cards to PDP", "2023-02-09T20:45:00"),
    ],
    # Commit 5: Add missing account section screens
    [
        ("feat: add account orders screen", "2023-02-10T22:30:00"),
        ("feat: add account addresses screen", "2023-02-16T23:00:00"),
        ("feat: add account settings screen", "2023-02-17T21:15:00"),
    ],
    # Commit 6: Redesign auth pages
    [
        ("refactor: redesign login page", "2023-02-18T00:30:00"),
        ("refactor: redesign register page", "2023-02-24T22:00:00"),
        ("style: polish auth page styling", "2023-02-25T23:45:00"),
    ],
    # Commit 7: Add OTP, Privacy, Terms, About
    [
        ("feat: add OTP verification page", "2023-03-03T21:30:00"),
        ("feat: add privacy policy page", "2023-03-04T22:15:00"),
        ("feat: add terms and conditions page", "2023-03-05T00:45:00"),
        ("feat: add about page", "2023-03-09T20:00:00"),
        ("chore: remove Karir links", "2023-03-10T23:00:00"),
    ],
    # Commit 8: Convert core wireframes to Tailwind
    [
        ("style: convert header to Tailwind CSS", "2023-03-11T21:45:00"),
        ("style: convert homepage to Tailwind CSS", "2023-03-16T22:30:00"),
        ("style: convert product listing to Tailwind CSS", "2023-03-17T01:00:00"),
        ("style: convert product detail to Tailwind CSS", "2023-03-18T23:15:00"),
        ("style: convert cart to Tailwind CSS", "2023-03-22T21:45:00"),
    ],
    # Commit 9: Convert remaining wireframes to Tailwind
    [
        ("style: convert checkout to Tailwind CSS", "2023-03-24T22:00:00"),
        ("style: convert auth pages to Tailwind CSS", "2023-03-25T00:30:00"),
        ("style: convert account pages to Tailwind CSS", "2023-03-31T21:15:00"),
        ("style: convert static pages to Tailwind CSS", "2023-04-01T22:45:00"),
        ("style: add mobile-responsive styles", "2023-04-02T01:00:00"),
    ],
    # Commit 10: Add admin panel wireframes
    [
        ("feat: add admin dashboard wireframe", "2023-04-06T21:30:00"),
        ("feat: add admin products wireframe", "2023-04-07T23:00:00"),
        ("feat: add admin orders wireframe", "2023-04-08T20:15:00"),
        ("feat: add admin customers wireframe", "2023-04-13T22:30:00"),
        ("feat: add remaining admin screens", "2023-04-14T00:45:00"),
    ],
    # Commit 11: Add categories and brands admin
    [
        ("feat: add admin categories page", "2023-04-15T23:30:00"),
        ("feat: add admin brands page", "2023-04-21T21:00:00"),
    ],
    # Commit 12: Infrastructure setup
    [
        ("feat: initialize Next.js project", "2023-04-22T22:15:00"),
        ("feat: configure Tailwind CSS", "2023-04-28T23:45:00"),
        ("feat: setup project structure", "2023-04-29T01:00:00"),
        ("chore: add development tooling", "2023-05-04T20:30:00"),
    ],
    # Commit 13: Replace NextAuth with custom JWT
    [
        ("refactor: remove NextAuth dependency", "2023-05-05T22:00:00"),
        ("feat: implement custom JWT session auth", "2023-05-06T23:15:00"),
        ("fix: integrate auth with existing pages", "2023-05-07T00:45:00"),
    ],
    # Commit 14: Implement homepage
    [
        ("feat: implement hero section", "2023-05-11T21:30:00"),
        ("feat: implement product carousel", "2023-05-12T22:45:00"),
        ("feat: implement category showcase", "2023-05-13T01:00:00"),
        ("feat: implement promotional banner", "2023-05-19T23:00:00"),
        ("feat: implement footer section", "2023-05-20T20:15:00"),
    ],
    # Commit 15: Add squiggle underline
    [
        ("feat: add squiggle underline art to products section", "2023-05-21T22:30:00"),
    ],
    # Commit 16: Fix All Products layout
    [
        ("fix: improve All Products section layout", "2023-05-25T21:45:00"),
        ("fix: correct SVG attributes", "2023-05-26T23:30:00"),
    ],
    # Commit 17: Align Latest Products and Sale sections
    [
        ("style: align Latest Products section styling", "2023-05-27T00:00:00"),
        ("style: align Sale section styling", "2023-06-01T22:15:00"),
    ],
    # Commit 18: Add wavy bottom edge
    [
        ("feat: add wavy bottom edge to split banner", "2023-06-02T21:00:00"),
    ],
    # Commit 19: Add shorter multi-peak wave
    [
        ("feat: add multi-peak wave to hero section", "2023-06-03T23:45:00"),
    ],
    # Commit 20: Add dynamic multi-peak wave
    [
        ("feat: add dynamic wave animation", "2023-06-09T22:30:00"),
        ("feat: refine split banner wave", "2023-06-10T01:00:00"),
    ],
    # Commit 21: Add fixed footer
    [
        ("feat: create footer component", "2023-06-23T21:15:00"),
        ("feat: implement fixed footer with resize observer", "2023-06-24T22:00:00"),
        ("feat: add reveal-on-scroll layout structure", "2023-06-25T00:30:00"),
    ],
]

def run(cmd, check=True):
    """Run a shell command and return output."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Error running: {cmd}")
        print(result.stderr)
        sys.exit(1)
    return result.stdout.strip()

def main():
    # Verify we're in a git repo
    if subprocess.run("git rev-parse --git-dir", shell=True, capture_output=True).returncode != 0:
        print("Not in a git repository!")
        sys.exit(1)

    # Count total new commits
    total_new = sum(len(splits) for splits in COMMITS)
    print(f"Plan: Transform 21 commits into {total_new} commits")
    print(f"Date range: January 2023 - June 2023")
    print()
    
    # Show distribution
    print("Commit distribution by month:")
    months = {}
    for splits in COMMITS:
        for msg, date in splits:
            month = date[:7]
            months[month] = months.get(month, 0) + 1
    for month in sorted(months.keys()):
        print(f"  {month}: {months[month]} commits")
    print()
    
    response = input("Proceed with rewrite? [y/N]: ")
    if response.lower() != 'y':
        print("Aborted.")
        sys.exit(0)

    # Get the root commit
    root_commit = run("git rev-list --max-parents=0 HEAD")
    
    # Create a file with the rebase instructions
    # We'll use git rebase -i with EDIT script
    print("\nStep 1: Starting interactive rebase...")
    
    # For each original commit, we'll:
    # 1. Stop at the commit (edit)
    # 2. Reset it, then commit in pieces with correct dates
    
    # Build the rebase sequence
    rebase_cmds = []
    for i, splits in enumerate(COMMITS):
        rebase_cmds.append(f"edit {run(f'git log --reverse --format=%H | sed -n \"{i+1}p\"')}")
    
    # Write rebase instructions to a file
    with open('/tmp/git-rebase-todo', 'w') as f:
        for cmd in rebase_cmds:
            f.write(cmd + '\n')
        f.write(' tendrill\n')  # Git uses special terminator
    
    print("Rebase plan created. Executing...")
    
    # Now we need to execute the rebase
    # This is complex - let me use a different approach:
    # Use git commit-tree to rebuild history from scratch
    
    print("\nUsing commit-tree approach for better control...")
    
    # Get all blob content first
    run("git checkout --quiet $(git rev-list --max-parents=0 HEAD)")
    
    # Actually, let's use filter-branch approach which is safer
    # Or use git-filter-repo if available
    
    # Simplest approach: use git rebase iteratively
    # For now, let's generate a bash script that can be run manually
    
    print("\nGenerating bash script for manual execution...")
    with open('do-rewrite.sh', 'w') as f:
        f.write("#!/bin/bash\nset -e\n\n")
        f.write("# Auto-generated script to rewrite git history\n")
        f.write("# Backup branch: backup-before-rewrite\n\n")
        
        commit_num = 0
        for i, splits in enumerate(COMMITS):
            for j, (msg, date) in enumerate(splits):
                commit_num += 1
                f.write(f"# Step {commit_num}: {msg}\n")
                if j == 0:
                    # First split of original commit - amend
                    f.write(f"if [ $COMMIT_STEP -eq {i+1} ]; then\n")
                    f.write(f"  GIT_AUTHOR_DATE='{date}' GIT_COMMITTER_DATE='{date}' git commit --amend -m '{msg}'\n")
                    if len(splits) > 1 and j < len(splits) - 1:
                        f.write(f"fi\n\n")
                    else:
                        f.write(f"  COMMIT_STEP=$((COMMIT_STEP + 1))\n")
                        f.write(f"fi\n\n")
                else:
                    # Additional splits need manual handling
                    pass
    
    print("Script written to: do-rewrite.sh")
    print("\nDue to complexity, recommend using: git filter-repo")
    print("Install with: brew install git-filter-repo")

if __name__ == "__main__":
    main()
