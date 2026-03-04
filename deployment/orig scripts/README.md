# Collective Souls Platform - Ubuntu 24.04 Deployment

This directory contains production deployment scripts for the Collective Souls platform on Ubuntu 24.04. These scripts are designed to work with both WSL (Windows Subsystem for Linux) and VPS (Virtual Private Server) environments.

## Files

### 1. `setup-ubuntu.sh` - Main Installation Script
The primary script that automates the complete installation process. It:

- Updates system packages
- Installs required dependencies (Node.js, Nginx, Redis, FFmpeg, etc.)
- Configures the application directory structure
- Installs backend and frontend dependencies
- Builds the frontend
- Sets up environment variables
- Configures Nginx as a reverse proxy
- Starts the application with PM2 process manager
- Sets up SSL with Let's Encrypt (optional)
- Creates backup and log rotation configurations

### 2. `test-script.sh` - Installation Verification
A script to verify the installation by checking:

- System services (Nginx, Redis, PM2)
- Application directory structure
- Backend API status
- Frontend accessibility
- Node.js and npm versions
- Dependencies availability (FFmpeg)
- Database status
- PM2 logs

### 3. `ecosystem.config.cjs` - PM2 Configuration
PM2 process manager configuration file with:

- Cluster mode with 2 instances
- Environment variables (production)
- Log file configuration
- Memory management settings

## Usage

### Prerequisites

1. Ubuntu 24.04 LTS (or compatible)
2. User with sudo privileges
3. Project repository cloned locally

### Installation

1. Navigate to the deployment directory:
   ```bash
   cd /path/to/collective-souls-nodejs/deployment
   ```

2. Make sure the scripts are executable:
   ```bash
   chmod +x setup-ubuntu.sh test-script.sh
   ```

3. Run the main installation script:
   ```bash
   ./setup-ubuntu.sh
   ```

4. The script will prompt for:
   - Domain name (or use server IP)
   - Administrator email for SSL certificates
   - JWT secret key (will generate if not provided)

5. After installation, run the test script to verify:
   ```bash
   ./test-script.sh
   ```

### WSL Specifics

Ubuntu 24.04 on WSL2 supports systemd, but it must be enabled. If you encounter issues with system services:

1. Check if systemd is enabled:
   ```bash
   cat /etc/wsl.conf
   ```

2. If not, add this to `/etc/wsl.conf`:
   ```ini
   [boot]
   systemd=true
   ```

3. Restart WSL:
   ```powershell
   wsl --shutdown
   ```

### Post-Installation

#### Environment Variables
Update `/var/www/collective-souls/backend/.env` with your specific configuration:

- Email settings for password recovery
- File storage configurations
- Database settings (if using MySQL instead of SQLite)

#### SSL Configuration
If you didn't set up SSL during installation, you can run:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --non-interactive --agree-tos --email your-email@example.com
```

#### Backups
A daily backup is automatically scheduled at 2 AM. To manually run a backup:

```bash
/var/www/collective-souls/backup.sh
```

### Management Commands

#### PM2
```bash
pm2 status                          # View process status
pm2 logs                            # View real-time logs
pm2 restart collective-souls-backend # Restart backend
pm2 reloadLogs                      # Reload log files
```

#### Nginx
```bash
sudo nginx -t                       # Test configuration
sudo systemctl restart nginx        # Restart Nginx
sudo systemctl status nginx         # Check status
```

#### Redis
```bash
sudo systemctl restart redis-server # Restart Redis
sudo systemctl status redis-server  # Check status
```

## Uninstallation

To completely remove the application:

1. Stop PM2 processes:
   ```bash
   pm2 delete collective-souls-backend
   pm2 unstartup
   ```

2. Disable Nginx site:
   ```bash
   sudo rm /etc/nginx/sites-enabled/collective-souls
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. Remove application files:
   ```bash
   sudo rm -rf /var/www/collective-souls
   sudo rm /etc/nginx/sites-available/collective-souls
   ```

4. Remove log rotation:
   ```bash
   sudo rm /etc/logrotate.d/collective-souls
   ```

5. Remove backups:
   ```bash
   sudo rm -rf /var/backups/collective-souls
   ```

## Troubleshooting

### Common Issues

1. **Nginx failing to start**: Check if port 80/443 are in use
2. **Backend API not responding**: Check PM2 logs
3. **Frontend not loading**: Verify build directory and Nginx configuration
4. **Database errors**: Ensure database file permissions are correct

### Logs

- PM2 logs: `/var/www/collective-souls/logs/`
- Nginx logs: `/var/log/nginx/collective-souls_access.log` and `/var/log/nginx/collective-souls_error.log`

### Performance

For better performance, consider:

- Using MySQL instead of SQLite
- Adding Redis caching
- Configuring a CDN for static files
- Optimizing Nginx settings

## Production Recommendations

1. Use SSL/TLS (Let's Encrypt is free and automated)
2. Set up a domain name instead of using IP address
3. Implement monitoring (e.g., Prometheus, Grafana)
4. Set up automatic updates (unattended-upgrades)
5. Configure a firewall (UFW is already enabled)