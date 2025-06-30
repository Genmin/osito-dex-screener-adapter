#!/bin/bash

# Osito DEX Screener Adapter Deployment Script

echo "🚀 Deploying Osito DEX Screener Adapter..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

# Check for deployment method preference
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Docker detected. Choose deployment method:"
    echo "1. Docker Compose (recommended)"
    echo "2. Local Node.js"
    read -p "Enter choice (1 or 2): " choice
    
    if [ "$choice" = "1" ]; then
        echo "🐳 Deploying with Docker Compose..."
        docker-compose up --build -d
        echo "✅ Deployment completed! Service is running on port ${PORT:-3000}"
        echo "📊 Check status: docker-compose ps"
        echo "📋 View logs: docker-compose logs -f"
        exit 0
    fi
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    echo "   Or use Docker deployment instead."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm or use Docker deployment."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed. dist directory not found."
    exit 1
fi

echo "✅ Build completed successfully!"

# Start the server
echo "🚀 Starting server..."
npm start 