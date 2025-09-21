/**
 * Pagination Utilities
 * Centralized pagination logic following DRY principles
 * @CLAUDE.md - Systematic approach with consistent pagination patterns
 */

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  startIndex: number;
  endIndex: number;
  visiblePages: number[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Centralized pagination utility class
 * Following ExportUtils pattern for consistency
 */
export class PaginationUtils {
  /**
   * Pagination configuration - centralized settings
   * @CLAUDE.md - No hardcoded values, configurable pagination
   */
  static readonly PAGINATION_CONFIG = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    MIN_PAGE_SIZE: 1,
    VISIBLE_PAGES_COUNT: 5,
    LARGE_DATASET_THRESHOLD: 10000,
  };

  /**
   * Calculate pagination information
   * Centralized pagination calculations
   */
  static calculatePagination(
    page: number,
    pageSize: number,
    total: number
  ): PaginationInfo {
    // Validate and normalize inputs
    const normalizedPage = Math.max(1, Math.floor(page));
    const normalizedPageSize = Math.max(
      this.PAGINATION_CONFIG.MIN_PAGE_SIZE,
      Math.min(this.PAGINATION_CONFIG.MAX_PAGE_SIZE, Math.floor(pageSize))
    );
    const normalizedTotal = Math.max(0, Math.floor(total));

    // Calculate basic pagination values
    const totalPages = Math.max(1, Math.ceil(normalizedTotal / normalizedPageSize));
    const currentPage = Math.min(normalizedPage, totalPages);
    
    const startIndex = (currentPage - 1) * normalizedPageSize;
    const endIndex = Math.min(startIndex + normalizedPageSize - 1, normalizedTotal - 1);
    
    const hasNext = currentPage < totalPages;
    const hasPrevious = currentPage > 1;

    // Calculate visible page numbers for pagination controls
    const visiblePages = this.calculateVisiblePages(currentPage, totalPages);

    return {
      currentPage,
      pageSize: normalizedPageSize,
      totalItems: normalizedTotal,
      totalPages,
      hasNext,
      hasPrevious,
      startIndex: normalizedTotal > 0 ? startIndex : 0,
      endIndex: normalizedTotal > 0 ? endIndex : 0,
      visiblePages,
    };
  }

  /**
   * Calculate visible page numbers for pagination controls
   * Smart page number display with ellipsis handling
   */
  private static calculateVisiblePages(currentPage: number, totalPages: number): number[] {
    const visibleCount = this.PAGINATION_CONFIG.VISIBLE_PAGES_COUNT;
    
    if (totalPages <= visibleCount) {
      // Show all pages if total is small
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const halfVisible = Math.floor(visibleCount / 2);

    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, currentPage + halfVisible);

    // Adjust range to always show the desired number of pages
    if (end - start + 1 < visibleCount) {
      if (start === 1) {
        end = Math.min(totalPages, start + visibleCount - 1);
      } else {
        start = Math.max(1, end - visibleCount + 1);
      }
    }

    // Always include first page if not in range
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push(-1); // Ellipsis marker
      }
    }

    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Always include last page if not in range
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(-1); // Ellipsis marker
      }
      pages.push(totalPages);
    }

    return pages;
  }

  /**
   * Convert pagination config to offset-based parameters
   * Helper for database queries using offset/limit
   */
  static toOffsetLimit(config: PaginationConfig): { offset: number; limit: number } {
    const offset = (config.page - 1) * config.pageSize;
    const limit = config.pageSize;
    
    return { offset, limit };
  }

  /**
   * Convert offset-based parameters to pagination config
   * Helper for converting database pagination to frontend format
   */
  static fromOffsetLimit(
    offset: number,
    limit: number,
    total: number
  ): PaginationConfig {
    const page = Math.floor(offset / limit) + 1;
    
    return {
      page,
      pageSize: limit,
      total,
    };
  }

  /**
   * Parse pagination parameters from URL or request
   * Standardized parameter parsing with validation
   */
  static parsePaginationParams(params: Record<string, any>): {
    page: number;
    pageSize: number;
    offset: number;
  } {
    // Parse page number
    const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
    
    // Parse page size with limits
    let pageSize = parseInt(params.limit || params.pageSize || this.PAGINATION_CONFIG.DEFAULT_PAGE_SIZE.toString(), 10);
    pageSize = Math.max(
      this.PAGINATION_CONFIG.MIN_PAGE_SIZE,
      Math.min(this.PAGINATION_CONFIG.MAX_PAGE_SIZE, pageSize || this.PAGINATION_CONFIG.DEFAULT_PAGE_SIZE)
    );

    // Calculate offset
    const offset = (page - 1) * pageSize;

    return { page, pageSize, offset };
  }

  /**
   * Create pagination links for API responses
   * Generate navigation URLs for API pagination
   */
  static createPaginationLinks(
    baseUrl: string,
    pagination: PaginationInfo,
    additionalParams: Record<string, string> = {}
  ): {
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
  } {
    const createUrl = (page: number) => {
      const url = new URL(baseUrl);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', pagination.pageSize.toString());
      
      // Add additional parameters
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        }
      });
      
      return url.toString();
    };

    const links: any = {};

    // First page link
    if (pagination.currentPage > 1) {
      links.first = createUrl(1);
    }

    // Previous page link
    if (pagination.hasPrevious) {
      links.previous = createUrl(pagination.currentPage - 1);
    }

    // Next page link
    if (pagination.hasNext) {
      links.next = createUrl(pagination.currentPage + 1);
    }

    // Last page link
    if (pagination.currentPage < pagination.totalPages) {
      links.last = createUrl(pagination.totalPages);
    }

    return links;
  }

  /**
   * Paginate array data in memory
   * Client-side pagination for arrays
   */
  static paginateArray<T>(
    data: T[],
    page: number,
    pageSize: number
  ): PaginationResult<T> {
    const pagination = this.calculatePagination(page, pageSize, data.length);
    const paginatedData = data.slice(pagination.startIndex, pagination.endIndex + 1);

    return {
      data: paginatedData,
      pagination,
    };
  }

  /**
   * Create pagination summary text
   * Human-readable pagination information
   */
  static createPaginationSummary(pagination: PaginationInfo): string {
    if (pagination.totalItems === 0) {
      return 'No items found';
    }

    const start = pagination.startIndex + 1;
    const end = pagination.endIndex + 1;
    const total = pagination.totalItems;

    if (pagination.totalPages === 1) {
      if (total === 1) {
        return '1 item';
      }
      return `${total.toLocaleString()} items`;
    }

    return `Showing ${start.toLocaleString()}-${end.toLocaleString()} of ${total.toLocaleString()} items`;
  }

  /**
   * Validate pagination configuration
   * Pre-validation for pagination setup
   */
  static validatePaginationConfig(config: Partial<PaginationConfig>): {
    valid: boolean;
    errors: string[];
    normalized: PaginationConfig;
  } {
    const errors: string[] = [];

    // Validate page
    const page = Math.max(1, Math.floor(config.page || 1));
    if (config.page && (config.page < 1 || !Number.isInteger(config.page))) {
      errors.push('Page must be a positive integer');
    }

    // Validate page size
    const pageSize = Math.max(
      this.PAGINATION_CONFIG.MIN_PAGE_SIZE,
      Math.min(
        this.PAGINATION_CONFIG.MAX_PAGE_SIZE,
        Math.floor(config.pageSize || this.PAGINATION_CONFIG.DEFAULT_PAGE_SIZE)
      )
    );
    
    if (config.pageSize && (
      config.pageSize < this.PAGINATION_CONFIG.MIN_PAGE_SIZE ||
      config.pageSize > this.PAGINATION_CONFIG.MAX_PAGE_SIZE ||
      !Number.isInteger(config.pageSize)
    )) {
      errors.push(`Page size must be between ${this.PAGINATION_CONFIG.MIN_PAGE_SIZE} and ${this.PAGINATION_CONFIG.MAX_PAGE_SIZE}`);
    }

    // Validate total
    const total = Math.max(0, Math.floor(config.total || 0));
    if (config.total && (config.total < 0 || !Number.isInteger(config.total))) {
      errors.push('Total must be a non-negative integer');
    }

    return {
      valid: errors.length === 0,
      errors,
      normalized: { page, pageSize, total },
    };
  }

  /**
   * Check if pagination is needed
   * Determine if pagination controls should be shown
   */
  static isPaginationNeeded(total: number, pageSize: number): boolean {
    return total > pageSize;
  }

  /**
   * Calculate optimal page size for large datasets
   * Performance-optimized page size calculation
   */
  static calculateOptimalPageSize(totalItems: number, targetLoadTime: number = 2): number {
    // Base calculation on performance considerations
    if (totalItems <= 100) {
      return Math.min(totalItems, 20);
    }

    if (totalItems <= this.PAGINATION_CONFIG.LARGE_DATASET_THRESHOLD) {
      return 50;
    }

    // For very large datasets, use smaller page sizes for better performance
    return 25;
  }

  /**
   * Create pagination metadata for API responses
   * Standardized pagination metadata format
   */
  static createPaginationMetadata(
    pagination: PaginationInfo,
    requestTime?: number
  ): {
    pagination: {
      current_page: number;
      per_page: number;
      total_items: number;
      total_pages: number;
      has_next: boolean;
      has_previous: boolean;
    };
    performance?: {
      request_time_ms: number;
      items_per_ms: number;
    };
  } {
    const metadata: any = {
      pagination: {
        current_page: pagination.currentPage,
        per_page: pagination.pageSize,
        total_items: pagination.totalItems,
        total_pages: pagination.totalPages,
        has_next: pagination.hasNext,
        has_previous: pagination.hasPrevious,
      },
    };

    if (requestTime !== undefined) {
      metadata.performance = {
        request_time_ms: requestTime,
        items_per_ms: requestTime > 0 ? Math.round(pagination.pageSize / requestTime * 1000) / 1000 : 0,
      };
    }

    return metadata;
  }

  /**
   * Generate page jump options
   * Quick navigation options for large page sets
   */
  static generatePageJumpOptions(pagination: PaginationInfo): Array<{
    label: string;
    value: number;
    type: 'page' | 'jump';
  }> {
    const options: Array<{ label: string; value: number; type: 'page' | 'jump' }> = [];

    // Add first page
    if (pagination.currentPage > 1) {
      options.push({ label: 'First', value: 1, type: 'jump' });
    }

    // Add jump options for large datasets
    if (pagination.totalPages > 20) {
      const jumps = [
        Math.ceil(pagination.totalPages * 0.25),
        Math.ceil(pagination.totalPages * 0.5),
        Math.ceil(pagination.totalPages * 0.75),
      ].filter(page => page !== pagination.currentPage && page > 1 && page < pagination.totalPages);

      jumps.forEach(page => {
        const percentage = Math.round((page / pagination.totalPages) * 100);
        options.push({
          label: `~${percentage}% (Page ${page})`,
          value: page,
          type: 'jump',
        });
      });
    }

    // Add last page
    if (pagination.currentPage < pagination.totalPages) {
      options.push({ 
        label: `Last (${pagination.totalPages})`, 
        value: pagination.totalPages, 
        type: 'jump' 
      });
    }

    return options;
  }
}