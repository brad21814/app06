#!/bin/bash

echo "🚀 ngrok Setup for TeamTourny Development"
echo "========================================"
echo ""

# Check if ngrok is already installed
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok is already installed!"
    ngrok version
    echo ""
    echo "To authenticate ngrok, run:"
    echo "  ngrok authtoken YOUR_TOKEN"
    echo ""
    echo "You can get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo ""
    echo "After authentication, you can run: ./start_dev.sh"
    exit 0
fi

echo "❌ ngrok is not installed. Let's set it up!"
echo ""

# Detect OS and provide installation instructions
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📱 macOS detected"
    echo ""
    echo "Install ngrok using Homebrew:"
    echo "  brew install ngrok"
    echo ""
    echo "Or download from: https://ngrok.com/download"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Linux detected"
    echo ""
    echo "Install ngrok using snap:"
    echo "  sudo snap install ngrok"
    echo ""
    echo "Or download from: https://ngrok.com/download"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "🪟 Windows detected"
    echo ""
    echo "Install ngrok using Chocolatey:"
    echo "  choco install ngrok"
    echo ""
    echo "Or download from: https://ngrok.com/download"
else
    echo "❓ Unknown OS. Please visit: https://ngrok.com/download"
fi

echo ""
echo "📋 Manual Installation Steps:"
echo "1. Visit https://ngrok.com/download"
echo "2. Download ngrok for your platform"
echo "3. Extract the binary to a location in your PATH"
echo "4. Sign up for a free account at https://ngrok.com"
echo "5. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken"
echo "6. Run: ngrok authtoken YOUR_TOKEN"
echo ""
echo "After installation, run this script again to verify setup." 