# PhyRISK Platform - Netlify Deployment Guide

## Overview
This guide provides step-by-step instructions to deploy the PhyRISK frontend on Netlify from your GitHub repository.

## Prerequisites
- GitHub account with access to the phyrisk-platform repository
- Netlify account (free at https://netlify.com)
- Node.js 18.17.0 or higher installed locally (for testing)

## Deployment Method 1: Using Netlify Web UI

### Step 1: Connect Your GitHub Repository

1. Go to https://app.netlify.com/start
2. Click "Import an existing project"
3. Select "GitHub" as your Git provider
4. Authorize Netlify to access your GitHub account when prompted
5. Select "shashwatpathak002-glitch/phyrisk-platform" from the list
6. Click "Next"

### Step 2: Configure Build Settings

When prompted for build configuration:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Base directory**: Leave empty (or set to frontend if using monorepo)

### Step 3: Set Environment Variables

Before deploying, add environment variables:

1. In Netlify UI: Go to Site Settings → Build & deploy → Environment
2. Add the following variables:
   ```
   VITE_API_URL=https://api.phyrisk.com  (replace with your API endpoint)
   NODE_VERSION=18.17.0
   ```

### Step 4: Deploy

1. Click "Deploy site"
2. Netlify will automatically:
   - Clone your repository
   - Install dependencies with `npm install`
   - Build the project with `npm run build`
   - Deploy the `dist` folder to the CDN

## Deployment Method 2: Using Netlify CLI (Local Testing)

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Build Locally

```bash
cd frontend
npm install
npm run build
```

### Step 3: Deploy from Local Machine

```bash
netlify deploy --prod --dir=dist
```

Follow the prompts to authenticate and complete deployment.

## Configuration Files

### netlify.toml
The `netlify.toml` file in the repository root contains:
- Build command configuration
- Environment variables
- Security headers (CSP, HSTS, etc.)
- Redirect rules for SPA routing
- CORS configuration

### Key Configuration Details

**Build Settings**:
```toml
[build]
command = "npm run build"
publish = "dist"
```

**Environment**:
```toml
[build.environment]
VITE_API_URL = "https://api.phyrisk.com"
NODE_VERSION = "18.17.0"
```

**SPA Routing**:
```toml
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

**Security Headers**:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: enabled
- HSTS: enabled (1 year)
- Content-Security-Policy: configured

## Continuous Deployment

Once connected, Netlify automatically:
- Deploys on every push to the `main` branch
- Creates preview deployments for pull requests
- Sends deployment notifications
- Automatically rollbacks if needed

## Post-Deployment Checklist

- [ ] Verify site loads at your Netlify domain
- [ ] Test all major features in production
- [ ] Check browser console for errors
- [ ] Verify API connectivity
- [ ] Test mobile responsiveness
- [ ] Confirm security headers are present
- [ ] Set up custom domain (if needed)
- [ ] Enable HTTPS (automatic with Netlify)
- [ ] Configure DNS records for custom domain

## Custom Domain Setup

1. In Netlify: Go to Site Settings → Domain management
2. Click "Add custom domain"
3. Enter your domain name
4. Update DNS records at your registrar:
   - Add CNAME record pointing to your Netlify subdomain
   - Or use Netlify DNS for easier management
5. Verify domain connection

## Troubleshooting

### Build Failures
- Check build logs in Netlify UI (Deploys → logs)
- Verify `npm run build` works locally
- Ensure all dependencies are in package.json
- Check for missing environment variables

### API Connection Issues
- Verify VITE_API_URL is correctly set
- Check CORS configuration on backend
- Ensure backend is accessible from frontend domain

### SPA Routing Issues
- netlify.toml redirect rule should handle all routes
- Verify `[[redirects]]` section is correct
- Clear browser cache if needed

## Performance Optimization

### Netlify Features to Enable
- Asset optimization
- Image CDN integration
- Functions for serverless backend
- Analytics plugin

### Build Optimization
- Ensure tree-shaking is enabled in Vite
- Use code splitting for large bundles
- Compress images before deployment
- Lazy load non-critical components

## Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **API Keys**: Store in Netlify environment, not in code
3. **HTTPS**: Automatic with Netlify
4. **Headers**: CSP and other security headers configured
5. **API Security**: Use CORS appropriately

## Backend API Integration

The frontend expects the backend API at the URL defined in VITE_API_URL:

```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

Ensure your backend is:
- Deployed and accessible
- Configured with proper CORS headers
- Using HTTPS
- Responding to health checks

## Monitoring & Logs

### Netlify Dashboard
- Deploys tab: View all deployment history
- Analytics: Monitor site performance
- Functions: Check serverless function logs
- Notifications: Set up deployment alerts

### Debugging
- Netlify Functions logs
- Browser console (F12)
- Network tab for API calls
- Netlify Analytics plugin

## Rollback Procedures

If deployment causes issues:

1. Go to Netlify Deploys
2. Find the previous working deployment
3. Click "Publish deploy" to activate
4. Fix the issue locally
5. Push corrected code to GitHub

## Contact & Support

- **Netlify Support**: https://support.netlify.com
- **Documentation**: https://docs.netlify.com
- **GitHub Issues**: Report issues in the repository

## Next Steps

After frontend deployment:
1. Deploy backend (see DEPLOYMENT_CONFIGURATION.md)
2. Configure backend API endpoint
3. Set up monitoring and logging
4. Configure CI/CD pipeline
5. Set up automated testing

---

**Last Updated**: January 2025
**Maintained By**: Shashwat Pathak
