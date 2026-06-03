#!/bin/bash

# Setup script for deploying to Render.com
# This script helps you prepare your app for deployment

echo "================================"
echo "Local Problem Reporter Deployment Setup"
echo "================================"
echo ""

# Step 1: Initialize Git if needed
if [ ! -d ".git" ]; then
    echo "[1/5] Initializing Git repository..."
    git init
else
    echo "[1/5] Git repository already initialized"
fi

# Step 2: Check if GitHub remote exists
if git remote | grep -q "^origin$"; then
    echo "[2/5] GitHub remote already configured"
    echo "     To change it, run: git remote set-url origin <your-repo-url>"
else
    echo "[2/5] No GitHub remote found"
    echo "     Run this to add your GitHub repo:"
    echo "     git remote add origin https://github.com/YOUR_USERNAME/local-problem-reporter.git"
fi

# Step 3: Create .env files
echo "[3/5] Environment files created:"
echo "     - frontend/.env.local (for local development)"
echo "     - frontend/.env.production (for Render/Vercel)"
echo "     - backend/runtime.txt (Python version for Render)"

# Step 4: Show Git status
echo ""
echo "[4/5] Files ready for deployment:"
git status --short

# Step 5: Next steps
echo ""
echo "[5/5] Next steps:"
echo "     1. Create GitHub repo: https://github.com/new"
echo "     2. Run: git remote add origin https://github.com/YOUR_USERNAME/local-problem-reporter.git"
echo "     3. Run: git add . && git commit -m 'Ready for deployment'"
echo "     4. Run: git push -u origin main"
echo "     5. Go to https://render.com and connect your GitHub repo"
echo ""
echo "================================"
echo "Setup complete! Ready to deploy."
echo "================================"
