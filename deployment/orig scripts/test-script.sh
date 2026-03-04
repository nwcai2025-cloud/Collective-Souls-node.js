#!/bin/bash

# Collective Souls Platform - Installation Verification Script

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

log "=== Collective Souls Platform Installation Verification ==="

# Check if running in WSL
WSL_ENV=false
if grep -q "Microsoft" /proc/sys/kernel/osrelease 2>/dev/null; then
    WSL_ENV=true
    log "Running in WSL environment"
fi

log "1. Checking system services status..."

# Check Nginx status
if systemctl is-active --quiet nginx; then
    log "✓ Nginx is running"
else
    error "Nginx is not running"
fi

# Check Redis status
if systemctl is-active --quiet redis-server; then
    log "✓ Redis is running"
else
    error "Redis is not running"
fi

# Check PM2 status
if command -v pm2 >/dev/null 2>&1; then
    if pm2 list | grep -q "collective-souls-backend"; then
        log "✓ PM2 process is running"
    else
        error "PM2 process not found"
    fi
else
    error "PM2 is not installed"
fi

log "2. Checking application structure..."

if [ -d "/var/www/collective-souls" ]; then
    log "✓ Application directory exists"
else
    error "Application directory does not exist: /var/www/collective-souls"
fi

if [ -d "/var/www/collective-souls/backend" ]; then
    log "✓ Backend directory exists"
else
    error "Backend directory does not exist"
fi

if [ -d "/var/www/collective-souls/frontend/dist" ]; then
    log "✓ Frontend build exists"
else
    error "Frontend build does not exist"
fi

if [ -d "/var/www/collective-souls/uploads" ]; then
    log "✓ Uploads directory exists"
else
    error "Uploads directory does not exist"
fi

if [ -d "/var/www/collective-souls/logs" ]; then
    log "✓ Logs directory exists"
else
    error "Logs directory does not exist"
fi

if [ -f "/var/www/collective-souls/backend/.env" ]; then
    log "✓ Environment file exists"
else
    error "Environment file does not exist"
fi

log "3. Checking backend API status..."

DOMAIN=$(grep FRONTEND_URL /var/www/collective-souls/backend/.env | cut -d'=' -f2)
DOMAIN=$(echo "$DOMAIN" | sed 's/http:\/\///')

if curl -s "http://$DOMAIN:3000/api/health" > /dev/null; then
    log "✓ Backend API is responding"
    HEALTH_RESPONSE=$(curl -s "http://$DOMAIN:3000/api/health")
    info "  Health check: $HEALTH_RESPONSE"
else
    error "Backend API is not responding on http://$DOMAIN:3000/api/health"
fi

log "4. Checking frontend status..."

if curl -s "http://$DOMAIN" > /dev/null; then
    log "✓ Frontend is responding"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN")
    info "  HTTP status: $HTTP_STATUS"
else
    error "Frontend is not responding on http://$DOMAIN"
fi

log "5. Checking Node.js and npm..."

if command -v node >/dev/null 2>&1; then
    log "✓ Node.js: $(node --version)"
else
    error "Node.js is not installed"
fi

if command -v npm >/dev/null 2>&1; then
    log "✓ npm: $(npm --version)"
else
    error "npm is not installed"
fi

log "6. Checking dependencies..."

if command -v ffmpeg >/dev/null 2>&1; then
    log "✓ FFmpeg is available"
else
    warning "FFmpeg is not available"
fi

log "7. Checking database..."

DB_TYPE=$(grep DB_TYPE /var/www/collective-souls/backend/.env | cut -d'=' -f2)

if [ "$DB_TYPE" = "sqlite" ]; then
    DB_PATH=$(grep DB_STORAGE /var/www/collective-souls/backend/.env | cut -d'=' -f2)
    if [ -f "$DB_PATH" ]; then
        log "✓ SQLite database exists at $DB_PATH"
        DB_SIZE=$(stat -c%s "$DB_PATH" 2>/dev/null || stat -f%z "$DB_PATH" 2>/dev/null)
        if [ -n "$DB_SIZE" ]; then
            info "  Database size: $(echo "scale=2; $DB_SIZE / 1024 / 1024" | bc) MB"
        fi
    else
        warning "SQLite database does not exist at $DB_PATH"
    fi
else
    log "✓ Database type: $DB_TYPE"
fi

log "8. Checking PM2 logs..."

PM2_LOG_PATH="/var/www/collective-souls/logs/out.log"
if [ -f "$PM2_LOG_PATH" ]; then
    log "✓ PM2 log file exists"
    LOG_LINES=$(tail -20 "$PM2_LOG_PATH")
    info "  Last 20 log lines:"
    echo "$LOG_LINES"
else
    warning "PM2 log file not found"
fi

log "=== Verification Complete ==="

echo
echo "Application is accessible at: http://$DOMAIN"
echo
echo "Management commands:"
echo "  - View PM2 status: pm2 status"
echo "  - View PM2 logs: pm2 logs"
echo "  - Restart backend: pm2 restart collective-souls-backend"
echo "  - Check Nginx config: sudo nginx -t"
echo "  - Restart Nginx: sudo systemctl restart nginx"