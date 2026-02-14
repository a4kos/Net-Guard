@echo off
REM Installation script for Windows

echo ======================================
echo Extension Security Monitor Setup
echo ======================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed
    echo Please install Python 3.8 or higher from python.org
    pause
    exit /b 1
)

echo Python found
echo.

REM Run the Python installation script
python "%~dp0install.py"

pause
