/**
 * Redis Health Monitoring and Metrics - Production Ready
 * Following @REDIS_PRODUCTION_IMPLEMENTATION_PLAN.md architecture (lines 580-659)
 * Following @CLAUDE.md: NO hardcoding, systematic approach, centralized
 * 
 * Comprehensive Redis monitoring with health checks and performance metrics
 */

export interface RedisMetrics {
  // Cache Performance Indicators
  cacheHitRate: number;           // Target: >80% for postcodes, >60% for products
  cacheHitRatio: number;          // keyspace_hits / (keyspace_hits + keyspace_misses)
  avgResponseTime: number;        // Target: <10ms for cached operations
  operationsPerSecond: number;    // instantaneous_ops_per_sec
  totalCommands: number;          // total_commands_processed

  // Resource Utilization Metrics
  memoryUsed: number;             // used_memory in bytes
  memoryUsedHuman: string;        // used_memory_human
  memoryFragmentation: number;    // mem_fragmentation_ratio (ideal: 1.0-1.5)
  memoryMaxPolicy: string;        // maxmemory_policy
  connectedClients: number;       // connected_clients
  maxClients: number;             // maxclients

  // Reliability and Health Indicators
  evictedKeys: number;            // evicted_keys (should be minimal)
  rejectedConnections: number;    // rejected_connections (should be 0)
  expiredKeys: number;            // expired_keys
  keyspaceKeys: number;           // Total keys across all databases
  
  // System Health
  uptimeInSeconds: number;        // uptime_in_seconds
  version: string;                // redis_version
  connectionStatus: 'healthy' | 'degraded' | 'unhealthy';
  
  // Timestamps
  collectedAt: number;
  collectionDuration: number;
}

export interface RedisHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;                  // 0-100 health score
  issues: string[];
  recommendations: string[];
  criticalAlerts: string[];
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface RedisAlertThresholds {
  hitRate: { warning: number; critical: number };
  responseTime: { warning: number; critical: number };
  memoryFragmentation: { warning: number; critical: number };
  evictedKeys: { warning: number; critical: number };
  connectedClients: { warning: number; critical: number };
}

/**
 * Redis Performance Monitor and Health Checker
 * Following @CLAUDE.md: Systematic monitoring with actionable insights
 */
export class RedisMonitor {
  private redis: any;
  
  // Production alert thresholds following best practices
  private readonly ALERT_THRESHOLDS: RedisAlertThresholds = {
    hitRate: { warning: 60, critical: 40 },           // Below 60% needs attention
    responseTime: { warning: 10, critical: 50 },      // Above 10ms is concerning
    memoryFragmentation: { warning: 1.5, critical: 2.0 }, // Above 1.5 is inefficient
    evictedKeys: { warning: 100, critical: 1000 },    // Evictions indicate pressure
    connectedClients: { warning: 80, critical: 95 },  // % of max connections
  };

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  /**
   * Collect comprehensive Redis metrics
   * Following plan: Complete metrics collection for monitoring
   */
  public async getMetrics(): Promise<RedisMetrics> {
    const startTime = Date.now();
    
    try {
      // Get Redis INFO in parallel for efficiency
      const [serverInfo, statsInfo, memoryInfo, clientsInfo, keyspaceInfo] = await Promise.all([
        this.redis.info('server'),
        this.redis.info('stats'),
        this.redis.info('memory'),
        this.redis.info('clients'),
        this.redis.info('keyspace'),
      ]);
      
      // Parse all info sections
      const serverStats = this.parseRedisInfo(serverInfo);
      const statsData = this.parseRedisInfo(statsInfo);
      const memoryData = this.parseRedisInfo(memoryInfo);
      const clientsData = this.parseRedisInfo(clientsInfo);
      const keyspaceData = this.parseRedisInfo(keyspaceInfo);
      
      // Calculate derived metrics
      const totalOps = (statsData.keyspace_hits || 0) + (statsData.keyspace_misses || 0);
      const hitRate = this.calculateHitRate(statsData.keyspace_hits || 0, statsData.keyspace_misses || 0);
      const connectionStatus = await this.determineConnectionStatus();
      const keyspaceKeys = this.countTotalKeys(keyspaceData);
      
      const metrics: RedisMetrics = {
        // Cache Performance
        cacheHitRate: hitRate,
        cacheHitRatio: totalOps > 0 ? (statsData.keyspace_hits || 0) / totalOps : 0,
        avgResponseTime: await this.measureLatency(),
        operationsPerSecond: statsData.instantaneous_ops_per_sec || 0,
        totalCommands: statsData.total_commands_processed || 0,
        
        // Resource Utilization
        memoryUsed: memoryData.used_memory || 0,
        memoryUsedHuman: memoryData.used_memory_human || '0B',
        memoryFragmentation: memoryData.mem_fragmentation_ratio || 1.0,
        memoryMaxPolicy: memoryData.maxmemory_policy || 'noeviction',
        connectedClients: clientsData.connected_clients || 0,
        maxClients: clientsData.maxclients || 10000,
        
        // Reliability Indicators
        evictedKeys: statsData.evicted_keys || 0,
        rejectedConnections: statsData.rejected_connections || 0,
        expiredKeys: statsData.expired_keys || 0,
        keyspaceKeys,
        
        // System Health
        uptimeInSeconds: serverStats.uptime_in_seconds || 0,
        version: serverStats.redis_version || 'unknown',
        connectionStatus,
        
        // Timestamps
        collectedAt: Date.now(),
        collectionDuration: Date.now() - startTime,
      };
      
      return metrics;
      
    } catch (error) {
      console.error('Redis metrics collection failed:', error);
      throw new Error(`Failed to collect Redis metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform comprehensive health check with actionable insights
   * Following @CLAUDE.md: Systematic health assessment
   */
  public async performHealthCheck(): Promise<RedisHealthCheck> {
    try {
      const metrics = await this.getMetrics();
      const issues: string[] = [];
      const recommendations: string[] = [];
      const criticalAlerts: string[] = [];
      let healthScore = 100;
      
      // Assess cache performance
      if (metrics.cacheHitRate < this.ALERT_THRESHOLDS.hitRate.critical) {
        criticalAlerts.push(`Critical: Cache hit rate is ${metrics.cacheHitRate.toFixed(1)}% (below ${this.ALERT_THRESHOLDS.hitRate.critical}%)`);
        recommendations.push('Review cache warming strategy and key expiration policies');
        healthScore -= 30;
      } else if (metrics.cacheHitRate < this.ALERT_THRESHOLDS.hitRate.warning) {
        issues.push(`Warning: Cache hit rate is ${metrics.cacheHitRate.toFixed(1)}% (below ${this.ALERT_THRESHOLDS.hitRate.warning}%)`);
        recommendations.push('Consider expanding cache warming for frequently accessed data');
        healthScore -= 15;
      }
      
      // Assess response time
      if (metrics.avgResponseTime > this.ALERT_THRESHOLDS.responseTime.critical) {
        criticalAlerts.push(`Critical: Average response time is ${metrics.avgResponseTime}ms (above ${this.ALERT_THRESHOLDS.responseTime.critical}ms)`);
        recommendations.push('Check network connectivity and Redis server resources');
        healthScore -= 25;
      } else if (metrics.avgResponseTime > this.ALERT_THRESHOLDS.responseTime.warning) {
        issues.push(`Warning: Average response time is ${metrics.avgResponseTime}ms (above ${this.ALERT_THRESHOLDS.responseTime.warning}ms)`);
        recommendations.push('Monitor network latency and consider connection pooling optimization');
        healthScore -= 10;
      }
      
      // Assess memory fragmentation
      if (metrics.memoryFragmentation > this.ALERT_THRESHOLDS.memoryFragmentation.critical) {
        criticalAlerts.push(`Critical: Memory fragmentation is ${metrics.memoryFragmentation.toFixed(2)} (above ${this.ALERT_THRESHOLDS.memoryFragmentation.critical})`);
        recommendations.push('Consider Redis restart or memory defragmentation');
        healthScore -= 20;
      } else if (metrics.memoryFragmentation > this.ALERT_THRESHOLDS.memoryFragmentation.warning) {
        issues.push(`Warning: Memory fragmentation is ${metrics.memoryFragmentation.toFixed(2)} (above ${this.ALERT_THRESHOLDS.memoryFragmentation.warning})`);
        recommendations.push('Monitor memory usage patterns and consider optimization');
        healthScore -= 10;
      }
      
      // Assess key evictions
      if (metrics.evictedKeys > this.ALERT_THRESHOLDS.evictedKeys.critical) {
        criticalAlerts.push(`Critical: ${metrics.evictedKeys} keys have been evicted (above ${this.ALERT_THRESHOLDS.evictedKeys.critical})`);
        recommendations.push('Increase Redis memory allocation or optimize TTL policies');
        healthScore -= 20;
      } else if (metrics.evictedKeys > this.ALERT_THRESHOLDS.evictedKeys.warning) {
        issues.push(`Warning: ${metrics.evictedKeys} keys have been evicted (above ${this.ALERT_THRESHOLDS.evictedKeys.warning})`);
        recommendations.push('Monitor memory pressure and consider cache size optimization');
        healthScore -= 10;
      }
      
      // Assess client connections
      const connectionUtilization = (metrics.connectedClients / metrics.maxClients) * 100;
      if (connectionUtilization > this.ALERT_THRESHOLDS.connectedClients.critical) {
        criticalAlerts.push(`Critical: Connection utilization is ${connectionUtilization.toFixed(1)}% (above ${this.ALERT_THRESHOLDS.connectedClients.critical}%)`);
        recommendations.push('Increase max connections or implement connection pooling');
        healthScore -= 15;
      } else if (connectionUtilization > this.ALERT_THRESHOLDS.connectedClients.warning) {
        issues.push(`Warning: Connection utilization is ${connectionUtilization.toFixed(1)}% (above ${this.ALERT_THRESHOLDS.connectedClients.warning}%)`);
        recommendations.push('Monitor connection patterns and optimize client usage');
        healthScore -= 8;
      }
      
      // Assess rejected connections
      if (metrics.rejectedConnections > 0) {
        criticalAlerts.push(`Critical: ${metrics.rejectedConnections} connections have been rejected`);
        recommendations.push('Increase maxclients setting or optimize connection management');
        healthScore -= 25;
      }
      
      // Determine overall status and performance grade
      let status: 'healthy' | 'degraded' | 'unhealthy';
      let performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
      
      if (criticalAlerts.length > 0 || healthScore < 50) {
        status = 'unhealthy';
        performanceGrade = healthScore < 30 ? 'F' : 'D';
      } else if (issues.length > 0 || healthScore < 80) {
        status = 'degraded';
        performanceGrade = healthScore < 60 ? 'D' : healthScore < 70 ? 'C' : 'B';
      } else {
        status = 'healthy';
        performanceGrade = healthScore >= 95 ? 'A' : 'B';
      }
      
      return {
        status,
        score: Math.max(0, healthScore),
        issues,
        recommendations,
        criticalAlerts,
        performanceGrade,
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        score: 0,
        issues: [],
        recommendations: ['Check Redis connection and server status'],
        criticalAlerts: [`Failed to perform health check: ${error instanceof Error ? error.message : 'Unknown error'}`],
        performanceGrade: 'F',
      };
    }
  }

  /**
   * Get Redis connection latency
   * Following plan: Accurate latency measurement
   */
  private async measureLatency(): Promise<number> {
    const measurements: number[] = [];
    
    // Take multiple measurements for accuracy
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await this.redis.ping();
      measurements.push(Date.now() - start);
    }
    
    // Return average latency
    return measurements.reduce((sum, latency) => sum + latency, 0) / measurements.length;
  }

  /**
   * Calculate cache hit rate percentage
   * Following @CLAUDE.md: Systematic calculation approach
   */
  private calculateHitRate(hits: number, misses: number): number {
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  }

  /**
   * Parse Redis INFO command output
   * Following plan: Systematic info parsing
   */
  private parseRedisInfo(info: string): Record<string, any> {
    const lines = info.split('\r\n');
    const result: Record<string, any> = {};
    
    for (const line of lines) {
      if (line.includes(':') && !line.startsWith('#')) {
        const [key, value] = line.split(':', 2);
        if (key && value !== undefined) {
          // Parse numeric values
          const numValue = Number(value);
          result[key.trim()] = isNaN(numValue) ? value.trim() : numValue;
        }
      }
    }
    
    return result;
  }

  /**
   * Count total keys across all databases
   * Following plan: Comprehensive keyspace analysis
   */
  private countTotalKeys(keyspaceData: Record<string, any>): number {
    let totalKeys = 0;
    
    // Iterate through database entries (db0, db1, etc.)
    for (const [key, value] of Object.entries(keyspaceData)) {
      if (key.startsWith('db') && typeof value === 'string') {
        // Parse db info: "keys=1234,expires=567,avg_ttl=890123"
        const keysMatch = value.match(/keys=(\d+)/);
        if (keysMatch) {
          totalKeys += parseInt(keysMatch[1], 10);
        }
      }
    }
    
    return totalKeys;
  }

  /**
   * Determine Redis connection status
   * Following plan: Comprehensive connection assessment
   */
  private async determineConnectionStatus(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      const latency = await this.measureLatency();
      
      if (latency > 100) {
        return 'unhealthy';
      } else if (latency > 20) {
        return 'degraded';
      } else {
        return 'healthy';
      }
    } catch (error) {
      return 'unhealthy';
    }
  }

  /**
   * Log health check results with formatting
   * Following @CLAUDE.md: Centralized logging approach
   */
  public logHealthCheck(healthCheck: RedisHealthCheck): void {
    console.log(`\n📊 Redis Health Check Results:`);
    console.log(`   Status: ${this.formatStatus(healthCheck.status)}`);
    console.log(`   Score: ${healthCheck.score}/100 (Grade: ${healthCheck.performanceGrade})`);
    
    if (healthCheck.criticalAlerts.length > 0) {
      console.log(`\n🚨 Critical Alerts:`);
      healthCheck.criticalAlerts.forEach(alert => console.log(`   • ${alert}`));
    }
    
    if (healthCheck.issues.length > 0) {
      console.log(`\n⚠️ Issues:`);
      healthCheck.issues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    if (healthCheck.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      healthCheck.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
  }

  /**
   * Format status with appropriate emoji
   * Following @CLAUDE.md: User-friendly output formatting
   */
  private formatStatus(status: string): string {
    switch (status) {
      case 'healthy': return '✅ Healthy';
      case 'degraded': return '⚠️ Degraded';
      case 'unhealthy': return '❌ Unhealthy';
      default: return `❓ ${status}`;
    }
  }

  /**
   * Get Redis server information summary
   * Following plan: Essential server info collection
   */
  public async getServerInfo(): Promise<{
    version: string;
    mode: string;
    uptime: string;
    memoryUsage: string;
    keyspaceSize: number;
  }> {
    try {
      const metrics = await this.getMetrics();
      
      return {
        version: metrics.version,
        mode: 'standalone', // Could be enhanced to detect cluster/sentinel
        uptime: this.formatUptime(metrics.uptimeInSeconds),
        memoryUsage: metrics.memoryUsedHuman,
        keyspaceSize: metrics.keyspaceKeys,
      };
    } catch (error) {
      return {
        version: 'unknown',
        mode: 'unknown',
        uptime: '0s',
        memoryUsage: '0B',
        keyspaceSize: 0,
      };
    }
  }

  /**
   * Format uptime in human-readable format
   * Following @CLAUDE.md: User-friendly formatting
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

export default RedisMonitor;