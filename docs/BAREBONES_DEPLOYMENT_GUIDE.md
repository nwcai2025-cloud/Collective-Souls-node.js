# Collective Souls - Barebones Ubuntu VPS Deployment Guide

## 🎯 Minimal Viable Deployment

This guide provides the minimum steps to get your Collective Souls platform up and running on a Ubuntu VPS. It's focused on essential configurations with all commands included.

## 📋 Prerequisites

- **Ubuntu VPS**: 20.04 LTS or 24.04 LTS (recommended)
- **Root Access**: SSH access with sudo privileges
- **Domain Name**: Optional but recommended for SSL
- **Minimum Resources**:
  - 2 GB RAM (4 GB recommended for production)
  - 2 CPU cores (4 recommended for production)
  - 20 GB storage (40 GB recommended for video storage)

## 🚀 Deployment Steps

### Phase 1: Initial Server Setup

#### 1.1 Connect to your server
```bash
ssh root@your-server-ip
```

#### 1.2 Create a non-root user (for security)
```bash
adduser deploy
usermod -aG sudo deploy
```

#### 1.3 Switch to the new user
```bash
su - deploy
```

#### 1.4 Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.5 Install essential packages
```bash
sudo apt install -y curl wget git build-essential ufw fail2ban
```

### Phase 2: Install Node.js & Dependencies

#### 2.1 Install Node.js 20+ (LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2.2 Verify installations
```bash
node --version
npm --version
```

### Phase 3: Install and Configure MySQL

#### 3.1 Install MySQL
```bash
sudo apt install -y mysql-server
```

#### 3.2 Secure MySQL installation
```bash
sudo mysql_secure_installation
```

Answer the prompts:
```
VALIDATE PASSWORD COMPONENT? (Press y|Y for Yes, any other key for No): n
New password: your-secure-mysql-password
Re-enter new password: your-secure-mysql-password
Remove anonymous users? (Press y|Y for Yes, any other key for No): y
Disallow root login remotely? (Press y|Y for Yes, any other key for No): y
Remove test database and access to it? (Press y|Y for Yes, any other key for No): y
Reload privilege tables now? (Press y|Y for Yes, any other key for No): y
```

#### 3.3 Create database and user
```bash
sudo mysql -u root <<MYSQL_SCRIPT
CREATE DATABASE collective_souls CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'collective_user'@'localhost' IDENTIFIED BY 'your-secure-db-password';
GRANT ALL PRIVILEGES ON collective_souls.* TO 'collective_user'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT
```

### Phase 4: Install Redis (Optional but Recommended)

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Phase 5: Deploy the Application

#### 5.1 Create application directory
```bash
sudo mkdir -p /var/www/collective-souls
sudo chown -R deploy:deploy /var/www/collective-souls
cd /var/www/collective-souls
```

#### 5.2 Clone the repository
```bash
git clone https://github.com/nwcai2025-cloud/Collective-Souls-node.js.git .
```

#### 5.3 Install backend dependencies
```bash
cd /var/www/collective-souls/backend
npm install --production
```

#### 5.4 Install frontend dependencies
```bash
cd /var/www/collective-souls/frontend
npm install --production
npm run build
```

### Phase 6: Configure Environment

#### 6.1 Create backend .env file
```bash
cd /var/www/collective-souls/backend
cat > .env <<EOF
PORT=3004
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=collective_souls
DB_USER=collective_user
DB_PASSWORD=your-secure-db-password
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
MAX_FILE_SIZE=50000000
UPLOAD_PATH=/var/www/collective-souls/backend/uploads
FRONTEND_URL=http://your-server-ip
EOF
```

#### 6.2 Create frontend environment file
```bash
cd /var/www/collective-souls/frontend
cat > .env <<EOF
VITE_API_URL=http://your-server-ip/api
EOF
```

### Phase 7: Setup Database

#### 7.1 Import database schema
```bash
cd /var/www/collective-souls
mysql -u collective_user -p'your-secure-db-password' collective_souls < database/schema.sql
```

#### 7.2 Create admin user (optional but recommended)
```bash
cd /var/www/collective-souls/backend
node scripts/create-admin-user.js
```

### Phase 8: Install PM2 Process Manager

```bash
sudo npm install -g pm2
```

#### 8.1 Create PM2 ecosystem file
```bash
cd /var/www/collective-souls
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'collective-souls-backend',
    script: './backend/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3004
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
EOF
```

#### 8.2 Create logs directory
```bash
mkdir -p /var/www/collective-souls/logs
```

### Phase 9: Configure Nginx

#### 9.1 Install Nginx
```bash
sudo apt install -y nginx
```

#### 9.2 Create Nginx configuration
```bash
sudo cat > /etc/nginx/sites-available/collective-souls <<EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/collective-souls/frontend/dist;
    index index.html;

    # Static files
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3004;
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

    # Uploads
    location /uploads/ {
        alias /var/www/collective-souls/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public";
        add_header Access-Control-Allow-Origin *;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
```

#### 9.3 Enable the site
```bash
sudo ln -sf /etc/nginx/sites-available/collective-souls /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

#### 9.4 Test and restart Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Phase 10: Configure Firewall

#### 10.1 Enable UFW
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3004/tcp
sudo ufw --force enable
```

#### 10.2 Verify firewall status
```bash
sudo ufw status
```

### Phase 11: Start the Application

#### 11.1 Start PM2 process
```bash
cd /var/www/collective-souls
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 11.2 Verify PM2 status
```bash
pm2 status
```

### Phase 12: Setup SSL (Optional but Recommended)

#### 12.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 12.2 Obtain SSL certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Answer the prompts:
```
Enter email address: your-email@example.com
Agree to terms: A
Share email: N
Redirect HTTP to HTTPS: 2
```

## 🎉 Deployment Complete!

### Verify Your Installation

#### Check backend health
```bash
curl -X GET http://your-server-ip/api/health
```

Expected response:
```json
{"success":true,"message":"Collective Souls API is running","timestamp":"...","version":"1.0.0"}
```

#### Check frontend
Open your browser and navigate to:
- Without domain: `http://your-server-ip`
- With domain: `https://your-domain.com`

## 📊 Common Management Commands

### PM2 Management
```bash
pm2 status                          # Check process status
pm2 logs                           # View real-time logs
pm2 restart collective-souls-backend  # Restart application
pm2 reload collective-souls-backend   # Reload without downtime
pm2 stop collective-souls-backend   # Stop application
```

### Nginx Management
```bash
sudo nginx -t                      # Test config
sudo systemctl restart nginx       # Restart Nginx
sudo systemctl status nginx        # Check Nginx status
sudo tail -f /var/log/nginx/error.log  # View Nginx error logs
```

### MySQL Management
```bash
mysql -u collective_user -p        # Connect to MySQL
sudo systemctl restart mysql       # Restart MySQL
```

### Log Management
```bash
tail -f /var/www/collective-souls/logs/combined.log  # View app logs
tail -f /var/log/nginx/access.log  # View Nginx access logs
```

## 🚑 Troubleshooting

### Common Issues & Solutions

1. **502 Bad Gateway** - Nginx can't connect to backend
   ```bash
   pm2 status                        # Check if backend is running
   curl -X GET http://localhost:3004/api/health  # Test backend directly
   ```

2. **Failed to connect to MySQL**
   ```bash
   sudo systemctl status mysql       # Check MySQL status
   sudo journalctl -xeu mysql        # View MySQL error logs
   ```

3. **Frontend not loading**
   ```bash
   ls -la /var/www/collective-souls/frontend/dist/  # Check build files
   sudo nginx -t                     # Test Nginx config
   ```

4. **File uploads failing**
   ```bash
   ls -la /var/www/collective-souls/backend/uploads/  # Check permissions
   ```

### Check Resource Usage
```bash
htop                               # System resources
pm2 monit                          # PM2 monitoring
df -h                              # Disk space
```

## 🔒 Security Best Practices

### Basic Hardening
```bash
# Fail2ban (already installed)
sudo systemctl status fail2ban

# SSH hardening (edit /etc/ssh/sshd_config)
sudo nano /etc/ssh/sshd_config
# Change:
# PermitRootLogin no
# PasswordAuthentication no

sudo systemctl restart ssh
```

### Backup Strategy
```bash
# Create daily backup script
cat > /var/www/collective-souls/backup.sh <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/collective-souls"
mkdir -p \$BACKUP_DIR

# Backup database
mysqldump -u collective_user -p'your-secure-db-password' collective_souls > \$BACKUP_DIR/db_backup_\$DATE.sql

# Backup uploads
tar -czf \$BACKUP_DIR/uploads_backup_\$DATE.tar.gz /var/www/collective-souls/backend/uploads

# Keep only last 7 days
find \$BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

chmod +x /var/www/collective-souls/backup.sh
sudo crontab -l | { cat; echo "0 2 * * * /var/www/collective-souls/backup.sh"; } | sudo crontab -
```

## 📈 Performance Optimization

### Enable Gzip Compression (already in Nginx config)
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
```

### Enable HTTP/2
Add to Nginx config:
```nginx
listen 443 ssl http2;
```

### Setup CDN for Static Files
- Use Cloudflare, AWS CloudFront, or other CDN
- Configure CDN to cache static assets

## 🎯 Next Steps

### 1. Configure Domain (Recommended)
- Point your domain to your server IP
- Update `FRONTEND_URL` in `.env`
- Run `certbot` for SSL

### 2. Monitor Performance
- Set up monitoring (e.g., Prometheus + Grafana)
- Monitor logs for errors
- Check resource usage regularly

### 3. Scale as Needed
- Add more CPU/RAM
- Configure load balancing
- Setup database replication

### 4. Security Enhancements
- Implement a WAF (Web Application Firewall)
- Enable DDoS protection
- Configure IP whitelisting for admin endpoints

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review PM2 and Nginx logs
3. Verify all services are running
4. Test API endpoints directly
5. Check file permissions

---

**"Collective Souls is now running on your Ubuntu VPS!"** 🌟