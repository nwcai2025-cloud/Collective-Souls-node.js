#!/bin/bash

# Frontend Service Script for Collective Souls Platform
# Fixed version - nginx serves the frontend, no dev server needed

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[Frontend]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log "=== Frontend Service Script ==="

# Detect the correct project path
if [ -d "/var/www/collective-souls" ]; then
    PROJECT_ROOT="/var/www/collective-souls"
elif [ -d "$HOME/project/collective-souls-ws-production" ]; then
    PROJECT_ROOT="$HOME/project/collective-souls-ws-production"
elif [ -d "/home/bob/project/collective-souls-ws-production" ]; then
    PROJECT_ROOT="/home/bob/project/collective-souls-ws-production"
else
    error "Could not find project directory"
    exit 1
fi

FRONTEND_DIR="$PROJECT_ROOT/frontend"

log "Frontend directory: $FRONTEND_DIR"

# Check if frontend dist exists
if [ -d "$FRONTEND_DIR/dist" ]; then
    log "✅ Frontend build exists at $FRONTEND_DIR/dist"
else
    warning "Frontend build not found. Attempting to get frontend build..."
    
    # First, try to copy from development location
    DEV_FRONTEND="/home/bob/project/collective-souls-ws-production/frontend"
    if [ -d "$DEV_FRONTEND/dist" ]; then
        log "Copying frontend from development folder..."
        cp -r "$DEV_FRONTEND/dist" "$FRONTEND_DIR/" 2>/dev/null || true
        if [ -d "$FRONTEND_DIR/dist" ]; then
            log "✅ Frontend copied from development folder"
        fi
    fi
    
    # If copy didn't work, try to build
    if [ ! -d "$FRONTEND_DIR/dist" ]; then
        warning "Trying to build frontend..."
        cd "$FRONTEND_DIR"
        npm install 2>/dev/null || true
        npm run build 2>/dev/null || warning "Could not build frontend"
        if [ -d "$FRONTEND_DIR/dist" ]; then
            log "✅ Frontend built successfully"
        fi
    fi
fi

# Check if nginx is installed
if ! command -v nginx &>/dev/null; then
    error "Nginx is not installed"
    exit 1
fi

# Check nginx config
log "Testing nginx configuration..."
if sudo nginx -t 2>/dev/null; then
    log "✅ Nginx configuration is valid"
else
    error "Nginx configuration test failed"
    sudo nginx -t
    exit 1
fi

# Check if nginx is running
if sudo systemctl is-active nginx &>/dev/null; then
    log "✅ Nginx is running"
    
    # Reload nginx to pick up any config changes
    log "Reloading nginx..."
    sudo systemctl reload nginx || sudo systemctl restart nginx
else
    warning "Nginx is not running - starting..."
    sudo systemctl start nginx
    if [ $? -eq 0 ]; then
        log "✅ Nginx started successfully"
    else
        error "Failed to start Nginx"
        exit 1
    fi
fi

# Verify frontend is accessible
log "Verifying frontend is accessible..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Frontend is accessible at http://localhost"
else
    warning "Frontend returned HTTP code: $HTTP_CODE"
fi

# Display access URLs
echo ""
log "========================================="
log "Frontend is served via Nginx"
log "========================================="
log "Access URLs:"
log "  - http://localhost"
log "  - http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost')"
log ""
log "Frontend files: $FRONTEND_DIR/dist"
log ""
log "To restart: sudo systemctl restart nginx"
log "To view logs: sudo tail -f /var/log/nginx/collective-souls_access.log"
log "========================================="

log "=== Frontend Service Complete ==="
