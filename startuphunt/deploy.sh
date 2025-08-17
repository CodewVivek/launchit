#!/bin/bash

# 🚀 LaunchIT Production Deployment Script
# This script automates the production build and deployment process

set -e  # Exit on any error

echo "🚀 Starting LaunchIT Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the startuphunt directory."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ is required. Current version: $(node --version)"
    exit 1
fi
print_success "Node.js version: $(node --version)"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production file not found. Please create it with production environment variables."
    print_status "Required variables:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_ANON_KEY"
    echo "  - VITE_API_URL"
    echo "  - VITE_ENV=production"
fi

# Clean previous build
print_status "Cleaning previous build..."
rm -rf dist/
print_success "Clean completed"

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false
print_success "Dependencies installed"

# Run linting
print_status "Running ESLint..."
if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting found issues. Continuing with build..."
fi

# Build for production
print_status "Building for production..."
npm run build
print_success "Production build completed"

# Check build output
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not created"
    exit 1
fi

# Check bundle sizes
print_status "Analyzing bundle sizes..."
BUNDLE_SIZE=$(du -sh dist/assets/ | head -1 | cut -f1)
print_success "Bundle size: $BUNDLE_SIZE"

# Check for large files
find dist/assets/ -name "*.js" -size +500k | while read file; do
    print_warning "Large file detected: $(basename "$file") ($(du -h "$file" | cut -f1))"
done

# Validate HTML
print_status "Validating HTML..."
if command -v html-validate &> /dev/null; then
    html-validate dist/index.html || print_warning "HTML validation issues found"
else
    print_status "html-validate not installed. Skipping HTML validation."
fi

# Check for common production issues
print_status "Checking for production issues..."

# Check for localhost URLs
if grep -r "localhost" dist/ > /dev/null 2>&1; then
    print_error "Found localhost URLs in build output!"
    grep -r "localhost" dist/
    exit 1
fi

# Check for development environment variables
if grep -r "development" dist/ > /dev/null 2>&1; then
    print_warning "Found 'development' references in build output"
fi

print_success "Production build validation completed"

# Optional: Deploy to Netlify (if netlify-cli is installed)
if command -v netlify &> /dev/null; then
    print_status "Netlify CLI found. Deploying to Netlify..."
    if netlify deploy --prod --dir=dist; then
        print_success "Deployed to Netlify successfully!"
    else
        print_error "Netlify deployment failed"
        exit 1
    fi
else
    print_status "Netlify CLI not found. Manual deployment required."
    print_status "Build files are ready in the 'dist' directory"
fi

# Final status
echo ""
print_success "🎉 Production deployment completed successfully!"
echo ""
print_status "Next steps:"
echo "  1. Upload dist/ contents to your hosting provider"
echo "  2. Configure your domain and SSL"
echo "  3. Set up monitoring and analytics"
echo "  4. Test all functionality in production"
echo "  5. Monitor error rates and performance"
echo ""
print_status "Build files location: $(pwd)/dist/"
print_status "Total build time: $(($SECONDS)) seconds" 