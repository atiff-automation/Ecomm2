/**
 * Chart Data Transformation Utilities
 * Centralized chart data processing following DRY principles
 * @CLAUDE.md - Systematic approach with reusable chart utilities
 */

import { ChartData, ChartDataPoint } from './chat-analytics';

export interface ChartConfiguration {
  width?: number;
  height?: number;
  responsive?: boolean;
  theme?: 'light' | 'dark';
  colors?: string[];
  animation?: boolean;
  legend?: boolean;
  grid?: boolean;
  tooltip?: boolean;
}

export interface ProcessedChartData extends ChartData {
  config: ChartConfiguration;
  id: string;
  isEmpty: boolean;
  maxValue: number;
  minValue: number;
  total?: number;
}

/**
 * Chart utility class for centralized chart processing
 * Following performance-utils pattern for consistency
 */
export class ChartUtils {
  /**
   * Default chart configuration - centralized defaults
   * @CLAUDE.md - No hardcoded values in components, all from central config
   */
  static readonly DEFAULT_CONFIG: ChartConfiguration = {
    width: 400,
    height: 300,
    responsive: true,
    theme: 'light',
    colors: [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
    ],
    animation: true,
    legend: true,
    grid: true,
    tooltip: true,
  };

  /**
   * Generate unique chart ID for React keys and DOM elements
   */
  static generateChartId(title: string, type: string): string {
    const sanitized = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString(36);
    return `chart-${type}-${sanitized}-${timestamp}`;
  }

  /**
   * Process raw chart data with configuration and validation
   * Centralized chart data processing
   */
  static processChartData(
    chartData: ChartData,
    config: Partial<ChartConfiguration> = {}
  ): ProcessedChartData {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    const id = this.generateChartId(chartData.title, chartData.type);
    
    // Validate and clean data
    const cleanData = this.validateChartData(chartData.data);
    const isEmpty = cleanData.length === 0;
    
    // Calculate min/max values for scaling
    const values = cleanData.map(point => point.value);
    const maxValue = Math.max(...values, 0);
    const minValue = Math.min(...values, 0);
    const total = chartData.type === 'pie' ? values.reduce((sum, val) => sum + val, 0) : undefined;

    return {
      ...chartData,
      data: cleanData,
      config: mergedConfig,
      id,
      isEmpty,
      maxValue,
      minValue,
      total,
    };
  }

  /**
   * Validate and clean chart data points
   * Remove invalid data and handle edge cases
   */
  static validateChartData(data: ChartDataPoint[]): ChartDataPoint[] {
    return data
      .filter(point => {
        // Remove invalid data points
        return (
          point.label &&
          typeof point.value === 'number' &&
          !isNaN(point.value) &&
          isFinite(point.value)
        );
      })
      .map(point => ({
        ...point,
        value: Math.max(0, point.value), // Ensure non-negative values
        label: point.label.toString().trim(),
      }));
  }

  /**
   * Format chart values based on specified format type
   * Centralized value formatting for consistency
   */
  static formatValue(value: number, format: string = 'number'): string {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'duration':
        return this.formatDuration(value);
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
      default:
        return this.formatNumber(value);
    }
  }

  /**
   * Format numbers with appropriate thousands separators
   */
  static formatNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  }

  /**
   * Format duration values (seconds) to human-readable format
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.round((seconds % 3600) / 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  /**
   * Generate color palette for charts
   * Ensures sufficient color variety for data visualization
   */
  static generateColorPalette(dataLength: number, baseColors?: string[]): string[] {
    const colors = baseColors || this.DEFAULT_CONFIG.colors!;
    
    if (dataLength <= colors.length) {
      return colors.slice(0, dataLength);
    }

    // Generate additional colors by adjusting opacity for large datasets
    const expandedColors: string[] = [];
    for (let i = 0; i < dataLength; i++) {
      const baseColor = colors[i % colors.length];
      const opacity = Math.max(0.3, 1 - Math.floor(i / colors.length) * 0.2);
      expandedColors.push(this.adjustColorOpacity(baseColor, opacity));
    }

    return expandedColors;
  }

  /**
   * Adjust color opacity for extended palettes
   */
  private static adjustColorOpacity(color: string, opacity: number): string {
    // Convert hex to RGB and apply opacity
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Calculate chart dimensions based on container and responsive settings
   */
  static calculateDimensions(
    containerWidth: number,
    containerHeight: number,
    config: ChartConfiguration
  ): { width: number; height: number } {
    if (!config.responsive) {
      return {
        width: config.width || this.DEFAULT_CONFIG.width!,
        height: config.height || this.DEFAULT_CONFIG.height!,
      };
    }

    // Responsive calculations with aspect ratio preservation
    const aspectRatio = (config.width || this.DEFAULT_CONFIG.width!) / 
                       (config.height || this.DEFAULT_CONFIG.height!);
    
    let width = Math.min(containerWidth, config.width || containerWidth);
    let height = width / aspectRatio;

    // Ensure height doesn't exceed container
    if (height > containerHeight) {
      height = containerHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.floor(width),
      height: Math.floor(height),
    };
  }

  /**
   * Generate chart-specific configurations for different chart types
   * Optimized settings for each chart type
   */
  static getChartTypeConfig(type: ChartData['type']): Partial<ChartConfiguration> {
    const configs = {
      line: {
        height: 300,
        grid: true,
        animation: true,
      },
      bar: {
        height: 250,
        grid: true,
        animation: true,
      },
      pie: {
        width: 300,
        height: 300,
        legend: true,
        grid: false,
      },
      area: {
        height: 300,
        grid: true,
        animation: true,
      },
    };

    return configs[type] || {};
  }

  /**
   * Transform analytics data for specific chart libraries
   * Adapter pattern for different charting libraries
   */
  static transformForChartLibrary(
    chartData: ProcessedChartData,
    library: 'recharts' | 'chartjs' | 'd3'
  ): any {
    switch (library) {
      case 'recharts':
        return this.transformForRecharts(chartData);
      case 'chartjs':
        return this.transformForChartJS(chartData);
      case 'd3':
        return this.transformForD3(chartData);
      default:
        return chartData;
    }
  }

  /**
   * Transform data for Recharts library
   */
  private static transformForRecharts(chartData: ProcessedChartData): any {
    const baseConfig = {
      data: chartData.data.map(point => ({
        name: point.label,
        value: point.value,
        date: point.date,
        fill: point.color,
      })),
    };

    switch (chartData.type) {
      case 'pie':
        return {
          ...baseConfig,
          cx: '50%',
          cy: '50%',
          outerRadius: 100,
        };
      case 'line':
      case 'area':
        return {
          ...baseConfig,
          dataKey: 'value',
          stroke: chartData.config.colors?.[0],
          fill: chartData.type === 'area' ? chartData.config.colors?.[0] : 'none',
        };
      case 'bar':
        return {
          ...baseConfig,
          dataKey: 'value',
          fill: chartData.config.colors?.[0],
        };
      default:
        return baseConfig;
    }
  }

  /**
   * Transform data for Chart.js library
   */
  private static transformForChartJS(chartData: ProcessedChartData): any {
    return {
      labels: chartData.data.map(point => point.label),
      datasets: [{
        label: chartData.title,
        data: chartData.data.map(point => point.value),
        backgroundColor: chartData.config.colors,
        borderColor: chartData.config.colors?.[0],
        borderWidth: 1,
      }],
    };
  }

  /**
   * Transform data for D3.js library
   */
  private static transformForD3(chartData: ProcessedChartData): any {
    return {
      data: chartData.data,
      config: chartData.config,
      scales: {
        x: {
          domain: chartData.data.map(point => point.label),
          type: 'ordinal',
        },
        y: {
          domain: [chartData.minValue, chartData.maxValue],
          type: 'linear',
        },
      },
    };
  }

  /**
   * Generate empty state configuration for charts with no data
   */
  static generateEmptyStateConfig(): any {
    return {
      message: 'No data available',
      icon: 'BarChart3',
      suggestion: 'Data will appear here when available',
    };
  }

  /**
   * Calculate optimal number of data points for performance
   * Reduces data points for large datasets while maintaining visual accuracy
   */
  static optimizeDataPoints(
    data: ChartDataPoint[],
    maxPoints: number = 100
  ): ChartDataPoint[] {
    if (data.length <= maxPoints) {
      return data;
    }

    // Use sampling to reduce data points while maintaining distribution
    const step = Math.ceil(data.length / maxPoints);
    const optimized: ChartDataPoint[] = [];

    for (let i = 0; i < data.length; i += step) {
      optimized.push(data[i]);
    }

    // Always include the last data point
    if (optimized[optimized.length - 1] !== data[data.length - 1]) {
      optimized.push(data[data.length - 1]);
    }

    return optimized;
  }
}

/**
 * Chart theme utilities for consistent styling
 */
export class ChartThemeUtils {
  static readonly THEMES = {
    light: {
      background: '#ffffff',
      text: '#374151',
      grid: '#f3f4f6',
      accent: '#3b82f6',
    },
    dark: {
      background: '#1f2937',
      text: '#f9fafb',
      grid: '#374151',
      accent: '#60a5fa',
    },
  };

  static getThemeConfig(theme: 'light' | 'dark' = 'light') {
    return this.THEMES[theme];
  }

  static applyThemeToConfig(
    config: ChartConfiguration,
    theme: 'light' | 'dark' = 'light'
  ): ChartConfiguration {
    const themeConfig = this.getThemeConfig(theme);
    
    return {
      ...config,
      theme,
      // Apply theme-specific overrides
      colors: config.colors || ChartUtils.DEFAULT_CONFIG.colors,
    };
  }
}