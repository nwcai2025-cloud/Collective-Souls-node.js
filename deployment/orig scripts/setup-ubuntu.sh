#!/bin/bash

# Collective Souls Platform - Ubuntu 24.04 Production Setup Script
# This script automates the complete installation process for both WSL and VPS environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check if running in WSL
WSL_ENV=false
if grep -q "Microsoft" /proc/sys/kernel/osrelease 2>/dev/null; then
    WSL_ENV=true
    log "Running in WSL environment (Windows Subsystem for Linux)"
fi

# Check Ubuntu version
log "Checking Ubuntu version..."
if ! lsb_release -a 2>/dev/null | grep -q "Ubuntu 24.04"; then
    warning "This script is designed for Ubuntu 24.04. You are using $(lsb_release -d 2>/dev/null | cut -f2). Proceed with caution."
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Check script directory structure
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")

if [ ! -d "$PROJECT_ROOT/backend" ] || [ ! -d "$PROJECT_ROOT/frontend" ]; then
    error "Please run this script from the deployment directory of the Collective Souls project"
    error "Current directory structure does not match expected format"
    exit 1
fi

log "Project root directory: $PROJECT_ROOT"

# Prompt for user inputs
log "Gathering configuration information..."

read -p "Enter your domain name (or press Enter to use server IP): " DOMAIN
read -p "Enter administrator email for SSL certificates: " ADMIN_EMAIL
read -p "Enter JWT secret key (or press Enter for auto-generated): " JWT_SECRET

# Generate random values if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    info "Generated JWT secret: $JWT_SECRET"
fi

if [ -z "$DOMAIN" ]; then
    DOMAIN=$(hostname -I | awk '{print $1}')
    info "Using server IP address: $DOMAIN"
fi

# Update system
log "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
log "Installing required system packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    nginx \
    redis-server \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    htop \
    ffmpeg

# Install Node.js 20 LTS
log "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
log "Verifying installations..."
node --version
npm --version
redis-server --version
ffmpeg -version

# Configure Redis
log "Configuring Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Configure firewall
log "Configuring firewall (UFW)..."
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Configure fail2ban
log "Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create application directory
log "Creating application directories..."
sudo mkdir -p /var/www/collective-souls/{backend,frontend,uploads,logs,database}
sudo chown -R $USER:$USER /var/www/collective-souls
sudo chmod -R 755 /var/www/collective-souls

# Copy application files
log "Copying application files..."
cp -r $PROJECT_ROOT/backend/* /var/www/collective-souls/backend/
cp -r $PROJECT_ROOT/frontend/* /var/www/collective-souls/frontend/

# Check if we have incompatible node_modules from Windows
log "Checking for incompatible node_modules..."
BACKEND_NODE_MODULES="/var/www/collective-souls/backend/node_modules"
if [ -d "$BACKEND_NODE_MODULES" ]; then
    # Check if node_modules contains Windows-compiled modules
    if [ -f "$BACKEND_NODE_MODULES/sqlite3/build/Release/node_sqlite3.node" ]; then
        # Try to determine if it's a Windows executable
        if file "$BACKEND_NODE_MODULES/sqlite3/build/Release/node_sqlite3.node" 2>/dev/null | grep -q "Windows"; then
            log "Windows-compiled node_modules detected - removing..."
            rm -rf "$BACKEND_NODE_MODULES"
        fi
    fi
fi

# Install backend dependencies
log "Installing backend dependencies..."
cd /var/www/collective-souls/backend
npm install --production

# Install frontend dependencies
log "Installing frontend dependencies..."
cd /var/www/collective-souls/frontend

if [ "$WSL_ENV" = true ]; then
    log "WSL-specific dependency installation..."
    npm cache clean --force
    rm -rf node_modules package-lock.json
    if npm install --no-package-lock; then
        log "Dependencies installed successfully (no package lock)"
    else
        error "Dependency installation failed. Retrying with package lock..."
        npm install
    fi
else
    npm install
fi

# Build frontend
log "Building frontend for production..."

# Ensure all node_modules binaries have execution permissions
chmod +x node_modules/.bin/* 2>/dev/null || true
if [ -f "node_modules/.bin/tsc" ]; then
    log "✅ TypeScript compiler permissions fixed"
fi
if [ -f "node_modules/.bin/vite" ]; then
    log "✅ Vite executable permissions fixed"
fi

if npm run build; then
    log "✓ Frontend build completed successfully"
else
    error "Build failed. Checking TypeScript installation..."
    ls -la node_modules/typescript/
    error "Build failed. Please check for TypeScript compilation errors."
    exit 1
fi

# Verify build output
if [ ! -d "dist" ]; then
    error "Frontend build failed - dist directory not created"
    exit 1
fi

# Setup environment files
log "Creating environment configuration..."
cat > /var/www/collective-souls/backend/.env <<EOF
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (SQLite)
DB_TYPE=sqlite
DB_STORAGE=/var/www/collective-souls/database/collective_souls.sqlite

# JWT Authentication
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@collectivesouls.com

# File Upload Configuration
MAX_FILE_SIZE=50000000
UPLOAD_PATH=/var/www/collective-souls/uploads
THUMBNAIL_SIZE=300

# Video Processing
FFMPEG_PATH=/usr/bin/ffmpeg
VIDEO_QUALITIES=720p,480p,360p
VIDEO_MAX_DURATION=1800

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend URL
FRONTEND_URL=http://$DOMAIN
EOF

# Copy existing database if it exists
if [ -f "$PROJECT_ROOT/database/collective_souls.sqlite" ]; then
    log "Copying existing database..."
    cp $PROJECT_ROOT/database/collective_souls.sqlite /var/www/collective-souls/database/
else
    warning "Existing database not found. A new database will be created on first run."
fi

# Install PM2
log "Installing PM2 process manager..."
npm config set prefix ~/.npm-global
if ! grep -q "~/.npm-global/bin" ~/.bashrc; then
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
fi
export PATH=~/.npm-global/bin:$PATH

npm install -g --prefix ~/.npm-global pm2

# Create PM2 ecosystem file
cat > /var/www/collective-souls/ecosystem.config.cjs <<EOF
module.exports = {
  apps: [{
    name: 'collective-souls-backend',
    script: './server.js',
    cwd: '/var/www/collective-souls/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/collective-souls/logs/err.log',
    out_file: '/var/www/collective-souls/logs/out.log',
    log_file: '/var/www/collective-souls/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Setup Nginx configuration
log "Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/collective-souls > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Permitted-Cross-Domain-Policies none always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https: wss:; media-src 'self' https:; object-src 'none'; frame-src 'none';" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    client_max_body_size 50M;

    # Static files
    location /static/ {
        alias /var/www/collective-souls/frontend/dist/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /uploads/ {
        alias /var/www/collective-souls/uploads/;
        expires 30d;
        add_header Cache-Control "public";
        add_header Access-Control-Allow-Origin *;
        access_log off;
    }

    location /videos/ {
        alias /var/www/collective-souls/uploads/videos/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
        access_log off;
        add_header Accept-Ranges bytes;
        add_header Content-Disposition inline;
    }

    location /hls/ {
        alias /var/www/collective-souls/uploads/hls/;
        add_header Cache-Control no-cache;
        add_header Access-Control-Allow-Origin *;
        add_header Content-Type application/vnd.apple.mpegurl;
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }
    }

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header X-Accel-Buffering no;
    }

    # Frontend
    location / {
        root /var/www/collective-souls/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.(env|log|htaccess)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    access_log /var/log/nginx/collective-souls_access.log;
    error_log /var/log/nginx/collective-souls_error.log;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_body_timeout 60s;
    client_header_timeout 60s;
    send_timeout 60s;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/collective-souls /etc/nginx/sites-enabled/

# Disable default site
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt (optional)
if [ -n "$ADMIN_EMAIL" ] && [ "$DOMAIN" != "$(hostname -I | awk '{print $1}')" ]; then
    read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Setting up SSL for $DOMAIN..."
        sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $ADMIN_EMAIL
        sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -
    fi
fi

# Start application with PM2
log "Starting application with PM2..."
cd /var/www/collective-souls
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# Setup log rotation
log "Setting up log rotation..."
sudo tee /etc/logrotate.d/collective-souls > /dev/null <<EOF
/var/www/collective-souls/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Create backup script
log "Creating backup script..."
sudo tee /var/www/collective-souls/backup.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/collective-souls"
mkdir -p \$BACKUP_DIR

cp /var/www/collective-souls/database/collective_souls.sqlite \$BACKUP_DIR/db_backup_\$DATE.sqlite
tar -czf \$BACKUP_DIR/uploads_backup_\$DATE.tar.gz /var/www/collective-souls/uploads
tar -czf \$BACKUP_DIR/app_backup_\$DATE.tar.gz /var/www/collective-souls/backend /var/www/collective-souls/frontend

find \$BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: \$DATE"
EOF

sudo chmod +x /var/www/collective-souls/backup.sh
sudo crontab -l | { cat; echo "0 2 * * * /var/www/collective-souls/backup.sh"; } | sudo crontab -

# Final checks
log "Performing final checks..."

info "Checking service status:"
sudo systemctl status nginx --no-pager
sudo systemctl status redis-server --no-pager

info "PM2 status:"
pm2 status

info "Firewall status:"
sudo ufw status

log "Production setup completed successfully!"
echo
echo "========================================"
echo "🎉 Collective Souls Platform Setup Complete!"
echo "========================================"
echo
echo "Access URLs:"
echo "  - Backend API: http://$DOMAIN:3000"
echo "  - Frontend: http://$DOMAIN"
echo "  - Health Check: http://$DOMAIN:3000/api/health"
echo
echo "Important files:"
echo "  - Application: /var/www/collective-souls/"
echo "  - Logs: /var/www/collective-souls/logs/"
echo "  - Environment: /var/www/collective-souls/backend/.env"
echo "  - Nginx Config: /etc/nginx/sites-available/collective-souls"
echo
echo "Management commands:"
echo "  - PM2 status: pm2 status"
echo "  - PM2 logs: pm2 logs"
echo "  - Restart app: pm2 restart collective-souls-backend"
echo "  - Backup: /var/www/collective-souls/backup.sh"
echo
echo "Next steps:"
echo "  1. Update environment variables in .env file"
echo "  2. Test the application"
echo
warning "Remember to:"
echo "  - Change default passwords"
echo "  - Configure proper SSL certificates"
echo "  - Set up monitoring"
echo "  - Test backups"
echo "  - Configure CDN for static assets"
echo "========================================"