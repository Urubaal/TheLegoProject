#!/bin/bash

# LEGO Purchase Suggestion System - Quick Start Script
# Fastest way to get the system running

set -e

echo "⚡ Quick Start - LEGO Purchase Suggestion System"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Quick start with minimal checks
print_status "Starting all services..."
docker-compose up -d

# Wait a bit for services to start
print_status "Waiting for services to initialize..."
sleep 10

# Quick health check
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "System is ready!"
    echo ""
    echo "🌐 Frontend: http://localhost:5500"
    echo "🔧 Backend: http://localhost:3000"
    echo ""
    echo "For detailed logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
else
    echo "⚠️  Services are starting up. Please wait a moment and check:"
    echo "   http://localhost:3000/api/health"
    echo ""
    echo "For logs: docker-compose logs -f"
fi
