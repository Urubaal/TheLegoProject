# Redis Setup for Password Reset Tokens

## Overview

This application now uses Redis to store password reset tokens instead of in-memory storage. This provides better security, scalability, and reliability.

## Why Redis?

- **Security**: Tokens are stored securely with automatic expiration (TTL)
- **Scalability**: Multiple server instances can share the same token store
- **Reliability**: Tokens persist across server restarts
- **Performance**: Fast in-memory operations with optional persistence

## Installation

### Option 1: Docker (Recommended)

```bash
# Start Redis using Docker
docker run -d --name redis-server -p 6379:6379 redis:7-alpine

# Or using docker-compose (add to your docker-compose.yml)
```

### Option 2: Local Installation

#### Windows
```bash
# Download Redis for Windows from:
# https://github.com/microsoftarchive/redis/releases
# Or use Chocolatey:
choco install redis-64
```

#### macOS
```bash
# Using Homebrew
brew install redis

# Start Redis
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Configuration

Add the following environment variables to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD= (optional - if Redis requires authentication)
```

## Testing Redis Connection

The application will automatically test the Redis connection on startup. You'll see one of these messages:

- ✅ `Redis connection established successfully`
- ❌ `Failed to establish Redis connection - password reset functionality may be limited`

## Health Check

You can check if Redis is working by looking at the server startup logs. The health check will show:

```
🔴 Redis: connected
```

## Fallback Behavior

If Redis is not available, the application will:
- Continue to function normally
- Log errors when trying to store/retrieve reset tokens
- Password reset functionality may be limited (tokens won't persist across restarts)

## Security Features

- **TTL (Time To Live)**: Tokens automatically expire after 1 hour
- **Used Token Tracking**: Tokens are marked as used and kept for 5 minutes for audit purposes
- **Secure Key Format**: Tokens are stored with `reset:` prefix
- **Error Handling**: Graceful degradation if Redis is unavailable

## Monitoring

The application logs all Redis operations:
- Token storage
- Token retrieval
- Token usage
- Connection status
- Error conditions

## Production Considerations

1. **Redis Persistence**: Configure Redis with appropriate persistence settings
2. **Memory Management**: Monitor Redis memory usage
3. **Backup Strategy**: Include Redis data in your backup strategy
4. **High Availability**: Consider Redis Cluster or Sentinel for production
5. **Security**: Use Redis AUTH if needed, and secure network access

## Troubleshooting

### Redis Connection Refused
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Check Redis logs
redis-cli info server
```

### Memory Issues
```bash
# Check Redis memory usage
redis-cli info memory

# Clear all data (use with caution)
redis-cli flushall
```

### Performance Issues
```bash
# Monitor Redis performance
redis-cli monitor

# Check slow queries
redis-cli slowlog get 10
```

## Migration from In-Memory Storage

The application automatically migrates from the old in-memory storage to Redis. No manual migration is required.

## Development

For development, you can use a simple Redis instance:

```bash
# Start Redis in foreground (for debugging)
redis-server

# Connect with CLI
redis-cli

# Monitor commands
redis-cli monitor
```
