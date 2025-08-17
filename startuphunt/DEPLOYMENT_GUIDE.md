# 🚀 LaunchIT Production Deployment Guide

## 🎯 Overview
This guide will walk you through deploying LaunchIT to production on Netlify with all optimizations enabled.

## 📋 Prerequisites
- ✅ Node.js 18+ installed
- ✅ Git repository set up
- ✅ Netlify account
- ✅ Supabase project configured
- ✅ AI backend deployed

## 🔐 Step 1: Environment Variables

### Create `.env.production` file:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# AI Backend API URL
VITE_API_URL=https://launchit-ai-backend.onrender.com

# Environment
VITE_ENV=production

# Optional: Google Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### ⚠️ Important:
- Never commit `.env.production` to git
- Use production URLs only (no localhost)
- Verify all API keys are correct

## 🏗️ Step 2: Production Build

### Option A: Automated Deployment
```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Run production deployment
./deploy.sh
```

### Option B: Manual Build
```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Build for production
npm run build

# Verify build output
ls -la dist/
```

## 🌐 Step 3: Netlify Deployment

### Option A: Netlify CLI (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod --dir=dist
```

### Option B: Netlify Dashboard
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Drag & drop `dist/` folder
3. Configure domain settings

## ⚙️ Step 4: Netlify Configuration

### Your `netlify.toml` is already configured:
```toml
[build]
  base = "/"
  command = "cd startuphunt && npm install && npm run build"
  publish = "startuphunt/dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

### Additional Netlify Settings:
1. **Domain Management**: Configure `launchit.site`
2. **SSL/TLS**: Enable HTTPS (automatic with Netlify)
3. **Build Hooks**: Set up automatic deployments
4. **Environment Variables**: Add production env vars in Netlify dashboard

## 🔍 Step 5: Post-Deployment Verification

### ✅ Check List:
- [ ] Site loads without errors
- [ ] All pages accessible
- [ ] Authentication working
- [ ] File uploads functional
- [ ] API calls successful
- [ ] Mobile responsive
- [ ] Performance optimized

### 🧪 Testing Commands:
```bash
# Test production build locally
npm run preview

# Check for console errors
# Open browser dev tools and check console

# Test all user flows
# - Registration/Login
# - Project submission
# - File uploads
# - Search functionality
```

## 📊 Step 6: Monitoring & Analytics

### Google Analytics Setup:
1. Create Google Analytics account
2. Get tracking ID (G-XXXXXXXXXX)
3. Add to `.env.production`
4. Uncomment GA script in `index.html`

### Performance Monitoring:
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [GTmetrix](https://gtmetrix.com/)

## 🚨 Troubleshooting

### Common Issues:

#### Build Fails:
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check for syntax errors
npm run lint
```

#### Environment Variables:
```bash
# Verify .env.production exists
ls -la .env.production

# Check variable names match config.js
grep -r "VITE_" src/
```

#### Large Bundle Size:
```bash
# Analyze bundle
npm run build
# Check dist/ folder sizes

# Optimize imports
# Use dynamic imports for large components
```

## 🔄 Continuous Deployment

### GitHub Integration:
1. Connect Netlify to GitHub repository
2. Set build command: `cd startuphunt && npm install && npm run build`
3. Set publish directory: `startuphunt/dist`
4. Enable automatic deployments on push

### Branch Deployments:
- `main` → Production
- `dev` → Preview deployment
- `feature/*` → Branch previews

## 📈 Performance Optimization

### Current Optimizations:
- ✅ Code splitting implemented
- ✅ Terser minification enabled
- ✅ Console logs removed in production
- ✅ Bundle size optimized
- ✅ PWA manifest configured
- ✅ SEO meta tags optimized

### Further Optimizations:
- [ ] Image compression (WebP format)
- [ ] CDN implementation
- [ ] Service worker for caching
- [ ] Lazy loading for images
- [ ] Critical CSS inlining

## 🎉 Success Metrics

### Target Performance:
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Bundle Size Targets:
- **Total JS**: < 500KB (gzipped)
- **Total CSS**: < 100KB (gzipped)
- **Images**: < 1MB total

## 📞 Support

### If you encounter issues:
1. Check the [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)
2. Review build logs in Netlify
3. Check browser console for errors
4. Verify environment variables
5. Test locally with `npm run preview`

---

**🚀 Your LaunchIT application is now ready for production!**

Remember to:
- Monitor performance metrics
- Set up error tracking
- Configure backups
- Plan for scaling
- Regular security updates 