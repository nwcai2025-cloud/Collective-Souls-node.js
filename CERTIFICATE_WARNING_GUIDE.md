# Certificate Warning Guide - Development Setup

## 🔒 Understanding Self-Signed Certificates

The certificate warnings you're seeing are **completely normal** for development environments. Since we're using self-signed certificates (not issued by a trusted Certificate Authority), browsers will show security warnings.

## 🚨 **IMPORTANT: How to Bypass Certificate Warnings**

### **For Chrome/Edge:**
1. When you see the certificate warning page, type `thisisunsafe` anywhere on the page
2. The page will automatically reload and load the site
3. **OR** click "Advanced" → "Proceed to 192.168.4.24 (unsafe)"

### **For Firefox:**
1. Click "Advanced..."
2. Click "Accept the Risk and Continue"

### **For Safari:**
1. Click "Show Details"
2. Click "Visit this Website"

## 📱 **Mobile Browser Instructions**

### **iPhone/iPad (Safari):**
1. When you see "Your connection is not private"
2. Scroll down and tap "Visit Website"
3. The site will load

### **Android (Chrome):**
1. Tap "Advanced"
2. Tap "Proceed to 192.168.4.24 (unsafe)"
3. **OR** type `thisisunsafe` on the warning page

## 🌟 **Complete Testing Instructions**

### **Step 1: Start Both Servers**
```bash
# Terminal 1: Start backend
cd backend
node server.js

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

### **Step 2: Access the Site**
1. **Open your browser** (Chrome, Firefox, Safari, etc.)
2. **Navigate to**: `https://192.168.4.24:8080`
3. **Bypass certificate warning** using instructions above
4. **You should see the Collective Souls login page**

### **Step 3: Test Video Functionality**
1. **Log in** to your account
2. **Navigate to**: `https://192.168.4.24:8080/test-video.html`
3. **Bypass certificate warning again** (if shown)
4. **Click "Test WebRTC"** to verify functionality
5. **Click "Start Video Call"** to begin testing

### **Step 4: Mobile Testing**
1. **On your phone**, open browser
2. **Navigate to**: `https://192.168.4.24:8080/test-video.html`
3. **Bypass certificate warning** using mobile instructions
4. **Test video functionality** on mobile device

## 🔧 **Troubleshooting Certificate Issues**

### **If you still see certificate errors:**

1. **Clear browser cache** and try again
2. **Check that both servers are running**:
   - Backend: `node server.js` (port 3004 & 3005)
   - Frontend: `npm run dev` (port 8080)

3. **Verify firewall is configured**:
   ```bash
   # Run as Administrator
   enable-firewall-port.bat
   ```

4. **Check network connection**:
   - Ensure phone and computer are on same WiFi
   - Verify IP address is correct (`192.168.4.24`)

### **For Persistent Issues:**

1. **Restart both servers**
2. **Clear browser cache completely**
3. **Try incognito/private browsing mode**
4. **Try a different browser**

## 📋 **What to Expect**

### **Normal Behavior:**
- ✅ Certificate warning on first visit (normal for development)
- ✅ Site loads after bypassing warning
- ✅ Video functionality works on desktop and mobile
- ✅ WebRTC connections establish successfully

### **If Something's Wrong:**
- ❌ Site doesn't load even after bypassing warning
- ❌ Video test fails
- ❌ Mobile access doesn't work
- ❌ Servers won't start

## 🎯 **Success Criteria**

You know everything is working when:
1. ✅ Both servers start without errors
2. ✅ Site loads after bypassing certificate warning
3. ✅ WebRTC test passes
4. ✅ Video calls work on desktop
5. ✅ Video calls work on mobile devices

## 🚀 **Production Deployment Note**

For production deployment, you would use:
- **Let's Encrypt certificates** (trusted by browsers)
- **Proper domain name** (not IP address)
- **No certificate warnings** for users

**For now, the certificate warnings are expected and safe to bypass in development!** 🔒✅