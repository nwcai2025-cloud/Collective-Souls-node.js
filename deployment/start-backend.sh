#!/bin/bash

# Script to check and restart backend service for Collective Souls Platform
# Fixed version - no hanging on checks

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

log "=== Checking Backend Service ==="

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

log "Project root: $PROJECT_ROOT"

# ========================================
# REDIS CHECK
# ========================================
log "Checking Redis status..."

# Check if Redis is installed
if ! command -v redis-server &>/dev/null; then
    warning "Redis is not installed"
else
    if sudo systemctl is-active redis-server &>/dev/null; then
        if redis-cli ping &>/dev/null; then
            log "✅ Redis is running and responding"
        else
            warning "Redis service running but not responding - restarting..."
            sudo systemctl restart redis-server
            sleep 2
            if redis-cli ping &>/dev/null; then
                log "✅ Redis restarted successfully"
            else
                error "Failed to restart Redis"
            fi
        fi
    else
        warning "Redis not running - starting..."
        sudo systemctl start redis-server
        sleep 2
        if sudo systemctl is-active redis-server &>/dev/null; then
            log "✅ Redis started successfully"
        else
            error "Failed to start Redis"
        fi
    fi
fi

# Check if PM2 is installed
if ! command -v pm2 &>/dev/null; then
    error "PM2 is not installed"
    exit 1
fi

# Check if backend is already running
BACKEND_RUNNING=$(pm2 list | grep "collective-souls-backend" | grep -c "online" || echo 0)

if [ "$BACKEND_RUNNING" -gt 0 ]; then
    log "Backend is already running in PM2"
    pm2 status collective-souls-backend
else
    log "Backend not running - checking ecosystem config..."
    BACKEND_DIR="$PROJECT_ROOT/backend"
    if [ -f "$PROJECT_ROOT/ecosystem.config.cjs" ]; then
        cd "$PROJECT_ROOT"
        pm2 start ecosystem.config.cjs
        log "Backend started"
        pm2 save
    elif [ -f "$BACKEND_DIR/ecosystem.config.cjs" ]; then
        cd "$BACKEND_DIR"
        pm2 start ecosystem.config.cjs
        log "Backend started"
        pm2 save
    else
        # Fallback: start directly from backend directory
        log "Ecosystem config not found, starting from backend directory"
        cd "$BACKEND_DIR"
        pm2 start server.js --name "collective-souls-backend"
        pm2 save
    fi
fi

# Quick health check (max 5 seconds)
log "Performing quick health check..."
HEALTH_RESPONSE=$(curl -s --max-time 5 http://localhost:3004/api/health 2>/dev/null || echo "timeout")

if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    log "✅ Backend API is responding at http://localhost:3004/api/health"
else
    error "Backend API health check failed or timed out"
    error "Response: $HEALTH_RESPONSE"
    log "Checking PM2 logs..."
    pm2 logs collective-souls-backend --lines 10 --nostream
fi

log "=== Backend Service Check Complete ==="
