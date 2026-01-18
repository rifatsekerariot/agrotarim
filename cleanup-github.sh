#!/bin/bash

# ============================================
# 🧹 GitHub Repository Cleanup Script
# ============================================
# Removes unused/obsolete files from Git history
# and prepares for clean GitHub push
# ============================================

set -e

echo "============================================"
echo "🧹 GitHub Repository Cleanup"
echo "============================================"
echo ""

# Warning
echo "⚠️  WARNING: This script will:"
echo "   1. Remove deleted files from Git history"
echo "   2. Require force push to GitHub"
echo "   3. Rewrite Git history (collaborators must re-clone)"
echo ""
read -p "Continue? (yes/NO): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "📋 Step 1: Checking current status..."
git status

echo ""
echo "📋 Step 2: Committing any pending changes..."
git add -A
git commit -m "chore: Final cleanup before history rewrite" || echo "Nothing to commit"

echo ""
echo "📋 Step 3: Creating backup branch..."
git branch backup-before-cleanup || echo "Backup branch already exists"

echo ""
echo "🧹 Step 4: Removing obsolete files from history..."

# List of files to remove from Git history (if they exist)
FILES_TO_REMOVE=(
    "autocommit.bat"
    "deploy_sms.sh"
    "install_v2.sh"
    "system_prompt.txt"
    "update_safe.sh"
    "backend/.env.backup"
    "device_api_keys.txt"
)

for file in "${FILES_TO_REMOVE[@]}"; do
    if git log --all --pretty=format: --name-only --diff-filter=A | grep -q "^$file$"; then
        echo "  Removing: $file"
        git filter-branch --force --index-filter \
            "git rm --cached --ignore-unmatch $file" \
            --prune-empty --tag-name-filter cat -- --all
    else
        echo "  Skipping: $file (not in history)"
    fi
done

echo ""
echo "📋 Step 5: Cleaning up refs..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "📋 Step 6: Verifying cleanup..."
REPO_SIZE_BEFORE=$(du -sh .git | cut -f1)
echo "  Repository size: $REPO_SIZE_BEFORE"

echo ""
echo "============================================"
echo "✅ Cleanup Complete!"
echo "============================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Review changes:"
echo "   git log --oneline"
echo ""
echo "2. Force push to GitHub (WARNING: Destructive!):"
echo "   git push origin main --force"
echo ""
echo "3. If something goes wrong, restore backup:"
echo "   git reset --hard backup-before-cleanup"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Notify all collaborators to re-clone after force push"
echo "   - GitHub Actions/Webhooks may need reconfiguration"
echo "   - Protected branches must be temporarily unprotected"
echo ""
