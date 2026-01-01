# API Setup Guide for Expo Go

## Finding Your Computer's IP Address

### Windows
1. Open Command Prompt or PowerShell
2. Run: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter
4. Example: `192.168.1.100`

### Mac/Linux
1. Open Terminal
2. Run: `ifconfig` (Mac) or `ip addr` (Linux)
3. Look for your active network interface (usually `en0` on Mac, `wlan0` or `eth0` on Linux)
4. Find the `inet` address (IPv4)
5. Example: `192.168.1.100`

## Configuring the Mobile App

1. Open `emolit/mobile/src/services/api.js`
2. Find the line: `const LOCAL_IP = "192.168.1.100";`
3. Replace `192.168.1.100` with your computer's actual IP address
4. Save the file
5. Restart Expo Go (shake device → Reload)

## Starting the Backend

Make sure your backend is running and accessible:

```powershell
cd emolit/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The `--host 0.0.0.0` is important - it makes the server accessible from other devices on your network.

## Testing Connection

1. Make sure your phone and computer are on the **same WiFi network**
2. On your phone, open Expo Go
3. Try to register - you should see better error messages if something is wrong

## Troubleshooting

### "Connection timeout" error
- Check that backend is running: `http://YOUR_IP:8000/health`
- Verify IP address is correct in `api.js`
- Ensure both devices are on same WiFi

### "Cannot connect to server" error
- Backend might not be running
- Firewall might be blocking port 8000
- IP address might be incorrect

### Still having issues?
- Try accessing `http://YOUR_IP:8000/health` from your phone's browser
- Check Windows Firewall settings
- Verify the backend logs for incoming requests
