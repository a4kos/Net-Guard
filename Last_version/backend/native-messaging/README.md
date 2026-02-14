# Native Messaging Bridge Setup

This directory contains the configuration files and installation scripts for setting up the native messaging bridge between the browser extension and the Python desktop application.

## What is Native Messaging?

Native messaging allows browser extensions to communicate with native applications installed on the user's computer. In our case, it enables the Net Guard browser extension to send threat data to the Python desktop application for deep analysis.

## Quick Setup

### Automatic Installation (Recommended)

**Linux/macOS:**
\`\`\`bash
cd native-messaging
chmod +x install.sh
./install.sh
\`\`\`

**Windows:**
\`\`\`cmd
cd native-messaging
install.bat
\`\`\`

The installation script will:

1. Locate your desktop app (app.py)
2. Ask for your extension ID
3. Create and install the native messaging host manifest
4. Configure permissions

### Manual Installation

If you prefer to install manually or the automatic script doesn't work:

#### 1. Get Your Extension ID

1. Open your browser and go to:

   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Firefox: `about:debugging#/runtime/this-firefox`

2. Enable "Developer mode" (Chrome/Edge)

3. Find your Net Guard extension and copy its ID
   - Chrome/Edge: It looks like `abcdefghijklmnopqrstuvwxyz123456`
   - Firefox: Use `extension-monitor@security.local`

#### 2. Create the Manifest File

**For Chrome/Edge/Brave:**

Create a file at the appropriate location:

- **Windows:** `%LOCALAPPDATA%\Google\Chrome\User Data\NativeMessagingHosts\com.security.extension_monitor.json`
- **macOS:** `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.security.extension_monitor.json`
- **Linux:** `~/.config/google-chrome/NativeMessagingHosts/com.security.extension_monitor.json`

For Edge, replace `Google/Chrome` with `Microsoft/Edge`.

Content:
\`\`\`json
{
"name": "com.security.extension_monitor",
"description": "Extension Security Monitor - Native Messaging Host",
"path": "/absolute/path/to/your/desktop-app/app.py",
"type": "stdio",
"allowed_origins": [
"chrome-extension://YOUR_EXTENSION_ID_HERE/"
]
}
\`\`\`

**For Firefox:**

Create a file at:

- **Windows:** `%APPDATA%\Mozilla\NativeMessagingHosts\com.security.extension_monitor.json`
- **macOS:** `~/Library/Application Support/Mozilla/NativeMessagingHosts/com.security.extension_monitor.json`
- **Linux:** `~/.mozilla/native-messaging-hosts/com.security.extension_monitor.json`

Content:
\`\`\`json
{
"name": "com.security.extension_monitor",
"description": "Extension Security Monitor - Native Messaging Host",
"path": "/absolute/path/to/your/desktop-app/app.py",
"type": "stdio",
"allowed_extensions": [
"extension-monitor@security.local"
]
}
\`\`\`

#### 3. Make app.py Executable (Linux/macOS only)

\`\`\`bash
chmod +x /path/to/desktop-app/app.py
\`\`\`

Add shebang to the top of app.py:
\`\`\`python
#!/usr/bin/env python3
\`\`\`

## Testing the Connection

1. **Start the desktop app:**
   \`\`\`bash
   cd desktop-app
   python app.py
   \`\`\`

2. **Load the extension** in your browser

3. **Check the console** in the extension's background page:

   - Chrome: Go to `chrome://extensions/`, find your extension, click "background page"
   - Look for messages like `[v0] Response from desktop app:`

4. **Visit any website** - the extension should detect activity and send it to the desktop app

5. **Open the dashboard** at `http://127.0.0.1:5000` to see detected threats

## Troubleshooting

### "Native messaging host not found" error

**Cause:** The browser can't find the manifest file or the path in the manifest is incorrect.

**Solutions:**

1. Verify the manifest file is in the correct location for your browser
2. Check that the `path` in the manifest points to the correct location of `app.py`
3. Use absolute paths, not relative paths
4. On Windows, use forward slashes or escaped backslashes: `C:/Users/...` or `C:\\Users\\...`

### "Native messaging host exited" error

**Cause:** The Python script crashed or couldn't start.

**Solutions:**

1. Make sure Python 3.8+ is installed: `python3 --version`
2. Install dependencies: `pip install -r desktop-app/requirements.txt`
3. On Linux/macOS, ensure app.py is executable: `chmod +x app.py`
4. Add shebang to app.py: `#!/usr/bin/env python3`
5. Test the script manually: `python3 app.py --native`

### Extension ID mismatch

**Cause:** The extension ID in the manifest doesn't match your actual extension ID.

**Solutions:**

1. Get the correct extension ID from `chrome://extensions/`
2. Update the manifest file with the correct ID
3. Restart your browser

### Permission denied (Linux/macOS)

**Cause:** The manifest file or app.py doesn't have the correct permissions.

**Solutions:**
\`\`\`bash
chmod 644 /path/to/manifest.json
chmod +x /path/to/app.py
\`\`\`

### Multiple browser profiles

If you use multiple Chrome profiles, you may need to install the manifest for each profile:

- Chrome Profile 1: `~/.config/google-chrome/Default/NativeMessagingHosts/`
- Chrome Profile 2: `~/.config/google-chrome/Profile 1/NativeMessagingHosts/`

## How It Works

1. **Extension detects suspicious activity** on a web page
2. **Content script** sends message to background service worker
3. **Background worker** uses `chrome.runtime.connectNative()` to connect to the native app
4. **Browser** reads the manifest file to find the native app location
5. **Browser launches** the Python app with `--native` flag
6. **Communication** happens via stdin/stdout using JSON messages with 4-byte length prefixes
7. **Desktop app** receives the threat data, analyzes it, stores it, and updates the dashboard

## Security Notes

- The native messaging host can only communicate with extensions explicitly listed in the manifest
- The browser validates the manifest file location and permissions
- Communication is local-only (no network involved)
- The desktop app runs with the same permissions as the user

## Uninstallation

To remove the native messaging bridge:

1. Delete the manifest file from the browser's NativeMessagingHosts directory
2. Restart your browser
3. The extension will fall back to local storage mode

## Additional Resources

- [Chrome Native Messaging Documentation](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)
- [Firefox Native Messaging Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging)
