#!/bin/bash

# Socket.IO 400 Error Fix Deployment Script
# This script deploys the Nginx and backend fixes for Socket.IO polling

set -e

echo "🚀 Deploying Socket.IO fixes..."

# Define paths
WSL_PATH="/home/bob/project/collective-souls-ws-production"
PROD_PATH="/var/www/collective-souls"

# 1. Deploy Nginx configuration
echo "📝 Deploying Nginx configuration..."
sudo cp "$WSL_PATH/deployment/nginx.conf" /etc/nginx/sites-available/collective-souls

# 2. Test Nginx configuration
echo "🔍 Testing Nginx configuration..."
sudo nginx -t

# 3. Reload Nginx
echo "♻️ Reloading Nginx..."
sudo systemctl reload nginx

# 4. Deploy backend changes
echo "📦 Deploying backend changes..."
rsync -av --delete "$WSL_PATH/backend/" "$PROD_PATH/backend/" --exclude=node_modules --exclude=.env

# 5. Restart backend via PM2
echo "🔄 Restarting backend..."
cd "$PROD_PATH/backend"
pm2 restart collective-souls-backend || pm2 start ecosystem.config.cjs --name collective-souls-backend
pm2 save

# 6. Deploy frontend (if built)
if [ -d "$WSL_PATH/frontend/dist" ]; then
    echo "🎨 Deploying frontend..."
    rsync -av --delete "$WSL_PATH/frontend/dist/" "$PROD_PATH/frontend/dist/"
fi

echo "✅ Deployment complete!"
echo ""
echo "📋 Changes applied:"
echo "   - Nginx: Enhanced Socket.IO proxy with proper buffering"
echo "   - Backend: httpCompression disabled, increased buffer size"
echo "   - Frontend: Improved reconnection logic with more attempts"
echo ""
echo "🔍 Check logs with: pm2 logs collective-souls-backend --lines 50"
echo "🌐 Test the socket connection in your browser"
