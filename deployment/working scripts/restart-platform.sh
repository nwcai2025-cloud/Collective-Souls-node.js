#!/bin/bash

# Restart Script for Collective Souls Node.js Platform
# Restarts both backend (via PM2) and frontend servers (via Nginx)
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

log "=== Restarting Collective Souls Platform ==="

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

# Restart the platform
log "Stopping all services..."
if ./stop-platform.sh; then
    log "✅ Services stopped successfully"
else
    error "Failed to stop services"
    exit 1
fi

log "Waiting for services to completely stop..."
sleep 3

log "Starting all services..."
if ./start-platform.sh; then
    log "✅ Services started successfully"
else
    error "Failed to start services"
    exit 1
fi

log "=== Restart Complete ==="
echo
echo "========================================"
echo "🔄 Collective Souls Platform Restarted!"
echo "========================================"
echo
echo "Quick status check: ./test-script.sh"
echo "Stop everything: ./stop-platform.sh"
echo "Start everything: ./start-platform.sh"
echo "========================================"