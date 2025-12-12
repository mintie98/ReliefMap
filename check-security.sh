#!/bin/bash

# Security Check Script
# Run this before committing to ensure no secrets are exposed

echo "🔒 Checking for security issues..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check 1: Verify .env files are NOT tracked by Git
echo "1. Checking if .env files are tracked by Git..."
TRACKED_ENV=$(git ls-files 2>/dev/null | grep "\.env$" || true)
if [ -z "$TRACKED_ENV" ]; then
    echo -e "${GREEN}✅ No .env files tracked by Git${NC}"
else
    echo -e "${RED}❌ ERROR: .env files are tracked by Git!${NC}"
    echo "$TRACKED_ENV"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 2: Verify .env is in .gitignore
echo "2. Checking if .env is in .gitignore..."
if grep -q "\.env" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ .env is in .gitignore${NC}"
else
    echo -e "${RED}❌ ERROR: .env is NOT in .gitignore${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 3: Check for hardcoded API keys (common patterns)
echo "3. Checking for hardcoded API keys..."
HARDCODED=$(grep -r "AIza[0-9A-Za-z_-]\{35\}\|your-google-maps-api-key\|your-secret-key-here" --exclude-dir=node_modules --exclude="*.example" --exclude="check-security.sh" . 2>/dev/null || true)
if [ -z "$HARDCODED" ]; then
    echo -e "${GREEN}✅ No hardcoded API keys found${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Potential hardcoded keys found (check if these are placeholders):${NC}"
    echo "$HARDCODED"
fi
echo ""

# Check 4: Verify .env.example files exist
echo "4. Checking for .env.example files..."
if [ -f "backend/.env.example" ] && [ -f "frontend/.env.example" ]; then
    echo -e "${GREEN}✅ .env.example files exist${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: .env.example files missing${NC}"
fi
echo ""

# Check 5: Check if .env files exist locally (should exist but not be tracked)
echo "5. Checking local .env files..."
if [ -f "backend/.env" ] || [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✅ Local .env files exist (good for development)${NC}"
    echo -e "${YELLOW}   Make sure they are NOT committed!${NC}"
else
    echo -e "${YELLOW}⚠️  INFO: No local .env files found (create them from .env.example)${NC}"
fi
echo ""

# Summary
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Security check passed! Safe to commit.${NC}"
    exit 0
else
    echo -e "${RED}❌ Security check failed! Fix errors before committing.${NC}"
    exit 1
fi

