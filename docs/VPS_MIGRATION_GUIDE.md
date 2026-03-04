# VPS Migration Guide for Collective Souls

## 🚀 Overview

This guide provides comprehensive instructions for migrating your Collective Souls platform from Windows 11 to your existing Ubuntu Linux VPS. The migration leverages your existing deployment infrastructure for a smooth transition.

## 📋 Prerequisites

### Your Current Setup
- **Windows 11 development environment**
- **Existing Ubuntu Linux VPS** (1 CPU, 2GB RAM, 40GB SSD)
- **Git repository** with your codebase
- **Existing deployment scripts** in `/deployment/` folder

### Required Tools
- **SSH client** (PuTTY, OpenSSH, etc.)
- **File transfer tool** (SCP, SFTP, WinSCP)
- **Database export/import tools** (MySQL Workbench, command line)

## 🎯 Migration Strategy

### Option 1: Direct Migration (Recommended)
**Best for**: Quick migration using existing infrastructure
**Time Estimate**: 2-3 hours
**Complexity**: Low

### Option 2: Docker Deployment
**Best for**: Containerized, isolated deployment
**Time Estimate**: 3-4 hours
**Complexity**: Medium

### Option 3: Manual Setup
**Best for**: Full control over configuration
**Time Estimate**: 4-6 hours
**Complexity**: High

## 📊 Resource Analysis

### Your VPS Specifications
- **CPU**: 1 Core
- **RAM**: 2GB
- **Storage**: 40GB SSD
- **OS**: Ubuntu Linux
- **Network**: 10Gbps Shared Port

### Application Resource Requirements
- **Node.js Backend**: ~200-400MB RAM
- **MySQL Database**: ~300-500MB RAM
- **Nginx**: ~50-100MB RAM
- **Node.js Frontend**: ~100-200MB RAM
- **System overhead**: ~200-300MB RAM
- **Available for growth**: ~500MB-1GB

**✅ Your VPS can comfortably handle your application!**

## 🚀 Phase 1: VPS Preparation (30 minutes)

### 1.1 Access Your VPS
```bash
# Connect to your VPS
ssh username@your-vps-ip

# Update system packages
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Required Software
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### 1.3 Verify Installation
```bash
# Check versions
node --version
npm --version
mysql --version
nginx -v

# Start services
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl start mysql
sudo systemctl enable mysql
```

## 📤 Phase 2: Application Transfer (15-30 minutes)

### 2.1 Transfer Files from Windows
```bash
# From your Windows machine, transfer the entire project
scp -r collective-souls-nodejs/ username@vps-ip:/home/username/

# Or use WinSCP for GUI transfer
# Connect to your VPS and drag/drop files
```

### 2.2 Alternative: Clone from Git
```bash
# On your VPS
cd /home/username
git clone https://github.com/your-repo/collective-souls-nodejs.git
cd collective-souls-nodejs
```

### 2.3 Set Permissions
```bash
# Set proper ownership
sudo chown -R username:username /home/username/collective-souls-nodejs

# Set executable permissions on scripts
chmod +x deployment/*.sh
chmod +x *.sh
```

## 🗄️ Phase 3: Database Migration (15-30 minutes)

### 3.1 Export Database from Windows
```bash
# On Windows, export your database
mysqldump -u username -p collective_souls > collective_souls_backup.sql

# Or use MySQL Workbench:
# 1. Connect to your database
# 2. Right-click database → Data Export
# 3. Export to SQL file
```

### 3.2 Transfer Database Backup
```bash
# Transfer backup file to VPS
scp collective_souls_backup.sql username@vps-ip:/home/username/
```

### 3.3 Import Database to VPS
```bash
# On your VPS
mysql -u root -p

# In MySQL shell:
CREATE DATABASE collective_souls;
USE collective_souls;
SOURCE /home/username/collective_souls_backup.sql;

# Exit MySQL
EXIT;
```

### 3.4 Create Database User
```bash
# Access MySQL
mysql -u root -p

# Create user and grant permissions
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON collective_souls.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## ⚙️ Phase 4: Application Setup (30-60 minutes)

### 4.1 Install Backend Dependencies
```bash
cd /home/username/collective-souls-nodejs/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment configuration
nano .env
```

### 4.2 Configure Environment Variables
```bash
# Edit .env file with your VPS settings
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=your_password
DB_NAME=collective_souls
DB_PORT=3306

# Update other settings as needed:
# - JWT_SECRET
# - FRONTEND_URL
# - FILE_UPLOAD_PATH
# - Any other environment-specific variables
```

### 4.3 Install Frontend Dependencies
```bash
cd /home/username/collective-souls-nodejs/frontend

# Install dependencies
npm install

# Build the application
npm run build
```

### 4.4 Run Setup Script (Recommended)
```bash
# Use your existing setup script
cd /home/username/collective-souls-nodejs
sudo ./deployment/setup-ubuntu.sh
```

## 🌐 Phase 5: Web Server Configuration (30 minutes)

### 5.1 Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/collective-souls

# Add configuration:
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5.2 Enable Site Configuration
```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/collective-souls /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5.3 Set Up SSL (Optional but Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## 🚀 Phase 6: Application Deployment (15 minutes)

### 6.1 Start Backend with PM2
```bash
cd /home/username/collective-souls-nodejs

# Start backend using PM2
pm2 start deployment/ecosystem.config.cjs --env production

# Or start manually
cd backend && pm2 start server.js --name "collective-souls-backend"
```

### 6.2 Start Frontend
```bash
# Serve frontend with Nginx (recommended)
# Your Nginx config should handle this

# Or start development server
cd frontend && npm run dev
```

### 6.3 Set Up Auto-Start
```bash
# Save PM2 process list
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the instructions to run the startup script
```

## 🧪 Phase 7: Testing & Validation (30 minutes)

### 7.1 Test Application Access
```bash
# Test backend API
curl http://your-vps-ip:5000/api/health

# Test frontend
curl http://your-vps-ip:3000

# Test through Nginx
curl http://your-domain.com
```

### 7.2 Test Database Connection
```bash
# Test MySQL connection
mysql -u app_user -p -h localhost collective_souls

# Run a simple query
SELECT COUNT(*) FROM users;
```

### 7.3 Test File Uploads
- Visit your application
- Try uploading a profile picture
- Verify files are saved to the correct directory
- Check file permissions

### 7.4 Test Chat Functionality
- Test real-time chat
- Verify Socket.io connections
- Test message persistence

## 📊 Phase 8: Performance Optimization (Optional)

### 8.1 Database Optimization
```bash
# Optimize MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Add optimizations:
innodb_buffer_pool_size = 512M
innodb_log_file_size = 64M
max_connections = 100
query_cache_size = 32M
```

### 8.2 Node.js Optimization
```bash
# Update PM2 ecosystem config for production
# Add cluster mode for better performance
instances: "max"
exec_mode: "cluster"
```

### 8.3 Nginx Optimization
```bash
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔒 Phase 9: Security Hardening

### 9.1 Firewall Configuration
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow specific ports if needed
sudo ufw allow 3000  # Frontend
sudo ufw allow 5000  # Backend
```

### 9.2 SSH Security
```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Change SSH port (optional)
# Set: Port 2222

# Restart SSH
sudo systemctl restart ssh
```

### 9.3 Application Security
- Update all dependencies
- Use strong passwords
- Enable 2FA for admin accounts
- Regular security updates

## 📈 Phase 10: Monitoring & Maintenance

### 10.1 PM2 Monitoring
```bash
# View application status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit
```

### 10.2 System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor system resources
htop

# Monitor disk usage
df -h

# Monitor network
nethogs
```

### 10.3 Database Monitoring
```bash
# Monitor MySQL
mysqladmin -u root -p processlist

# Check database size
du -sh /var/lib/mysql/collective_souls/
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Permission Denied Errors
```bash
# Fix file permissions
sudo chown -R username:username /home/username/collective-souls-nodejs
sudo chmod -R 755 /home/username/collective-souls-nodejs
```

#### 2. Database Connection Errors
```bash
# Check MySQL status
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log

# Test connection
mysql -u app_user -p -h localhost
```

#### 3. Nginx Configuration Errors
```bash
# Test configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. PM2 Startup Issues
```bash
# Check PM2 status
pm2 status

# Restart PM2
pm2 restart all

# Check PM2 logs
pm2 logs
```

## 📋 Post-Migration Checklist

- [ ] Application accessible via domain/IP
- [ ] Database connection working
- [ ] File uploads functional
- [ ] Chat system operational
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured
- [ ] Auto-start configured
- [ ] Monitoring tools set up
- [ ] Backup strategy implemented
- [ ] Performance tested
- [ ] Security measures in place

## 💰 Cost Analysis

### VPS Costs (Already Paid)
- **Your existing VPS**: $15-25/month
- **No additional costs** for migration
- **Time investment**: 2-3 hours

### Potential Additional Costs
- **Domain registration**: $10-15/year
- **SSL certificate**: Free (Let's Encrypt)
- **Backup storage**: $5-10/month (optional)
- **Monitoring tools**: Free to $20/month

## 🎯 Success Metrics

### Performance Targets
- **Application load time**: < 3 seconds
- **Database response time**: < 100ms
- **File upload speed**: < 30 seconds for 10MB
- **Concurrent users**: 50-100 simultaneous

### Uptime Targets
- **Daily uptime**: 99.5%+
- **Monthly uptime**: 99%+
- **Response time**: < 500ms average

## 🔄 Rollback Plan

### If Migration Fails
1. **Keep Windows environment running** during migration
2. **Test thoroughly** before switching DNS
3. **Have rollback scripts ready**
4. **Document rollback procedure**

### Rollback Steps
1. **Stop VPS services**
2. **Restore Windows environment**
3. **Update DNS back to original**
4. **Verify Windows environment works**
5. **Investigate and fix issues**
6. **Retry migration**

## 📞 Support Resources

### Documentation
- [Your existing deployment docs](./deployment/)
- [Node.js documentation](https://nodejs.org/en/docs/)
- [MySQL documentation](https://dev.mysql.com/doc/)
- [Nginx documentation](https://nginx.org/en/docs/)

### Community Support
- [Stack Overflow](https://stackoverflow.com/)
- [GitHub Issues](https://github.com/your-repo/collective-souls-nodejs/issues)
- [DigitalOcean Community](https://www.digitalocean.com/community/)

---

**"Your existing Ubuntu VPS is perfectly suited for your Collective Souls platform. The migration should be smooth and cost-effective!"** 🌟🚀