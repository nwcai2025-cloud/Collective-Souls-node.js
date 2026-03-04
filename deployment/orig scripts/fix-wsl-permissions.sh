#!/bin/bash

# WSL Permissions Fix Script for Collective Souls Node.js Platform
# This script fixes "Permission denied" errors in WSL environment
# Focuses on Node.js binary permissions without modifying source code

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log "=== WSL Permissions Fix ==="

# Check WSL environment
if ! grep -q "Microsoft" /proc/sys/kernel/osrelease 2>/dev/null; then
    warning "Not running in WSL environment - this script is designed for WSL"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Get project root
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")

log "Project root: $PROJECT_ROOT"

# Fix Node.js binary permissions
log "Fixing Node.js binary permissions..."

# Fix frontend node_modules permissions
if [ -d "$PROJECT_ROOT/frontend/node_modules/.bin" ]; then
    log "Fixing frontend node_modules permissions..."
    chmod +x $PROJECT_ROOT/frontend/node_modules/.bin/* 2>/dev/null || true
    
    # Check for critical build tool binaries
    for bin in tsc vite vite.cmd tsc.cmd; do
        if [ -f "$PROJECT_ROOT/frontend/node_modules/.bin/$bin" ]; then
            log "✅ $bin executable permissions fixed"
        else
            warning "$bin binary not found - run 'npm install' first"
        fi
    done
else
    warning "frontend/node_modules/.bin directory not found"
    read -p "Install dependencies first? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd $PROJECT_ROOT/frontend && npm install
        chmod +x $PROJECT_ROOT/frontend/node_modules/.bin/* 2>/dev/null || true
    fi
fi

# Fix backend node_modules permissions
if [ -d "$PROJECT_ROOT/backend/node_modules/.bin" ]; then
    log "Fixing backend node_modules permissions..."
    chmod +x $PROJECT_ROOT/backend/node_modules/.bin/* 2>/dev/null || true
fi

# Ensure both frontend and backend package.json have correct permissions
chmod 644 $PROJECT_ROOT/frontend/package.json $PROJECT_ROOT/backend/package.json 2>/dev/null || true
log "✅ Package.json permissions fixed"

# Configure npm permissions
log "Configuring npm for WSL..."
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'

if ! grep -q "npm-global" ~/.bashrc; then
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
    log "Added npm-global to PATH"
fi

# Source the updated bashrc
export PATH=~/.npm-global/bin:$PATH

# Fix npm cache permissions
log "Fixing npm cache permissions..."
sudo chown -R $USER:$USER ~/.npm 2>/dev/null || true

# Fix project file permissions
log "Fixing project file permissions..."
chown -R $USER:$USER $PROJECT_ROOT 2>/dev/null || true
chmod -R 755 $PROJECT_ROOT 2>/dev/null || true
chmod +x $PROJECT_ROOT/deployment/*.sh 2>/dev/null || true

# Test TypeScript compilation
log "Testing TypeScript compilation..."
cd $PROJECT_ROOT/frontend
if ./node_modules/.bin/tsc --noEmit; then
    log "✅ TypeScript compilation test passed"
else
    error "❌ TypeScript compilation test failed"
    log "Attempting to install dependencies..."
    npm install --force
    if ./node_modules/.bin/tsc --noEmit; then
        log "✅ TypeScript compilation test passed after reinstall"
    else
        error "❌ TypeScript compilation test failed"
        exit 1
    fi
fi

# Test Vite build
log "Testing Vite build..."
if npm run build; then
    log "✅ Vite build test passed"
else
    error "❌ Vite build test failed"
    log "Attempting to reinstall dependencies..."
    rm -rf node_modules package-lock.json
    npm install
    if npm run build; then
        log "✅ Vite build test passed after reinstall"
    else
        error "❌ Vite build test failed"
        exit 1
    fi
fi

# Verify nginx configuration permissions
log "Checking Nginx configuration permissions..."
if [ -f "/etc/nginx/sites-available/collective-souls" ]; then
    nginx_user=$(stat -c %U:%G /etc/nginx/sites-available/collective-souls 2>/dev/null || echo "unknown")
    nginx_perms=$(stat -c %a /etc/nginx/sites-available/collective-souls 2>/dev/null || echo "unknown")
    log "Nginx config user: $nginx_user"
    log "Nginx config permissions: $nginx_perms"
    if [ "$nginx_perms" != "644" ]; then
        sudo chmod 644 /etc/nginx/sites-available/collective-souls 2>/dev/null || true
        log "Fixed Nginx config permissions to 644"
    fi
else
    warning "Nginx configuration file not found"
fi

log "WSL permissions fix complete!"
echo
echo "========================================"
echo "🎉 WSL Permissions Fix Completed!"
echo "========================================"
echo
echo "Key Fixes Applied:"
echo "1. Node.js binary permissions fixed (vite, tsc, etc.)"
echo "2. npm permissions configured"
echo "3. Project file permissions set"
echo "4. TypeScript compilation tested"
echo "5. Vite build tested"
echo
echo "Next Steps:"
echo "1. Run the environment test to verify:"
echo "   cd $PROJECT_ROOT/deployment && ./test-environment.sh"
echo
echo "2. For production deployment:"
echo "   cd $PROJECT_ROOT/deployment && ./ubuntu-setup-production.sh"
echo
echo "Important: If permissions issues persist,"
echo "  - Restart your WSL terminal"
echo "  - Or run 'wsl --shutdown' from Windows"
echo "========================================"