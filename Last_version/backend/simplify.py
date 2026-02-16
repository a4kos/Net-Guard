"""
Build script for Net Guard Desktop executable
Simplifies PyInstaller configuration for creating NetGuard-Setup.exe
"""

import subprocess
import sys
import os
from pathlib import Path


def main():
    print("=" * 70)
    print("Net Guard Desktop - Build Script")
    print("=" * 70)
    
    # Ensures we're in the right directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Step 1: Checks dependencies
    print("\n[1/4] Checking dependencies...")
    try:
        import PyInstaller
        print("✓ PyInstaller found!")
    except ImportError:
        print("✗ PyInstaller not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "PyInstaller"], check=True)
    
    # Step 2: Cleans old builds
    print("\n[2/4] Cleaning old builds...")
    for folder in ["build", "dist", "__pycache__"]:
        if Path(folder).exists():
            subprocess.run(["rmdir", "/s", "/q", folder], shell=True)
            print(f"✓ Removed {folder}")
    
    # Step 3: Builds executable
    print("\n[3/4] Building executable...")
    
    build_cmd = [
        sys.executable,
        "-m", "PyInstaller",
        "--onefile",
        "--windowed",
        "--name", "NetGuard",
        "--distpath", str(Path.cwd() / "dist"),
        "--buildpath", str(Path.cwd() / "build"),
        "--specpath", str(Path.cwd()),
        # Icon (if available)
        # "--icon=icon.ico",
        # Include data and modules
        "--collect-all", "sklearn",
        "--collect-all", "tensorflow",
        "--collect-all", "keras",
        "--hidden-import=keras",
        "--hidden-import=tensorflow",
        "--hidden-import=sklearn",
        "gui.py"
    ]
    
    print(f"Building with command:\n{' '.join(build_cmd)}\n")
    result = subprocess.run(build_cmd)
    
    if result.returncode != 0:
        print("✗ Build failed!")
        return 1
    
    print("✓ Build successful!")
    
    # Step 4: Creates installer (optional)
    print("\n[4/4] Preparing distribution...")
    exe_path = Path("dist") / "NetGuard.exe"
    if exe_path.exists():
        size_mb = exe_path.stat().st_size / (1024 * 1024)
        print(f"✓ Executable created: {exe_path.name} ({size_mb:.1f} MB)")
        print("\nBuild complete! You can now:")
        print(f"  1. Run the executable: {exe_path}")
        print(f"  2. Distribute it to users")
        print(f"  3. Upload to GitHub releases: https://github.com/a4kos/net-guard/releases")
        return 0
    else:
        print("✗ Executable not found in dist folder!")
        return 1


if __name__ == "__main__":
    sys.exit(main())
