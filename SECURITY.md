# Security Guidelines

## Protecting API Keys and Secrets

### ✅ DO:
- ✅ Use `.env` files for all sensitive configuration
- ✅ Add `.env` to `.gitignore` (already done)
- ✅ Use `.env.example` files as templates
- ✅ Restrict API keys in Google Cloud Console
- ✅ Use different API keys for development and production
- ✅ Rotate API keys regularly
- ✅ Never commit `.env` files

### ❌ DON'T:
- ❌ Commit `.env` files to Git
- ❌ Hardcode API keys in source code
- ❌ Share API keys in screenshots or documentation
- ❌ Use production API keys in development
- ❌ Expose backend API keys to frontend

## Checklist Before Pushing to GitHub

```bash
# 1. Verify .env files are NOT tracked
git ls-files | grep .env
# Should return nothing

# 2. Verify .env is in .gitignore
cat .gitignore | grep "\.env"
# Should show: .env

# 3. Check for hardcoded secrets
grep -r "your-google-maps-api-key" --exclude-dir=node_modules .
# Should only show .env.example files

# 4. Verify .env.example files exist
ls backend/.env.example frontend/.env.example
# Both should exist
```

## If You Accidentally Committed .env

If you accidentally committed `.env` files, follow these steps:

```bash
# 1. Remove from Git tracking (but keep local file)
git rm --cached backend/.env
git rm --cached frontend/.env

# 2. Commit the removal
git commit -m "Remove .env files from tracking"

# 3. If already pushed, remove from history (DANGEROUS - only if necessary)
# WARNING: This rewrites Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env frontend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# 4. Force push (coordinate with team first!)
# git push origin --force --all
```

## Google Cloud Console Security Settings

### For Frontend API Key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Select your API key
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domain: `http://localhost:5173/*` (development)
   - Add your production domain: `https://yourdomain.com/*`
4. Under "API restrictions":
   - Select "Restrict key"
   - Enable only: "Maps JavaScript API" and "Places API"

### For Backend API Key:
1. Under "Application restrictions":
   - Select "IP addresses"
   - Add your server IP addresses
2. Under "API restrictions":
   - Enable only: "Places API"

## Environment Variables Best Practices

1. **Never** commit real values to `.env.example`
2. **Always** use placeholder values in `.env.example`
3. **Document** required variables in README
4. **Use** different keys for dev/staging/production
5. **Rotate** keys if exposed or compromised

## Additional Security Measures

- Use environment-specific configurations
- Implement rate limiting on API endpoints
- Use HTTPS in production
- Validate and sanitize all user inputs
- Keep dependencies updated
- Use strong JWT secrets (generate with: `openssl rand -base64 32`)

