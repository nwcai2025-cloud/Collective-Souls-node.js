# Collective Souls Platform - WSL Ubuntu Setup Guide

## Issue Analysis
The error `invalid ELF header` in the PM2 logs indicates that the Node.js modules in your `/var/www/collective-souls/backend/node_modules` directory were compiled on Windows and cannot run on Linux. This happens when you copy the entire project (including node_modules) from Windows to WSL.

## Solution Steps (Run in WSL Ubuntu Terminal)

### 1. Open your WSL Ubuntu terminal
First, make sure you're in your WSL environment. You can open it by:
- Searching for "Ubuntu" in the Windows Start menu
- Or typing `wsl` in the Windows Command Prompt or PowerShell

### 2. Navigate to your project folder
```bash
cd ~/project/collective-souls-nodejs
```

### 3. Set script permissions
```bash
chmod +x deployment/*.sh
```

### 4. Fix native modules (SQLite3 driver)
This will delete the incompatible node_modules and reinstall them specifically for Linux.
```bash
./deployment/fix-native-modules.sh
```

### 5. Start the entire platform
```bash
./deployment/start-platform.sh
```

### 6. Verify the installation
```bash
./deployment/test-script.sh
```

## What to expect
- **Step 4**: You will see messages about deleting and reinstalling dependencies
- **Step 5**: PM2 will start the backend, Redis and Nginx will be checked
- **Step 6**: The test script should report "Backend API is responding"

## Alternative manual approach (if scripts fail)

### Clean up and reinstall:
```bash
cd /var/www/collective-souls/backend
sudo rm -rf node_modules
npm install --production

# Then restart PM2
pm2 delete collective-souls-backend
pm2 start /var/www/collective-souls/ecosystem.config.cjs
pm2 save
```

### Verify the fix:
```bash
curl http://localhost:3000/api/health
```
This should return {"success":true,"message":"Collective Souls API is running","timestamp":"...","version":"1.0.0"}

## Common issues and solutions

### PM2 commands not working
If you get "pm2: command not found" you need to add PM2 to your PATH:
```bash
export PATH=~/.npm-global/bin:$PATH
```

### Port already in use
If you see "listen EADDRINUSE", check what's running on that port:
```bash
lsof -i :3000
```

## Important notes

1.  **Never copy node_modules from Windows to WSL**
2.  Always run `npm install` from within your WSL environment
3.  If you update dependencies from Windows, run `npm install` again in WSL
4.  You can safely copy your source code (backend/, frontend/, etc.) but not the node_modules folder

## Files modified

1.  **`deployment/fix-native-modules.sh`**: New script to fix native module issues
2.  **`deployment/fix-native-modules.bat`**: Windows batch file to run the fix (may not work for all cases)
3.  **`deployment/setup-ubuntu.sh`**: Updated to check for incompatible node_modules
4.  **`backend/config/database.js`**: Fixed to respect DB_TYPE=sqlite

## Success criteria

- PM2 status shows "online" (pm2 status)
- curl http://localhost:3000/api/health responds successfully
- Frontend loads at http://<WSL-IP-ADDRESS>
- Test script passes (./deployment/test-script.sh)

Your WSL IP address can be found using:
```bash
hostname -I