#!/bin/bash

# LEGO Purchase Suggestion System - Development Startup Script
# Optimized for fast development startup

set -e

echo "🚀 Starting LEGO Purchase Suggestion System (Development Mode)"
echo "=============================================================="

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Clean up any existing containers
print_status "Cleaning up existing containers..."
docker-compose down --remove-orphans > /dev/null 2>&1 || true

# Remove unused Docker resources
print_status "Cleaning up unused Docker resources..."
docker system prune -f > /dev/null 2>&1 || true

# Start services in optimized order
print_status "Starting Redis cache..."
docker-compose up -d redis

print_status "Starting PostgreSQL database..."
docker-compose up -d database

# Wait for database to be ready
print_status "Waiting for database to be ready..."
timeout=60
counter=0
while ! docker-compose exec -T database pg_isready -U lego_user -d lego_purchase_system > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        print_error "Database failed to start within $timeout seconds"
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo ""
print_success "Database is ready!"

# Start backend
print_status "Starting backend API..."
docker-compose up -d backend

# Wait for backend to be ready
print_status "Waiting for backend to be ready..."
timeout=60
counter=0
while ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        print_error "Backend failed to start within $timeout seconds"
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo ""
print_success "Backend is ready!"

# Start frontend
print_status "Starting frontend..."
docker-compose up -d frontend

# Wait for frontend to be ready
print_status "Waiting for frontend to be ready..."
timeout=30
counter=0
while ! curl -s http://localhost:5500 > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        print_warning "Frontend may not be ready yet, but continuing..."
        break
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo ""

# Show status
echo ""
echo "=============================================================="
print_success "All services started successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:5500"
echo "   Backend API: http://localhost:3000"
echo "   Health Check: http://localhost:3000/api/health"
echo ""
echo "🗄️  Database:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: lego_purchase_system"
echo "   User: lego_user"
echo ""
echo "🔴 Redis:"
echo "   Host: localhost"
echo "   Port: 6379"
echo ""
echo "📊 Useful commands:"
echo "   View logs: docker-compose logs -f [service]"
echo "   Stop all: docker-compose down"
echo "   Restart: docker-compose restart [service]"
echo "   Shell access: docker-compose exec [service] sh"
echo ""
echo "=============================================================="

# Show running containers
print_status "Running containers:"
docker-compose ps

echo ""
print_success "Development environment is ready! 🎉"
