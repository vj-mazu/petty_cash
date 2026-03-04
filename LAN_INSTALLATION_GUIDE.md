# 🌐 MRN INDUSTRIES - LAN Installation Guide
## Configure Local Network Access for Multiple Computers

---

## 📋 **Overview**

This guide shows **EXACTLY where to change** configurations to enable LAN (Local Area Network) access, allowing multiple computers on the same network to access the Transaction Management System.

---

## 🎯 **What You'll Achieve**

- **Server Computer**: Runs the backend and database
- **Client Computers**: Access the application through web browsers
- **Network Access**: All computers on the same LAN can use the system

---

## 🖥️ **Step 1: Identify Server Computer**

Choose one computer as the **server** (the most powerful one recommended):
- This will run PostgreSQL database
- This will run Node.js backend
- This computer must be ON for others to access the system

---

## 🔍 **Step 2: Find Server IP Address**

### On Windows Server Computer:

1. Open **Command Prompt** (Win + R → type `cmd` → Enter)
2. Type this command:
   ```bash
   ipconfig
   ```
3. Look for **"IPv4 Address"** under your active network adapter:
   ```
   Wireless LAN adapter Wi-Fi:
      IPv4 Address. . . . . . . . . . . : 192.168.1.100
   ```
   OR
   ```
   Ethernet adapter Ethernet:
      IPv4 Address. . . . . . . . . . . : 192.168.1.100
   ```

4. **Write down this IP address** (example: `192.168.1.100`)

### On Linux Server Computer:
```bash
ip addr show
# OR
hostname -I
```

### On macOS Server Computer:
```bash
ifconfig | grep "inet "
```

---

## ⚙️ **Step 3: Configure Backend for LAN Access**

### File to Change: `backend\.env`

**Location**: `c:\Users\maju\Pictures\rishab\cash\backend\.env`

#### BEFORE (localhost only):
```env
DB_HOST=localhost
PORT=5000
NODE_ENV=production
```

#### AFTER (LAN access enabled):
```env
# Database Configuration - Keep localhost for database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mrn_cash_book
DB_USER=postgres
DB_PASSWORD=your_password_here

# Server Configuration - THIS IS THE KEY CHANGE
PORT=5000
HOST=0.0.0.0          # ← ADD THIS LINE (accepts connections from any IP)
NODE_ENV=production

# Security
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d
```

**Key Change**: Add `HOST=0.0.0.0` to accept connections from all network IPs

---

### File to Change: `backend\server.js`

**Location**: `c:\Users\maju\Pictures\rishab\cash\backend\server.js`

#### Find this section (around line 50-60):
```javascript
const PORT = process.env.PORT || 5000;
```

#### Change to:
```javascript
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';  // ← ADD THIS LINE

// Later in the file, find app.listen() and change it:
app.listen(PORT, HOST, () => {  // ← ADD HOST parameter
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📡 LAN Access: http://YOUR_SERVER_IP:${PORT}`);
});
```

**Key Changes**:
1. Add `HOST` constant with value `0.0.0.0`
2. Pass `HOST` to `app.listen()`

---

## 🔥 **Step 4: Configure Windows Firewall (Server Computer)**

The backend won't be accessible without firewall rules!

### Method 1: Using Windows Firewall GUI (Easiest)

1. Open **Windows Defender Firewall**:
   - Press Win + R
   - Type: `wf.msc`
   - Press Enter

2. Click **"Inbound Rules"** (left sidebar)

3. Click **"New Rule..."** (right sidebar)

4. **Rule Type**: Select "Port" → Next

5. **Protocol and Ports**:
   - Select "TCP"
   - Specific local ports: `5000`
   - Click Next

6. **Action**: Select "Allow the connection" → Next

7. **Profile**: Check all boxes:
   - ✅ Domain
   - ✅ Private
   - ✅ Public
   - Click Next

8. **Name**:
   - Name: `MRN Backend Server`
   - Description: `Allow access to MRN Transaction System on port 5000`
   - Click Finish

9. **Repeat for PostgreSQL** (if clients need direct DB access - NOT recommended):
   - Same steps, but use port `5432`
   - Name: `PostgreSQL Database`

### Method 2: Using Command Prompt (Advanced)

Run Command Prompt **as Administrator**:

```bash
# Allow backend port 5000
netsh advfirewall firewall add rule name="MRN Backend Server" dir=in action=allow protocol=TCP localport=5000

# (Optional) Allow PostgreSQL port 5432
netsh advfirewall firewall add rule name="PostgreSQL Database" dir=in action=allow protocol=TCP localport=5432
```

---

## 🌐 **Step 5: Configure Frontend for LAN Access**

### File to Change: `frontend\.env` (if exists)

**Location**: `c:\Users\maju\Pictures\rishab\cash\frontend\.env`

If this file doesn't exist, **create it**:

#### BEFORE (or doesn't exist):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### AFTER (replace with YOUR server IP):
```env
# Replace 192.168.1.100 with YOUR server IP from Step 2
REACT_APP_API_URL=http://192.168.1.100:5000/api
```

**IMPORTANT**: Replace `192.168.1.100` with the actual IP address you found in Step 2!

---

### File to Change: `frontend\src\config\api.ts` (or similar)

**Location**: Check these files:
- `frontend\src\config\api.ts`
- `frontend\src\services\api.ts`
- `frontend\src\utils\api.ts`

#### Find this code:
```typescript
const API_URL = 'http://localhost:5000/api';
```

#### Change to (use YOUR server IP):
```typescript
// Replace 192.168.1.100 with YOUR server IP from Step 2
const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.100:5000/api';
```

**IMPORTANT**: Replace `192.168.1.100` with YOUR actual server IP!

---

### Rebuild Frontend with New Configuration

After changing the API URL, you **MUST** rebuild:

```bash
cd frontend
npm run build
```

This creates a new production build with the updated IP address.

---

## 🔧 **Step 6: Configure PostgreSQL for LAN Access** (Optional - Only if needed)

**Note**: Usually NOT needed. Backend connects to PostgreSQL locally. Only change this if you have specific requirements.

### File to Change: `postgresql.conf`

**Location** (Windows): `C:\Program Files\PostgreSQL\14\data\postgresql.conf`

#### Find this line (around line 59):
```conf
#listen_addresses = 'localhost'
```

#### Change to:
```conf
listen_addresses = '*'          # ← Remove # and change to *
```

---

### File to Change: `pg_hba.conf`

**Location** (Windows): `C:\Program Files\PostgreSQL\14\data\pg_hba.conf`

#### Add this line at the end:
```conf
# Allow connections from local network (192.168.x.x)
host    all    all    192.168.0.0/16    md5
```

**Restart PostgreSQL** after these changes:
```bash
# Windows - Run as Administrator
net stop postgresql-x64-14
net start postgresql-x64-14
```

---

## 🚀 **Step 7: Start Server with LAN Configuration**

On the **server computer**:

### Terminal 1 - Start Backend:
```bash
cd c:\Users\maju\Pictures\rishab\cash\backend
node server.js
```

**Expected output**:
```
🚀 Server running on http://0.0.0.0:5000
📡 LAN Access: http://192.168.1.100:5000
✅ Database connected successfully
```

### Terminal 2 - Serve Frontend:
```bash
cd c:\Users\maju\Pictures\rishab\cash\frontend
npx serve -s build -l 3000
```

**Expected output**:
```
Serving build on http://0.0.0.0:3000
```

---

## 💻 **Step 8: Access from Client Computers**

On **any other computer** on the same LAN:

1. Open web browser (Chrome/Firefox/Edge)

2. Type this URL (replace with YOUR server IP):
   ```
   http://192.168.1.100:3000
   ```

3. You should see the **MRN INDUSTRIES login page**

4. Log in with credentials:
   - Username: `admin`
   - Password: `admin123`

---

## ✅ **Verification Checklist**

### On Server Computer:
- [ ] Backend running on port 5000
- [ ] Frontend build served on port 3000
- [ ] Firewall rules created for ports 5000 and 3000
- [ ] IP address noted (e.g., 192.168.1.100)

### On Client Computer:
- [ ] Can ping server: `ping 192.168.1.100`
- [ ] Can access frontend: `http://192.168.1.100:3000`
- [ ] Can log in successfully
- [ ] Can create transactions
- [ ] Can view reports

---

## 🔍 **Troubleshooting LAN Issues**

### Problem: Cannot Access from Client Computer
**Error**: "This site can't be reached" or "Connection refused"

**Solution**:
1. **Check network connectivity**:
   ```bash
   # On client computer
   ping 192.168.1.100
   ```
   - If ping fails: Check network cables/WiFi connection
   - If ping succeeds but website doesn't load: Check firewall

2. **Check firewall rules** (on server):
   ```bash
   # Run as Administrator
   netsh advfirewall firewall show rule name="MRN Backend Server"
   ```
   - If "No rules match": Firewall rule not created, repeat Step 4

3. **Check if backend is listening**:
   ```bash
   # On server computer
   netstat -ano | findstr :5000
   ```
   - Should show: `0.0.0.0:5000` (not `127.0.0.1:5000`)
   - If shows `127.0.0.1`: Backend not configured for LAN, check Step 3

---

### Problem: Wrong IP Address in Frontend
**Error**: API calls failing, network errors

**Solution**:
1. Open browser console (F12)
2. Check which URL is being called
3. If wrong, update `frontend\.env` with correct IP
4. Rebuild frontend:
   ```bash
   cd frontend
   npm run build
   ```
5. Restart frontend server

---

### Problem: Server IP Changes After Restart
**Cause**: DHCP assigning different IPs

**Solution - Set Static IP**:

1. Open **Network Connections**:
   - Win + R → `ncpa.cpl`

2. Right-click active adapter → **Properties**

3. Select **"Internet Protocol Version 4 (TCP/IPv4)"** → Properties

4. Select **"Use the following IP address"**:
   - IP address: `192.168.1.100` (your current IP)
   - Subnet mask: `255.255.255.0`
   - Default gateway: `192.168.1.1` (your router IP)
   - Preferred DNS: `8.8.8.8`
   - Alternate DNS: `8.8.4.4`

5. Click **OK** → Restart computer

Now the server will always use `192.168.1.100`

---

### Problem: Multiple Networks (WiFi + Ethernet)
**Cause**: Computer has multiple network adapters

**Solution**:
1. Choose ONE network (WiFi OR Ethernet, not both)
2. Use the IP from that network
3. Disable the other adapter during use

---

## 📊 **Quick Reference Table**

| **Configuration** | **File Location** | **What to Change** |
|------------------|-------------------|-------------------|
| Backend Port | `backend\.env` | Add `HOST=0.0.0.0` |
| Backend Listen | `backend\server.js` | Add `HOST` parameter to `app.listen()` |
| Firewall Rule | Windows Firewall | Allow port 5000 (and 3000 for frontend) |
| Frontend API | `frontend\.env` | `REACT_APP_API_URL=http://SERVER_IP:5000/api` |
| Static IP | Network Adapter Properties | Set fixed IP address |

---

## 🎉 **LAN Setup Complete!**

Your MRN INDUSTRIES Transaction Management System is now accessible from all computers on your local network.

**Test from Client Computer**:
```
http://YOUR_SERVER_IP:3000
```

**Important Reminders**:
- Server computer must be ON for others to access
- All computers must be on the same network/WiFi
- If server IP changes, update frontend and rebuild

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Support**: MRN INDUSTRIES IT Department
