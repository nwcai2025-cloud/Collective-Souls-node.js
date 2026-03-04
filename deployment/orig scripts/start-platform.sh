#!/bin/bash

# Startup Script for Collective Souls Node.js Platform
# Starts both backend (via PM2) and frontend servers (via Nginx)
# Includes status checking and error handling

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

log "=== Starting Collective Souls Platform ==="

# Get project root
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")

log "Project root: $PROJECT_ROOT"

# Check WSL environment
WSL_ENV=false
if grep -q "Microsoft" /proc/sys/kernel/osrelease 2>/dev/null; then
    WSL_ENV=true
    log "Running in WSL environment"
fi

# Check PM2 is installed
log "Checking PM2 installation..."
if ! command -v pm2 >/dev/null 2>&1; then
    error "PM2 is not installed. Please run the setup script first."
    exit 1
fi

# Check if Redis is running
log "Checking Redis status..."
if sudo systemctl is-active redis-server >/dev/null 2>&1; then
    log "✅ Redis is running"
else
    log "Redis is not running - starting..."
    if sudo systemctl start redis-server; then
        log "✅ Redis started successfully"
    else
        error "Failed to start Redis"
        exit 1
    fi
fi

# Check if backend is already running
log "Checking backend status..."
if pm2 list | grep -q "collective-souls-backend"; then
    log "Backend is already running"
    PM2_STATUS=$(pm2 status | grep "collective-souls-backend" | awk '{print $8}')
    if [ "$PM2_STATUS" = "online" ]; then
        log "✅ Backend status: Online"
    else
        warning "Backend status: $PM2_STATUS - Restarting..."
        pm2 restart collective-souls-backend
    fi
else
    log "Backend not running - starting..."
    cd /var/www/collective-souls
    if pm2 start ecosystem.config.cjs; then
        log "✅ Backend started successfully"
        pm2 save
    else
        error "Failed to start backend"
        exit 1
    fi
fi

# Check backend health
log "Checking backend health..."
BACKEND_PORT=3000
if curl -f "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
    log "✅ Backend API is responsive"
else
    error "Backend API is not responding on port $BACKEND_PORT"
    PM2_LOG=$(pm2 logs collective-souls-backend --lines 10)
    echo "PM2 Log snippet:"
    echo "$PM2_LOG"
    read -p "Do you want to continue with frontend startup? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if frontend is in production or development mode
log "Checking frontend deployment mode..."
if [ -d "/var/www/collective-souls/frontend/dist" ]; then
    log "✅ Frontend production build found"
    log "Frontend is served via Nginx"
else
    warning "Frontend production build not found"
    log "You may need to run 'npm run build' in frontend directory"
fi

# Check Nginx status
log "Checking Nginx status..."
if sudo systemctl is-active nginx >/dev/null 2>&1; then
    log "✅ Nginx is running"
    if sudo nginx -t >/dev/null 2>&1; then
        log "✅ Nginx configuration is valid"
    else
        warning "Nginx configuration test failed"
        sudo nginx -t
    fi
else
    error "Nginx is not running"
    read -p "Do you want to start Nginx? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if sudo systemctl start nginx; then
            log "✅ Nginx started successfully"
        else
            error "Failed to start Nginx"
        fi
    fi
fi

# Display final status
log "=== Startup Complete ==="
echo
echo "========================================"
echo "🎉 Collective Souls Platform is Running!"
echo "========================================"
echo

# Display PM2 status
echo "Backend (PM2):"
pm2 status collective-souls-backend
echo

# Display access information
echo "Access URLs:"
if [ "$WSL_ENV" = true ]; then
    # For WSL, show both localhost and WSL IP
    WSL_IP=$(hostname -I | awk '{print $1}')
    echo "  - Frontend (Nginx): http://$WSL_IP"
    echo "  - Frontend (Local): http://localhost"
    echo "  - Backend API: http://$WSL_IP:3000"
    echo "  - Backend (Local): http://localhost:3000"
else
    # For production, use configured domain or server IP
    if [ -f "/var/www/collective-souls/backend/.env" ]; then
        DOMAIN=$(grep "FRONTEND_URL" /var/www/collective-souls/backend/.env | cut -d'=' -f2 | sed 's/https?:\/\///')
        if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
            echo "  - Frontend: https://$DOMAIN"
            echo "  - Backend API: https://$DOMAIN/api"
            echo "  - Backend (Direct): http://$DOMAIN:3000"
        fi
    fi
    echo "  - Frontend (Local): http://localhost"
    echo "  - Backend API (Local): http://localhost:3000"
fi

echo
echo "Key Services:"
echo "  - Backend: Running in PM2 cluster mode (2 instances)"
echo "  - Frontend: Served via Nginx from /var/www/collective-souls/frontend/dist"
echo "  - Nginx: Proxying requests to backend and frontend"
echo "  - PM2: Managing backend processes"
echo "  - Redis: Available for caching and socket.io"
echo
echo "Management commands:"
echo "  - Check PM2 logs: pm2 logs collective-souls-backend"
echo "  - Restart backend: pm2 restart collective-souls-backend"
echo "  - Stop backend: pm2 stop collective-souls-backend"
echo "  - View PM2 status: pm2 status"
echo "  - Nginx logs: sudo tail -f /var/log/nginx/collective-souls_error.log"
echo
echo "Quick status check: ./test-script.sh"
echo "Stop everything: ./stop-platform.sh"
echo "Restart everything: ./restart-platform.sh"
echo "========================================"