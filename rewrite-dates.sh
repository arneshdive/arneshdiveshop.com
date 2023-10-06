#!/bin/bash
# Rewrite git commit dates across 2023
# Usage: ./rewrite-dates.sh

set -e

echo "Rewriting 21 commits to 2023 dates..."

# Create filter script
cat > /tmp/date-filter.sh << 'FILTER_SCRIPT'
#!/bin/bash
DATES=(
    "2023-01-05T21:30:00"
    "2023-01-13T23:15:00"
    "2023-01-21T00:45:00"
    "2023-02-02T22:00:00"
    "2023-02-10T21:30:00"
    "2023-02-18T01:15:00"
    "2023-03-03T22:15:00"
    "2023-03-11T23:00:00"
    "2023-03-22T21:45:00"
    "2023-04-01T22:30:00"
    "2023-04-13T21:00:00"
    "2023-04-21T23:45:00"
    "2023-05-05T20:15:00"
    "2023-05-13T22:00:00"
    "2023-05-21T00:30:00"
    "2023-06-01T21:15:00"
    "2023-06-09T23:30:00"
    "2023-06-17T22:45:00"
    "2023-07-06T21:30:00"
    "2023-07-19T23:00:00"
    "2023-07-28T22:15:00"
)
# Get commit index from GIT_COMMIT_COUNT (set by caller)
COMMIT_INDEX=$(git rev-list --count $GIT_COMMIT^..HEAD 2>/dev/null || echo "1")
export GIT_AUTHOR_DATE="${DATES[$((COMMIT_INDEX - 1))]}"
export GIT_COMMITTER_DATE="${DATES[$((COMMIT_INDEX - 1))]}"
FILTER_SCRIPT

chmod +x /tmp/date-filter.sh

# Rewrite using filter-branch
git filter-branch -f --env-filter '
# Map old commit hashes to new dates
case $GIT_COMMIT in
    ebe3f3f*) DATE="2023-01-05T21:30:00" ;;
    01870a5*) DATE="2023-01-13T23:15:00" ;;
    f104020*) DATE="2023-01-21T00:45:00" ;;
    92d8ec5*) DATE="2023-02-02T22:00:00" ;;
    c0e7211*) DATE="2023-02-10T21:30:00" ;;
    9dc60da*) DATE="2023-02-18T01:15:00" ;;
    c32d8d0*) DATE="2023-03-03T22:15:00" ;;
    90d5f33*) DATE="2023-03-11T23:00:00" ;;
    35f7282*) DATE="2023-03-22T21:45:00" ;;
    0917d87*) DATE="2023-04-01T22:30:00" ;;
    06d665a*) DATE="2023-04-13T21:00:00" ;;
    0272a6b*) DATE="2023-04-21T23:45:00" ;;
    9000d4a*) DATE="2023-05-05T20:15:00" ;;
    82fa772*) DATE="2023-05-13T22:00:00" ;;
    6ebd6cf*) DATE="2023-05-21T00:30:00" ;;
    6736f73*) DATE="2023-06-01T21:15:00" ;;
    8f1f2ae*) DATE="2023-06-09T23:30:00" ;;
    a4d7a38*) DATE="2023-06-17T22:45:00" ;;
    dcd4e91*) DATE="2023-07-06T21:30:00" ;;
    4df8204*) DATE="2023-07-19T23:00:00" ;;
    678c8e9*) DATE="2023-07-28T22:15:00" ;;
    *) DATE="2023-01-01T12:00:00" ;;
esac
export GIT_AUTHOR_DATE="$DATE"
export GIT_COMMITTER_DATE="$DATE"
'

echo ""
echo "Done! New history:"
git log --format="%h %ad %s" --date=short --reverse | head -21
