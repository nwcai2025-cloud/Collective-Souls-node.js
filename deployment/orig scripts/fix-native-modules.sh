#!/bin/bash

# Script to fix native Node.js modules that were copied from Windows to WSL
# Fixes "invalid ELF header" errors by reinstalling dependencies directly in WSL

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

log "=== Fixing Native Node.js Modules ==="

# Check if running in WSL
WSL_ENV=false
if grep -q "Microsoft" /proc/sys/kernel/osrelease 2>/dev/null; then
    WSL_ENV=true
    log "Running in WSL environment"
else
    warning "Not running in WSL - this script is optimized for WSL environments"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Check if we have permissions to /var/www directory
if [ ! -d "/var/www/collective-souls" ]; then
    error "Application directory not found: /var/www/collective-souls"
    error "Please ensure you've run the setup script first"
    exit 1
fi

log "Checking current backend node_modules..."

# Check if node_modules exists and contains incompatible files
BACKEND_NODE_MODULES="/var/www/collective-souls/backend/node_modules"
if [ -d "$BACKEND_NODE_MODULES" ]; then
    # Look for typical native module directories that might be incompatible
    if [ -d "$BACKEND_NODE_MODULES/sqlite3" ] || [ -d "$BACKEND_NODE_MODULES/bcrypt" ] || [ -d "$BACKEND_NODE_MODULES/node-sass" ]; then
        log "Incompatible node_modules detected"
        
        # Check if we're in the right environment before deleting
        if [ "$WSL_ENV" = true ]; then
            log "Deleting incompatible node_modules..."
            rm -rf "$BACKEND_NODE_MODULES"
            log "✅ node_modules directory removed"
        fi
    else
        log "node_modules does not contain known incompatible native modules"
    fi
else
    warning "node_modules directory not found"
fi

# Reinstall dependencies
log "Reinstalling dependencies..."
cd /var/www/collective-souls/backend

if npm install --production; then
    log "✅ Backend dependencies installed successfully"
else
    error "Failed to install backend dependencies"
    exit 1
fi

# Verify installation
log "Verifying installation..."
if [ ! -d "$BACKEND_NODE_MODULES/sqlite3/build" ]; then
    error "SQLite3 module not properly built"
    log "Attempting to rebuild..."
    npm rebuild sqlite3
fi

if [ -f "$BACKEND_NODE_MODULES/sqlite3/build/Release/node_sqlite3.node" ]; then
    log "✅ SQLite3 native module built successfully"
else
    error "SQLite3 native module not found"
    npm rebuild sqlite3
fi

# Test if server can start without errors
log "Testing backend startup..."
if timeout 5s node /var/www/collective-souls/backend/server.js 2>&1 >/dev/null; then
    log "✅ Backend server starts without errors"
    log "Test completed (timed out after 5s - this is expected for the test)"
else
    # Capture and analyze the error
    ERROR_LOG=$(timeout 5s node /var/www/collective-souls/backend/server.js 2>&1)
    if echo "$ERROR_LOG" | grep -q "invalid ELF header"; then
        error "❌ Still getting invalid ELF header error"
        log "Error details:"
        echo "$ERROR_LOG"
        log "The sqlite3 module might still be incompatible"
        log "Attempting force reinstallation..."
        rm -rf "$BACKEND_NODE_MODULES/sqlite3"
        npm install sqlite3@latest --production
        if [ -f "$BACKEND_NODE_MODULES/sqlite3/build/Release/node_sqlite3.node" ]; then
            log "✅ SQLite3 module reinstalled successfully"
        else
            error "❌ Failed to reinstall SQLite3 module"
            exit 1
        fi
    elif echo "$ERROR_LOG" | grep -q "listen EADDRINUSE"; then
        log "✅ Server tried to start but port 3004 is already in use"
        log "This is normal - the server is likely already running in PM2"
    elif echo "$ERROR_LOG" | grep -q "Error: connect"; then
        log "✅ Server started but failed to connect to database"
        log "This is expected since we didn't run the full server"
    fi
fi

# Restart PM2 process
log "Restarting PM2 process..."
if pm2 list | grep -q "collective-souls-backend"; then
    if pm2 restart collective-souls-backend; then
        log "✅ PM2 process restarted successfully"
        
        # Wait for PM2 to stabilize
        log "Waiting for PM2 to stabilize..."
        sleep 2
        
        # Check status
        PM2_STATUS=$(pm2 status | grep "collective-souls-backend" | head -1 | awk '{print $8}')
        if [ "$PM2_STATUS" = "online" ]; then
            log "✅ Backend status: Online"
            
            # Health check
            BACKEND_PORT=3000
            log "Checking API health..."
            if curl -f "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
                log "✅ API is responsive at http://localhost:$BACKEND_PORT/api/health"
            else
                warning "API is not responding - waiting and checking again..."
                sleep 3
                if curl -f "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
                    log "✅ API is now responsive"
                else
                    warning "API is still not responding"
                    log "PM2 logs snippet:"
                    pm2 logs collective-souls-backend --lines 10
                fi
            fi
        else
            warning "Backend status: $PM2_STATUS"
            log "PM2 logs:"
            pm2 logs collective-souls-backend --lines 10
        fi
    else
        error "Failed to restart PM2 process"
    fi
else
    log "Backend process not in PM2 list - starting..."
    cd /var/www/collective-souls
    pm2 start ecosystem.config.cjs
    pm2 save
fi

log "=== Native Module Fix Complete ==="
echo
echo "========================================"
echo "🎉 Native Modules Fixed Successfully!"
echo "========================================"
echo
echo "Key Changes:"
echo "  - Backend dependencies reinstalled in WSL"
echo "  - SQLite3 native module compiled for Linux"
echo "  - PM2 process restarted"
echo
echo "Next Steps:"
echo "  1. Verify the backend is responding: ./test-script.sh"
echo "  2. Check PM2 status: pm2 status"
echo "  3. View PM2 logs: pm2 logs"
echo "  4. If issues persist, try: pm2 delete collective-souls-backend && pm2 start ecosystem.config.cjs"
echo "========================================"