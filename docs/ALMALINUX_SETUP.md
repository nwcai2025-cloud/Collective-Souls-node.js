# AlmaLinux 9 Deployment Guide (Barebones)

This guide provides the essential steps to set up the Collective Souls platform on a local AlmaLinux test server.

## 1. System Update & Dependencies
```bash
# Update system
sudo dnf update -y

# Install Git, Curl, Nginx, and MariaDB
sudo dnf install -y git curl wget nginx mariadb-server
```

## 2. Install Node.js 20
```bash
# Enable Node.js 20 module
sudo dnf module enable nodejs:20 -y
sudo dnf install -y nodejs

# Verify installation
node -v
npm -v
```

## 3. Application Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd collective-souls-nodejs

# Setup Backend
cd backend
npm install
cp .env.example .env
mkdir -p uploads

# Setup Frontend
cd ../frontend
npm install
# Ensure VITE_API_URL in your frontend .env points to your server's IP
npm run build
```

## 4. Database Setup (MariaDB)
```bash
# Start and enable MariaDB
sudo systemctl enable --now mariadb

# Secure installation (follow prompts to set root password)
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p <<MYSQL_SCRIPT
CREATE DATABASE collective_souls CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'collective_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON collective_souls.* TO 'collective_user'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT
```

## 5. Process Management (PM2)
```bash
sudo npm install -g pm2
cd ../backend
pm2 start server.js --name "cs-backend"
pm2 save
sudo pm2 startup
```

## 6. Nginx Configuration
Create a configuration file: `sudo vi /etc/nginx/conf.d/collective-souls.conf`

```nginx
server {
    listen 80;
    server_name _; # Replace with your server IP if needed

    # Frontend static files
    location / {
        root /path/to/collective-souls-nodejs/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io Proxy
    location /socket.io {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## 7. Firewall & SELinux (Required)
AlmaLinux has strict security defaults. You must run these commands:

```bash
# Open Firewall for HTTP
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# Allow Nginx to connect to the Node.js backend
sudo setsebool -P httpd_can_network_connect 1

# Start Nginx
sudo systemctl enable --now nginx
```

## 8. Troubleshooting
- **Logs**: Check backend logs with `pm2 logs`
- **Nginx Errors**: Check `/var/log/nginx/error.log`
- **Permissions**: Ensure the Nginx user has read access to your `frontend/dist` folder.