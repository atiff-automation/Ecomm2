# Advanced Caching Guide - JRM E-commerce Platform

## Overview

The JRM E-commerce platform implements a sophisticated multi-layer caching system using Redis and in-memory caching to deliver exceptional performance. This system provides automatic cache management, intelligent invalidation, and comprehensive monitoring.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  - React Server Components                                  │
│  - API Routes                                              │
│  - Service Layer (Products, Cart, Auth)                   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   CACHE MANAGER                             │
│  - Strategy Selection                                       │
│  - Multi-layer Coordination                               │
│  - Fallback Management                                     │
└─────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│        REDIS CACHE          │  │      MEMORY CACHE           │
│  - Persistent               │  │  - Fast Access             │
│  - Scalable                 │  │  - Fallback                │
│  - Tag-based Invalidation   │  │  - Local to Instance       │
│  - Compression              │  │  - Auto-cleanup            │
└─────────────────────────────┘  └─────────────────────────────┘
```

## Cache Strategies

### 1. Products Strategy
- **Primary**: Redis
- **Fallback**: Memory
- **TTL**: 1 hour
- **Use Cases**: Product listings, individual products, categories

### 2. Search Strategy
- **Primary**: Redis
- **Fallback**: Memory
- **TTL**: 15 minutes
- **Use Cases**: Search results, filters, facets

### 3. Session Strategy
- **Primary**: Redis only
- **Fallback**: None
- **TTL**: 24 hours
- **Use Cases**: User sessions, authentication state

### 4. Cart Strategy
- **Primary**: Redis
- **Fallback**: Memory
- **TTL**: 30 minutes
- **Use Cases**: Shopping cart data, user preferences

### 5. API Strategy
- **Primary**: Memory only
- **Fallback**: None
- **TTL**: 5 minutes
- **Use Cases**: Fast API responses, temporary data

### 6. Static Strategy
- **Primary**: Redis
- **Fallback**: Memory
- **TTL**: 24 hours
- **Use Cases**: Configuration, system settings, categories

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_KEY_PREFIX=jrm-ecommerce
REDIS_DEFAULT_TTL=3600

# Cache Settings
CACHE_ENABLED=true
CACHE_WARMUP_ENABLED=true
CACHE_COMPRESSION_THRESHOLD=1024
```

### Application Configuration

```typescript
// next.config.mjs
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['ioredis'],
  },
  // Redis connection in serverless environments
  serverRuntimeConfig: {
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  },
};
```

## Usage Examples

### Basic Caching

```typescript
import { cacheManager } from '@/lib/cache';

// Simple get/set
await cacheManager.set('user:123', userData, { ttl: 3600 });
const user = await cacheManager.get('user:123');

// Get or set pattern
const products = await cacheManager.getOrSet(
  'products:featured',
  async () => await fetchFeaturedProducts(),
  { strategy: 'products', ttl: 3600 }
);
```

### Using Decorators

```typescript
import { Cached, InvalidateCache } from '@/lib/cache';

class ProductService {
  @Cached({
    strategy: 'products',
    ttl: 3600,
    tags: ['products', 'catalog'],
  })
  async getProducts(params: ProductParams) {
    // This method's results will be cached automatically
    return await this.fetchProductsFromAPI(params);
  }

  @InvalidateCache({
    tags: ['products', 'catalog'],
    patterns: ['products:*'],
  })
  async updateProduct(id: string, data: ProductData) {
    // This will invalidate related caches after execution
    return await this.updateProductInAPI(id, data);
  }
}
```

### Cache Strategies

```typescript
import { enhancedProductService } from '@/lib/cache';

// Automatically cached with optimal strategy
const products = await enhancedProductService.getProducts({
  page: 1,
  limit: 20,
  category: 'electronics'
});

// Search with intelligent caching
const searchResults = await enhancedProductService.searchProducts(
  'laptop',
  { category: 'electronics' }
);
```

## Cache Warming

### Automatic Warming

The system automatically warms up critical caches on startup:

```typescript
// Registered warming tasks
CacheWarmer.register('featured-products', async () => {
  await enhancedProductService.getFeaturedProducts(20);
});

CacheWarmer.register('top-categories', async () => {
  await categoryService.getMainCategories();
});

// Run warming
await CacheWarmer.warmUp(['featured-products', 'top-categories']);
```

### Scheduled Warming

```typescript
import { cacheWarmingScheduler, DEFAULT_WARMING_SCHEDULES } from '@/lib/cache';

// Start scheduled warming
cacheWarmingScheduler.start(DEFAULT_WARMING_SCHEDULES);

// Custom schedule
cacheWarmingScheduler.start([
  {
    name: 'daily-reports',
    task: ['sales-reports', 'analytics'],
    interval: 24 * 60 * 60 * 1000, // 24 hours
  }
]);
```

## Cache Invalidation

### Tag-based Invalidation

```typescript
// Invalidate all product-related caches
await cacheManager.invalidateByTags(['products']);

// Invalidate specific tags
await cacheManager.invalidateByTags(['products', 'categories']);
```

### Pattern-based Invalidation

```typescript
// Invalidate all user-specific caches
await cacheManager.clearByPattern('user:*');

// Invalidate product category caches
await cacheManager.clearByPattern('products:category:*');
```

### Automatic Invalidation

```typescript
// Decorators handle invalidation automatically
@InvalidateCache({
  tags: ['products'],
  patterns: ['search:products:*']
})
async updateProductPrice(productId: string, newPrice: number) {
  // Cache automatically invalidated after successful update
  return await this.updatePrice(productId, newPrice);
}
```

## Monitoring and Analytics

### Health Checks

```typescript
// Check cache system health
const health = await cacheManager.healthCheck();
console.log('Redis status:', health.redis.status);
console.log('Memory cache size:', health.memory.size);

// Get detailed statistics
const stats = await cacheManager.getStats();
console.log('Hit rate:', stats.redis.hitRate + '%');
console.log('Memory usage:', stats.redis.memory);
```

### Performance Monitoring

```typescript
// Monitor cache performance with decorators
@MonitorPerformance({ slowThreshold: 1000, logSlow: true })
async getExpensiveData(params: any) {
  // Automatically logs slow operations > 1 second
  return await this.fetchData(params);
}

// Get performance metrics
const metrics = CacheMonitor.getMetrics();
console.log('Cache hit rate:', metrics.hitRate + '%');
console.log('Slow queries:', metrics.slowQueries);
```

### Cache Statistics API

```typescript
// Add to your monitoring endpoint
import { getCacheStatistics } from '@/lib/cache';

export async function GET() {
  const stats = await getCacheStatistics();
  return Response.json(stats);
}
```

## Best Practices

### 1. Cache Key Design

```typescript
// Good - structured and predictable
const key = createCacheKey('products', 'list', { 
  category: 'electronics', 
  page: 1 
});

// Bad - unstructured
const key = `products_electronics_page_1`;
```

### 2. TTL Selection

- **Static Data**: 24 hours (categories, config)
- **Semi-static Data**: 1-6 hours (products, content)
- **Dynamic Data**: 5-30 minutes (search, user data)
- **Real-time Data**: 1-5 minutes (inventory, prices)

### 3. Cache Strategy Selection

```typescript
// Long-lived, shared data
@Cached({ strategy: 'products', ttl: 3600 })

// Fast access, temporary data
@Cached({ strategy: 'api', ttl: 300 })

// User-specific, persistent
@Cached({ strategy: 'sessions', ttl: 86400 })
```

### 4. Error Handling

```typescript
try {
  const cached = await cacheManager.get('key');
  if (!cached) {
    const fresh = await fetchFreshData();
    await cacheManager.set('key', fresh);
    return fresh;
  }
  return cached;
} catch (error) {
  console.error('Cache error:', error);
  // Always have fallback to direct data fetch
  return await fetchFreshData();
}
```

## Production Deployment

### Redis Setup

```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set memory policy
maxmemory 2gb
maxmemory-policy allkeys-lru

# Enable persistence
save 900 1
save 300 10
save 60 10000
```

### Docker Configuration

```dockerfile
# Redis container
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 2gb --maxmemory-policy allkeys-lru
    
  app:
    build: .
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis

volumes:
  redis_data:
```

### Application Startup

```typescript
// app/layout.tsx or instrumentation.ts
import { initializeCache, cacheWarmingScheduler, DEFAULT_WARMING_SCHEDULES } from '@/lib/cache';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize cache system
    const result = await initializeCache({
      enableRedis: true,
      enableWarmup: true,
      healthCheck: true,
    });

    if (result.success) {
      // Start warming scheduler
      cacheWarmingScheduler.start(DEFAULT_WARMING_SCHEDULES);
      console.log('✅ Cache system fully initialized');
    } else {
      console.error('❌ Cache initialization issues:', result.errors);
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Redis Connection Timeouts**
   ```bash
   # Check Redis status
   redis-cli ping
   
   # Check connection limits
   redis-cli config get maxclients
   ```

2. **Memory Usage High**
   ```typescript
   // Monitor memory usage
   const stats = await redisClient.getStats();
   console.log('Memory usage:', stats.memory);
   
   // Clear old cache if needed
   await redisClient.flushAll(); // Use with caution
   ```

3. **Cache Misses High**
   ```typescript
   // Check hit rate
   const metrics = CacheMonitor.getMetrics();
   if (metrics.hitRate < 80) {
     // Investigate TTL settings and warming strategies
   }
   ```

### Performance Optimization

1. **Optimize Cache Keys**
   - Use shorter keys when possible
   - Avoid deep nesting in cache keys
   - Use consistent naming patterns

2. **TTL Optimization**
   - Monitor actual data change frequency
   - Adjust TTL based on real usage patterns
   - Use different TTLs for different data types

3. **Compression**
   - Enable compression for large values
   - Monitor compression ratio
   - Balance CPU vs memory usage

## Security Considerations

### Redis Security

```bash
# Set password
requirepass your_strong_password

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""

# Bind to specific interface
bind 127.0.0.1

# Enable SSL/TLS
port 0
tls-port 6380
tls-cert-file /path/to/tls.crt
tls-key-file /path/to/tls.key
```

### Application Security

```typescript
// Sanitize cache keys
function sanitizeCacheKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9:_-]/g, '');
}

// Validate cached data
function validateCachedData(data: any): boolean {
  // Implement validation logic
  return typeof data === 'object' && data !== null;
}
```

This comprehensive caching system provides the foundation for high-performance, scalable e-commerce operations with intelligent cache management and monitoring capabilities.