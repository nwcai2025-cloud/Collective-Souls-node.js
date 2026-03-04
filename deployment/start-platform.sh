#!/bin/bash

# Platform Startup Script for Collective Souls
# Fixed version - starts backend (PM2) and frontend (Nginx) without hanging

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

log "=========================================="
log "  Collective Souls Platform Startup"
log "=========================================="

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

BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

log "Project root: $PROJECT_ROOT"

# ========================================
# REDIS STARTUP
# ========================================
log ""
log "=== Starting Redis ==="

# Check if Redis is installed
if ! command -v redis-server &>/dev/null; then
    error "Redis is not installed"
else
    # Check if Redis is running
    if sudo systemctl is-active redis-server &>/dev/null; then
        log "✅ Redis is running"
        
        # Quick ping check
        if redis-cli ping &>/dev/null; then
            log "✅ Redis responded to PING"
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

# ========================================
# BACKEND STARTUP (PM2)
# ========================================
log ""
log "=== Starting Backend (PM2) ==="

# Check if PM2 is installed
if ! command -v pm2 &>/dev/null; then
    error "PM2 is not installed. Install with: npm install -g pm2"
    exit 1
fi

# Check if backend is already running
BACKEND_RUNNING=$(pm2 list | grep "collective-souls-backend" | grep -c "online" || echo 0)

if [ "$BACKEND_RUNNING" -gt 0 ]; then
    log "✅ Backend is already running"
    pm2 status collective-souls-backend
else
    log "Backend not running - starting..."
    
    # Try ecosystem.config.cjs first
    if [ -f "$PROJECT_ROOT/ecosystem.config.cjs" ]; then
        cd "$PROJECT_ROOT"
        pm2 start ecosystem.config.cjs
        pm2 save
    elif [ -f "$BACKEND_DIR/ecosystem.config.cjs" ]; then
        cd "$BACKEND_DIR"
        pm2 start ecosystem.config.cjs
        pm2 save
    else
        # Fallback: start server.js directly
        cd "$BACKEND_DIR"
        pm2 start server.js --name "collective-souls-backend"
        pm2 save
    fi
    
    log "✅ Backend started"
fi

# Quick health check (max 5 seconds)
log "Checking backend health..."
sleep 2
HEALTH_RESPONSE=$(curl -s --max-time 5 http://localhost:3004/api/health 2>/dev/null || echo "timeout")

if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    log "✅ Backend API is responding at http://localhost:3004"
else
    warning "Backend may still be starting or health check timed out"
    warning "Response: $HEALTH_RESPONSE"
fi

# ========================================
# FRONTEND STARTUP (Nginx)
# ========================================
log ""
log "=== Starting Frontend (Nginx) ==="

# Check if frontend dist exists
if [ -d "$FRONTEND_DIR/dist" ]; then
    log "✅ Frontend build exists"
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

# Check nginx
if ! command -v nginx &>/dev/null; then
    error "Nginx is not installed"
else
    # Check if nginx is running
    if sudo systemctl is-active nginx &>/dev/null; then
        log "✅ Nginx is running"
        
        # Quick reload
        sudo systemctl reload nginx 2>/dev/null || true
    else
        warning "Nginx not running - attempting to start..."
        sudo systemctl start nginx 2>/dev/null || warning "Could not start nginx"
    fi
fi

# Verify frontend
log "Verifying frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Frontend is accessible at http://localhost"
else
    warning "Frontend returned HTTP code: $HTTP_CODE (may still be starting)"
fi

# ========================================
# SUMMARY
# ========================================
echo ""
log "=========================================="
log "  Platform Status"
log "=========================================="
echo ""
echo "Backend:"
pm2 status collective-souls-backend 2>/dev/null || echo "  PM2 status unavailable"
echo ""
echo "Frontend:"
echo "  - URL: http://localhost"
echo "  - Served by: Nginx"
echo "  - Files: $FRONTEND_DIR/dist"
echo ""
echo "API:"
echo "  - URL: http://localhost/api"
echo "  - Backend port: 3004"
echo ""
log "=========================================="
log "  Platform Started Successfully!"
log "=========================================="
