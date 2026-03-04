#!/bin/bash

# Shutdown Script for Collective Souls Node.js Platform
# Stops both backend (via PM2) and frontend servers (via Nginx)
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

log "=== Stopping Collective Souls Platform ==="

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

# Check if PM2 is installed
log "Checking PM2 installation..."
if ! command -v pm2 >/dev/null 2>&1; then
    warning "PM2 is not installed"
else
    # Check if backend is running
    log "Checking backend status..."
    if pm2 list | grep -q "collective-souls-backend"; then
        log "Stopping backend..."
        if pm2 stop collective-souls-backend; then
            log "✅ Backend stopped successfully"
        else
            error "Failed to stop backend"
        fi
        
        # Ask if user wants to delete the process from PM2 list
        read -p "Do you want to delete the backend process from PM2 list? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if pm2 delete collective-souls-backend; then
                log "✅ Backend process deleted from PM2 list"
            else
                warning "Failed to delete backend process from PM2 list"
            fi
        fi
    else
        warning "Backend is not running"
    fi
fi

# Check if Nginx is running
log "Checking Nginx status..."
if sudo systemctl is-active nginx >/dev/null 2>&1; then
    read -p "Do you want to stop Nginx? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Stopping Nginx..."
        if sudo systemctl stop nginx; then
            log "✅ Nginx stopped successfully"
        else
            error "Failed to stop Nginx"
        fi
    else
        log "Nginx remains running"
    fi
else
    warning "Nginx is not running"
fi

# Check if Redis is running
log "Checking Redis status..."
if sudo systemctl is-active redis-server >/dev/null 2>&1; then
    read -p "Do you want to stop Redis? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Stopping Redis..."
        if sudo systemctl stop redis-server; then
            log "✅ Redis stopped successfully"
        else
            error "Failed to stop Redis"
        fi
    else
        log "Redis remains running"
    fi
else
    warning "Redis is not running"
fi

# Display final status
log "=== Shutdown Complete ==="
echo
echo "========================================"
echo "🛑 Collective Souls Platform is Stopped!"
echo "========================================"
echo

# Display current PM2 status
if command -v pm2 >/dev/null 2>&1; then
    echo "Current PM2 status:"
    pm2 list
    echo
fi

# Display service status
echo "System Service Status:"
if sudo systemctl is-active nginx >/dev/null 2>&1; then
    echo "  - Nginx: Running"
else
    echo "  - Nginx: Stopped"
fi

if sudo systemctl is-active redis-server >/dev/null 2>&1; then
    echo "  - Redis: Running"
else
    echo "  - Redis: Stopped"
fi

echo
echo "Key Services:"
echo "  - Backend: Stopped"
if sudo systemctl is-active nginx >/dev/null 2>&1; then
    echo "  - Frontend (Nginx): Still running"
else
    echo "  - Frontend (Nginx): Stopped"
fi

if sudo systemctl is-active redis-server >/dev/null 2>&1; then
    echo "  - Redis: Still running"
else
    echo "  - Redis: Stopped"
fi

echo
echo "Management commands:"
echo "  - Start everything: ./start-platform.sh"
echo "  - Quick status check: ./test-script.sh"
echo "  - Restart everything: ./restart-platform.sh"
echo "========================================"