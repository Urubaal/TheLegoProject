#!/bin/bash

# LEGO Purchase Suggestion System - Stop Script
# Gracefully stops all services

set -e

echo "🛑 Stopping LEGO Purchase Suggestion System"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed."
    exit 1
fi

# Stop services gracefully
print_status "Stopping all services..."
docker-compose down

# Remove orphaned containers
print_status "Removing orphaned containers..."
docker-compose down --remove-orphans > /dev/null 2>&1 || true

# Clean up unused resources (optional)
read -p "Do you want to clean up unused Docker resources? (y/N): " -n 1 -r
echo
if [[ $REply =~ ^[Yy]$ ]]; then
    print_status "Cleaning up unused Docker resources..."
    docker system prune -f
    print_success "Docker cleanup completed"
fi

echo ""
print_success "All services stopped successfully! 🎉"
