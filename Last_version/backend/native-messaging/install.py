#!/usr/bin/env python3
"""
Installation script for native messaging host
Automatically configures the native messaging bridge for Chrome/Firefox
"""
from typing import Any  
import os
import sys
import json
import platform
import shutil
from pathlib import Path



def get_chrome_native_messaging_path():
    """Get the Chrome native messaging hosts directory"""
    system = platform.system()
    
    if system == "Windows":
    # Using .get('VAR', '') ensures we always have a string, even if empty
     local_app_data = os.environ.get('LOCALAPPDATA', '')
     return Path(local_app_data) / 'Google' / 'Chrome' / 'User Data' / 'NativeMessagingHosts'
    elif system == "Darwin":  # macOS
        return Path.home() / 'Library' / 'Application Support' / 'Google' / 'Chrome' / 'NativeMessagingHosts'
    else:  # Linux
        return Path.home() / '.config' / 'google-chrome' / 'NativeMessagingHosts'


def get_firefox_native_messaging_path():
    """Get the Firefox native messaging hosts directory"""
    system = platform.system()
    
    if system == "Windows":
     app_data = os.environ.get('APPDATA', '')
     return Path(app_data) / 'Mozilla' / 'NativeMessagingHosts'
    elif system == "Darwin":  # macOS
        return Path.home() / 'Library' / 'Application Support' / 'Mozilla' / 'NativeMessagingHosts'
    else:  # Linux
        return Path.home() / '.mozilla' / 'native-messaging-hosts'


def get_edge_native_messaging_path():
    """Get the Edge native messaging hosts directory"""
    system = platform.system()
    
    if system == "Windows":
     local_app_data = os.environ.get('LOCALAPPDATA', '')
     return Path(local_app_data) / 'Microsoft' / 'Edge' / 'User Data' / 'NativeMessagingHosts'
    elif system == "Darwin":  # macOS
        return Path.home() / 'Library' / 'Application Support' / 'Microsoft Edge' / 'NativeMessagingHosts'
    else:  # Linux
        return Path.home() / '.config' / 'microsoft-edge' / 'NativeMessagingHosts'
    
def create_manifest(app_path: Path, extension_id: str, browser: str = 'chrome'):
    
    # Explicitly type the dictionary as allowing Any value type
    manifest: dict[str, Any] = {
        "name": "com.security.extension_monitor",
        "description": "Extension Security Monitor - Native Messaging Host",
        "path": str(app_path.absolute()),
        "type": "stdio"
    }
    
    if browser == 'firefox':
        manifest["allowed_extensions"] = ["extension-monitor@security.local"]
    else:
        manifest["allowed_origins"] = [f"chrome-extension://{extension_id}/"]
    
    return manifest
    return manifest


def make_executable(path):
    """Make the app.py file executable on Unix systems"""
    if platform.system() != "Windows":
        os.chmod(path, 0o755)


def add_shebang(app_path):
    """Add shebang to app.py if not present"""
    with open(app_path, 'r') as f:
        content = f.read()
    
    if not content.startswith('#!'):
        python_path = shutil.which('python3') or shutil.which('python')
        shebang = f'#!{python_path}\n'
        
        with open(app_path, 'w') as f:
            f.write(shebang + content)
        
        print(f"✓ Added shebang to {app_path}")


def install_for_browser(browser_name, manifest_path, manifest_content):
    """Install manifest for a specific browser"""
    try:
        # Create directory if it doesn't exist
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write manifest file
        manifest_file = manifest_path / 'com.security.extension_monitor.json'
        with open(manifest_file, 'w') as f:
            json.dump(manifest_content, f, indent=2)
        
        print(f"✓ Installed native messaging host for {browser_name}")
        print(f"  Location: {manifest_file}")
        return True
        
    except Exception as e:
        print(f"✗ Failed to install for {browser_name}: {e}")
        return False


def main():
    print("=" * 60)
    print("Extension Security Monitor - Native Messaging Setup")
    print("=" * 60)
    print()
    
    # Get the desktop app path
    script_dir = Path(__file__).parent.parent
    app_path = script_dir / 'desktop-app' / 'app.py'
    
    if not app_path.exists():
        print(f"✗ Error: Could not find app.py at {app_path}")
        sys.exit(1)
    
    print(f"Desktop app location: {app_path}")
    print()
    
    # Make app.py executable on Unix
    if platform.system() != "Windows":
        add_shebang(app_path)
        make_executable(app_path)
        print("✓ Made app.py executable")
        print()
    
    # Get extension ID
    print("Please enter your Chrome extension ID:")
    print("(You can find this at chrome://extensions/ with Developer mode enabled)")
    extension_id = input("Extension ID: ").strip()
    
    if not extension_id:
        print("✗ Extension ID is required")
        sys.exit(1)
    
    print()
    print("Select browsers to configure:")
    print("1. Chrome")
    print("2. Firefox")
    print("3. Edge")
    print("4. All browsers")
    choice = input("Enter choice (1-4): ").strip()
    
    print()
    print("Installing native messaging host...")
    print()
    
    success_count = 0
    
    # Install for selected browsers
    if choice in ['1', '4']:
        chrome_path = get_chrome_native_messaging_path()
        chrome_manifest = create_manifest(app_path, extension_id, 'chrome')
        if install_for_browser('Chrome', chrome_path, chrome_manifest):
            success_count += 1
    
    if choice in ['2', '4']:
        firefox_path = get_firefox_native_messaging_path()
        firefox_manifest = create_manifest(app_path, extension_id, 'firefox')
        if install_for_browser('Firefox', firefox_path, firefox_manifest):
            success_count += 1
    
    if choice in ['3', '4']:
        edge_path = get_edge_native_messaging_path()
        edge_manifest = create_manifest(app_path, extension_id, 'chrome')
        if install_for_browser('Edge', edge_path, edge_manifest):
            success_count += 1
    
    print()
    print("=" * 60)
    if success_count > 0:
        print(f"✓ Successfully installed for {success_count} browser(s)")
        print()
        print("Next steps:")
        print("1. Start the desktop app: python desktop-app/app.py")
        print("2. Load the extension in your browser")
        print("3. Open the dashboard at http://127.0.0.1:5000")
        print("4. The extension will now communicate with the desktop app!")
    else:
        print("✗ Installation failed")
        print("Please check the error messages above")
    print("=" * 60)


if __name__ == '__main__':
    main()
