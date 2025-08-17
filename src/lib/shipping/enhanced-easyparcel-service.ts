/**
 * Enhanced EasyParcel Service with Caching and Monitoring
 * Performance-optimized version with integrated caching and monitoring
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 7
 */

import { EasyParcelService } from './easyparcel-service';
import { getEasyParcelCache } from '@/lib/cache/easyparcel-cache';
import { EasyParcelMonitor, withMonitoring } from '@/lib/monitoring/easyparcel-monitor';

export class EnhancedEasyParcelService extends EasyParcelService {
  private cache = getEasyParcelCache();
  private monitor = EasyParcelMonitor.getInstance();

  /**
   * Enhanced rate calculation with caching
   */
  async calculateRates(request: any): Promise<any> {
    const operation = 'rate_calculation';
    const startTime = Date.now();

    try {
      // Check cache first
      const cachedRates = await this.cache.getCachedRates(request);
      if (cachedRates) {
        this.monitor.recordAPICall(operation, startTime, true, undefined, { 
          cached: true, 
          rateCount: cachedRates.length 
        });
        return { rates: cachedRates };
      }

      // Call parent method
      const result = await super.calculateRates(request);

      // Cache the result
      if (result.rates && result.rates.length > 0) {
        await this.cache.cacheRates(request, result.rates);
      }

      this.monitor.recordAPICall(operation, startTime, true, undefined, { 
        cached: false, 
        rateCount: result.rates?.length || 0 
      });

      return result;

    } catch (error) {
      this.monitor.recordAPICall(operation, startTime, false, error);
      throw error;
    }
  }

  /**
   * Enhanced shipment booking with monitoring
   */
  async bookShipment(request: any): Promise<any> {
    const operation = 'shipment_booking';
    const startTime = Date.now();

    try {
      const result = await super.bookShipment(request);

      this.monitor.recordAPICall(operation, startTime, true, undefined, {
        shipmentId: result.shipment_id,
        reference: request.reference
      });

      return result;

    } catch (error) {
      this.monitor.recordAPICall(operation, startTime, false, error, {
        reference: request.reference
      });

      // Record failed shipment for alerting
      if (request.reference) {
        this.monitor.recordFailedShipment(
          request.reference, 
          error instanceof Error ? error.message : 'Booking failed',
          { request }
        );
      }

      throw error;
    }
  }

  /**
   * Enhanced label generation with monitoring
   */
  async generateLabel(shipmentId: string): Promise<Buffer> {
    const operation = 'label_generation';
    const startTime = Date.now();

    try {
      const result = await super.generateLabel(shipmentId);

      this.monitor.recordAPICall(operation, startTime, true, undefined, {
        shipmentId,
        labelSize: result.length
      });

      return result;

    } catch (error) {
      this.monitor.recordAPICall(operation, startTime, false, error, {
        shipmentId
      });

      throw error;
    }
  }

  /**
   * Enhanced tracking with caching and monitoring
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    const operation = 'tracking';
    const startTime = Date.now();

    try {
      // For tracking, we can cache results for a shorter period (5 minutes)
      const cacheKey = `tracking:${trackingNumber}`;
      const cached = await this.cache.getCachedValidation(cacheKey);
      
      if (cached) {
        this.monitor.recordAPICall(operation, startTime, true, undefined, { 
          cached: true, 
          trackingNumber 
        });
        return cached;
      }

      const result = await super.trackShipment(trackingNumber);

      // Cache tracking result for 5 minutes
      await this.cache.cacheValidation(cacheKey, result);

      this.monitor.recordAPICall(operation, startTime, true, undefined, { 
        cached: false, 
        trackingNumber,
        status: result.status
      });

      return result;

    } catch (error) {
      this.monitor.recordAPICall(operation, startTime, false, error, {
        trackingNumber
      });

      throw error;
    }
  }

  /**
   * Enhanced pickup scheduling with monitoring
   */
  async schedulePickup(request: any): Promise<any> {
    const operation = 'pickup_scheduling';
    const startTime = Date.now();

    try {
      const result = await super.schedulePickup(request);

      this.monitor.recordAPICall(operation, startTime, true, undefined, {
        shipmentCount: request.shipment_ids?.length || 0,
        pickupDate: request.pickup_date
      });

      return result;

    } catch (error) {
      this.monitor.recordAPICall(operation, startTime, false, error, {
        shipmentCount: request.shipment_ids?.length || 0
      });

      throw error;
    }
  }

  /**
   * Validate Malaysian address with caching
   */
  async validateMalaysianAddress(address: any): Promise<any> {
    const operation = 'address_validation';
    const startTime = Date.now();

    try {
      const addressKey = `${address.postcode}_${address.state}`;
      const cached = await this.cache.getCachedValidation(addressKey);
      
      if (cached) {
        this.monitor.recordAPICall(operation, startTime, true, undefined, { 
          cached: true, 
          postcode: address.postcode 
        });
        return cached;
      }

      // Perform validation (this would be implemented in the parent class)
      const validationResult = await this.performAddressValidation(address);

      // Cache validation result
      await this.cache.cacheValidation(addressKey, validationResult);

      this.monitor.recordAPICall(operation, startTime, true, undefined, { 
        cached: false, 
        postcode: address.postcode,
        valid: validationResult.isValid
      });

      return validationResult;

    } catch (error) {
      this.monitor.recordAPICall(operation, startTime, false, error, {
        postcode: address.postcode
      });

      throw error;
    }
  }

  /**
   * Get available services with caching
   */
  async getAvailableServices(region: string = 'MY'): Promise<any[]> {
    const operation = 'get_services';
    const startTime = Date.now();

    try {
      const cached = await this.cache.getCachedServiceList(region);
      if (cached) {
        this.monitor.recordAPICall(operation, startTime, true, undefined, { 
          cached: true, 
          region,
          serviceCount: cached.length 
        });
        return cached;
      }

      // Fetch services from API (this would be implemented in the parent class)
      const services = await this.fetchAvailableServices(region);

      // Cache services list
      await this.cache.cacheServiceList(region, services);

      this.monitor.recordAPICall(operation, startTime, true, undefined, { 
        cached: false, 
        region,
        serviceCount: services.length 
      });

      return services;

    } catch (error) {
      this.monitor.recordAPICall(operation, startTime, false, error, {
        region
      });

      throw error;
    }
  }

  /**
   * Bulk operations with enhanced monitoring
   */
  async bulkBookShipments(requests: any[]): Promise<any[]> {
    const operation = 'bulk_booking';
    const startTime = Date.now();
    const results: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      for (const request of requests) {
        try {
          const result = await this.bookShipment(request);
          results.push({ success: true, result, request: request.reference });
          successCount++;
        } catch (error) {
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error', 
            request: request.reference 
          });
          failedCount++;
        }
      }

      this.monitor.recordAPICall(operation, startTime, true, undefined, {
        totalRequests: requests.length,
        successCount,
        failedCount,
        successRate: successCount / requests.length
      });

      return results;

    } catch (error) {
      this.monitor.recordAPICall(operation, startTime, false, error, {
        totalRequests: requests.length,
        processedCount: results.length
      });

      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStatistics(): Promise<any> {
    return await this.cache.getCacheStats();
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStatistics(timeRange: number = 60 * 60 * 1000): any {
    return this.monitor.getStats(timeRange);
  }

  /**
   * Clear specific cache entries
   */
  async invalidateCache(pattern: string): Promise<number> {
    return await this.cache.invalidateCache(pattern);
  }

  /**
   * Force refresh cache for specific operation
   */
  async refreshRatesCache(request: any): Promise<any> {
    // Clear existing cache
    await this.cache.invalidateCache(`rate:${request.pickup_address.postcode}*`);
    
    // Fetch fresh data
    return await this.calculateRates(request);
  }

  /**
   * Health check with cache and monitoring status
   */
  async healthCheck(): Promise<{
    api: boolean;
    cache: boolean;
    monitoring: boolean;
    performance: any;
  }> {
    const startTime = Date.now();

    try {
      // Test API connectivity
      const apiHealth = await this.testAPIConnectivity();
      
      // Test cache
      const cacheHealth = await this.testCacheConnectivity();
      
      // Get monitoring stats
      const monitoringStats = this.monitor.getStats(60 * 60 * 1000);
      const monitoringHealth = monitoringStats.totalRequests > 0;

      const result = {
        api: apiHealth,
        cache: cacheHealth,
        monitoring: monitoringHealth,
        performance: {
          responseTime: Date.now() - startTime,
          errorRate: monitoringStats.errorRate,
          averageResponseTime: monitoringStats.averageResponseTime
        }
      };

      this.monitor.recordAPICall('health_check', startTime, true, undefined, result);

      return result;

    } catch (error) {
      this.monitor.recordAPICall('health_check', startTime, false, error);
      throw error;
    }
  }

  /**
   * Test API connectivity
   */
  private async testAPIConnectivity(): Promise<boolean> {
    try {
      // Simple API test - could be account info or ping endpoint
      const response = await fetch(`${process.env.EASYPARCEL_BASE_URL}/account`, {
        method: 'GET',
        headers: this.getHeaders(),
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test cache connectivity
   */
  private async testCacheConnectivity(): Promise<boolean> {
    try {
      const testKey = 'test_connectivity';
      const testData = { test: true, timestamp: Date.now() };
      
      await this.cache.cacheValidation(testKey, testData);
      const retrieved = await this.cache.getCachedValidation(testKey);
      
      return retrieved !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Placeholder for address validation implementation
   */
  private async performAddressValidation(address: any): Promise<any> {
    // This would implement actual address validation logic
    // For now, return a mock validation result
    return {
      isValid: true,
      details: {
        postcode: address.postcode,
        state: address.state,
        city: address.city
      }
    };
  }

  /**
   * Placeholder for fetching available services
   */
  private async fetchAvailableServices(region: string): Promise<any[]> {
    // This would implement actual service fetching logic
    // For now, return mock services
    return [
      { id: 'STD', name: 'Standard', type: 'STANDARD' },
      { id: 'EXP', name: 'Express', type: 'EXPRESS' },
      { id: 'ONT', name: 'Overnight', type: 'OVERNIGHT' }
    ];
  }
}

// Export monitored versions of common functions
export const monitoredCalculateRates = withMonitoring('calculate_rates', 
  (service: EnhancedEasyParcelService, request: any) => service.calculateRates(request)
);

export const monitoredBookShipment = withMonitoring('book_shipment',
  (service: EnhancedEasyParcelService, request: any) => service.bookShipment(request)
);

export const monitoredTrackShipment = withMonitoring('track_shipment',
  (service: EnhancedEasyParcelService, trackingNumber: string) => service.trackShipment(trackingNumber)
);