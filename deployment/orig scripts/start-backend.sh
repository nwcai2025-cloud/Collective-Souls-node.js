#!/bin/bash

# Script to check and restart backend service for Collective Souls Platform
# Should be run from WSL Ubuntu environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

log "=== Checking and Restarting Backend Service ==="

# Check PM2 installation
if ! command -v pm2 &>/dev/null; then
    error "PM2 is not installed. Attempting to install..."
    npm config set prefix ~/.npm-global
    export PATH=~/.npm-global/bin:$PATH
    npm install -g --prefix ~/.npm-global pm2
    if ! command -v pm2 &>/dev/null; then
        error "Failed to install PM2. Please install manually: npm install -g pm2"
        exit 1
    fi
    log "PM2 installed successfully"
else
    info "PM2 is installed: $(pm2 --version)"
fi

# Check current processes
log "Current PM2 processes:"
pm2 list

# Check if backend process exists
if pm2 list | grep -q "collective-souls-backend"; then
    info "Backend process found. Checking status..."
    # Attempt to restart if not running
    if pm2 describe collective-souls-backend | grep -q "status.*online"; then
        info "Backend is online. Checking health..."
        DOMAIN=$(grep FRONTEND_URL /var/www/collective-souls/backend/.env | cut -d'=' -f2 | sed 's/https:\/\///')
        if curl -s "http://$DOMAIN:3000/api/health" > /dev/null; then
            log "✅ Backend API is responding"
        else
            error "Backend is online but API not responding. Restarting..."
            pm2 restart collective-souls-backend
            sleep 3
            if curl -s "http://$DOMAIN:3000/api/health" > /dev/null; then
                log "✅ Backend API is now responding"
            else
                error "Backend API still not responding after restart"
            fi
        fi
    else
        warning "Backend is not running. Starting..."
        pm2 start /var/www/collective-souls/ecosystem.config.cjs
    fi
else
    warning "Backend process not found. Starting..."
    pm2 start /var/www/collective-souls/ecosystem.config.cjs
fi

log "=== Checking Logs ==="
log "Recent errors:"
pm2 logs collective-souls-backend --lines 20 2>&1

log "=== Service Status ==="
info "PM2 status:"
pm2 status

info "=== Health Check ==="
DOMAIN=$(grep FRONTEND_URL /var/www/collective-souls/backend/.env | cut -d'=' -f2 | sed 's/https:\/\///')
if curl -s "http://$DOMAIN:3000/api/health" > /dev/null; then
    log "✅ Backend API is responding at http://$DOMAIN:3000/api/health"
else
    error "❌ Backend API is not responding at http://$DOMAIN:3000/api/health"
fi

log "=== Backend Service Check Complete ==="