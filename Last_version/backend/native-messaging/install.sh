#!/bin/bash
# Installation script for Unix-like systems (Linux/macOS)

echo "======================================"
echo "Extension Security Monitor Setup"
echo "======================================"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"
echo ""

# Run the Python installation script
python3 "$(dirname "$0")/install.py"
