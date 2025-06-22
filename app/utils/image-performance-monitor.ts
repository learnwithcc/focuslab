export interface ImageMetrics {
  url: string;
  format: string;
  width: number;
  height: number;
  fileSize?: number;
  quality?: number;
  loadTime: number;
  renderTime?: number;
  fromCache: boolean;
  cdnUsed?: boolean;
  userAgent?: string;
  connectionType?: string;
  timestamp: number;
  error?: string;
}

export interface PerformanceReport {
  totalImages: number;
  averageLoadTime: number;
  cacheHitRate: number;
  formatBreakdown: Record<string, number>;
  errorRate: number;
  cdnUsageRate: number;
  averageFileSize: number;
  timeRange: {
    start: number;
    end: number;
  };
  connectionTypes: Record<string, number>;
  topErrors: Array<{ error: string; count: number }>;
}

export interface ImageLoadEvent {
  url: string;
  startTime: number;
  endTime?: number;
  error?: string;
  format?: string;
  fromCache?: boolean;
  fileSize?: number;
}

class ImagePerformanceMonitor {
  private metrics: ImageMetrics[] = [];
  private loadEvents: Map<string, ImageLoadEvent> = new Map();
  private maxMetrics = 1000; // Limit stored metrics to prevent memory leaks
  private reportGenerationInterval = 300000; // 5 minutes

  constructor() {
    // Bind methods to ensure proper context
    this.startImageLoad = this.startImageLoad.bind(this);
    this.endImageLoad = this.endImageLoad.bind(this);
    this.recordImageError = this.recordImageError.bind(this);
    
    // Auto-cleanup old metrics
    setInterval(() => this.cleanup(), this.reportGenerationInterval);
  }

  /**
   * Start tracking an image load
   */
  startImageLoad(url: string, format?: string): void {
    const startTime = performance.now();
    const loadEvent: ImageLoadEvent = {
      url,
      startTime,
    };
    if (format) {
      loadEvent.format = format;
    }
    this.loadEvents.set(url, loadEvent);
  }

  /**
   * Complete image load tracking
   */
  endImageLoad(
    url: string, 
    options: {
      format?: string;
      width?: number;
      height?: number;
      fileSize?: number;
      quality?: number;
      fromCache?: boolean;
      cdnUsed?: boolean;
      renderTime?: number;
    } = {}
  ): void {
    const loadEvent = this.loadEvents.get(url);
    if (!loadEvent) return;

    const endTime = performance.now();
    const loadTime = endTime - loadEvent.startTime;

    const metrics: Partial<ImageMetrics> = {
      url,
      format: options.format || loadEvent.format || 'unknown',
      width: options.width || 0,
      height: options.height || 0,
      loadTime,
      fromCache: options.fromCache || false,
      cdnUsed: options.cdnUsed || false,
      userAgent: this.getUserAgent(),
      connectionType: this.getConnectionType(),
      timestamp: Date.now(),
    };

    if (options.fileSize !== undefined) metrics.fileSize = options.fileSize;
    if (options.quality !== undefined) metrics.quality = options.quality;
    if (options.renderTime !== undefined) metrics.renderTime = options.renderTime;

    this.addMetrics(metrics as ImageMetrics);
    this.loadEvents.delete(url);
  }

  /**
   * Record an image load error
   */
  recordImageError(url: string, error: string): void {
    const loadEvent = this.loadEvents.get(url);
    const loadTime = loadEvent ? performance.now() - loadEvent.startTime : 0;

    const metrics: ImageMetrics = {
      url,
      format: loadEvent?.format || 'unknown',
      width: 0,
      height: 0,
      loadTime,
      fromCache: false,
      userAgent: this.getUserAgent(),
      connectionType: this.getConnectionType(),
      timestamp: Date.now(),
      error,
    };

    this.addMetrics(metrics);
    this.loadEvents.delete(url);
  }

  /**
   * Add metrics to the collection
   */
  private addMetrics(metrics: ImageMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Generate performance report
   */
  generateReport(timeRangeMs?: number): PerformanceReport {
    const now = Date.now();
    const timeRange = timeRangeMs || 3600000; // Default 1 hour
    const cutoff = now - timeRange;
    
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);
    
    if (recentMetrics.length === 0) {
      return this.getEmptyReport(now - timeRange, now);
    }

    const totalImages = recentMetrics.length;
    const errors = recentMetrics.filter(m => m.error);
    const cached = recentMetrics.filter(m => m.fromCache);
    const cdnImages = recentMetrics.filter(m => m.cdnUsed);
    const withFileSize = recentMetrics.filter(m => m.fileSize);

    // Calculate averages
    const averageLoadTime = recentMetrics.reduce((sum, m) => sum + m.loadTime, 0) / totalImages;
    const averageFileSize = withFileSize.length > 0 
      ? withFileSize.reduce((sum, m) => sum + (m.fileSize || 0), 0) / withFileSize.length 
      : 0;

    // Format breakdown
    const formatBreakdown: Record<string, number> = {};
    recentMetrics.forEach(m => {
      formatBreakdown[m.format] = (formatBreakdown[m.format] || 0) + 1;
    });

    // Connection types
    const connectionTypes: Record<string, number> = {};
    recentMetrics.forEach(m => {
      if (m.connectionType) {
        connectionTypes[m.connectionType] = (connectionTypes[m.connectionType] || 0) + 1;
      }
    });

    // Top errors
    const errorCounts: Record<string, number> = {};
    errors.forEach(m => {
      if (m.error) {
        errorCounts[m.error] = (errorCounts[m.error] || 0) + 1;
      }
    });
    
    const topErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalImages,
      averageLoadTime: Math.round(averageLoadTime * 100) / 100,
      cacheHitRate: Math.round((cached.length / totalImages) * 10000) / 100,
      formatBreakdown,
      errorRate: Math.round((errors.length / totalImages) * 10000) / 100,
      cdnUsageRate: Math.round((cdnImages.length / totalImages) * 10000) / 100,
      averageFileSize: Math.round(averageFileSize),
      timeRange: {
        start: cutoff,
        end: now,
      },
      connectionTypes,
      topErrors,
    };
  }

  /**
   * Get Core Web Vitals related to images
   */
  getCoreWebVitals(): {
    lcp?: number; // Largest Contentful Paint
    cls?: number; // Cumulative Layout Shift
    fid?: number; // First Input Delay
  } {
    if (typeof window === 'undefined') return {};
    
    const vitals: any = {};
    
    // Try to get LCP from Performance Observer
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        vitals.lcp = lcpEntries[lcpEntries.length - 1].startTime;
      }
    } catch (error) {
      console.debug('LCP not available:', error);
    }

    // Try to get CLS (if available)
    try {
      const clsEntries = performance.getEntriesByType('layout-shift');
      if (clsEntries.length > 0) {
        vitals.cls = clsEntries.reduce((sum: number, entry: any) => {
          return entry.hadRecentInput ? sum : sum + entry.value;
        }, 0);
      }
    } catch (error) {
      console.debug('CLS not available:', error);
    }

    return vitals;
  }

  /**
   * Get format effectiveness metrics
   */
  getFormatEffectiveness(): Record<string, {
    averageLoadTime: number;
    averageFileSize: number;
    errorRate: number;
    usage: number;
  }> {
    const formatStats: Record<string, {
      totalLoadTime: number;
      totalFileSize: number;
      errors: number;
      count: number;
    }> = {};

    this.metrics.forEach(metric => {
      if (!formatStats[metric.format]) {
        formatStats[metric.format] = {
          totalLoadTime: 0,
          totalFileSize: 0,
          errors: 0,
          count: 0,
        };
      }

      const stats = formatStats[metric.format];
      stats.totalLoadTime += metric.loadTime;
      stats.totalFileSize += metric.fileSize || 0;
      stats.count++;
      if (metric.error) stats.errors++;
    });

    const result: Record<string, any> = {};
    Object.entries(formatStats).forEach(([format, stats]) => {
      result[format] = {
        averageLoadTime: Math.round((stats.totalLoadTime / stats.count) * 100) / 100,
        averageFileSize: Math.round(stats.totalFileSize / stats.count),
        errorRate: Math.round((stats.errors / stats.count) * 10000) / 100,
        usage: stats.count,
      };
    });

    return result;
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(timeRangeMs?: number): ImageMetrics[] {
    if (!timeRangeMs) return [...this.metrics];
    
    const cutoff = Date.now() - timeRangeMs;
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.loadEvents.clear();
  }

  /**
   * Get user agent string
   */
  private getUserAgent(): string {
    if (typeof window === 'undefined') return 'server';
    return window.navigator.userAgent;
  }

  /**
   * Get connection type if available
   */
  private getConnectionType(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      return connection.effectiveType || connection.type || 'unknown';
    }
    
    return 'unknown';
  }

  /**
   * Get empty report structure
   */
  private getEmptyReport(start: number, end: number): PerformanceReport {
    return {
      totalImages: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      formatBreakdown: {},
      errorRate: 0,
      cdnUsageRate: 0,
      averageFileSize: 0,
      timeRange: { start, end },
      connectionTypes: {},
      topErrors: [],
    };
  }

  /**
   * Clean up old metrics and events
   */
  private cleanup(): void {
    const now = Date.now();
    const oldCutoff = now - (24 * 60 * 60 * 1000); // 24 hours
    
    // Remove old metrics
    this.metrics = this.metrics.filter(m => m.timestamp >= oldCutoff);
    
    // Remove stuck load events (older than 1 minute)
    const stuckCutoff = performance.now() - 60000;
    for (const [url, event] of this.loadEvents.entries()) {
      if (event.startTime < stuckCutoff) {
        this.loadEvents.delete(url);
      }
    }
  }
}

// Global performance monitor instance
export const imagePerformanceMonitor = new ImagePerformanceMonitor();

/**
 * Utility hook for React components to track image performance
 */
export function useImagePerformanceTracking() {
  const trackImageLoad = (url: string, format?: string) => {
    imagePerformanceMonitor.startImageLoad(url, format);
  };

  const completeImageLoad = (url: string, options: Parameters<typeof imagePerformanceMonitor.endImageLoad>[1]) => {
    imagePerformanceMonitor.endImageLoad(url, options);
  };

  const recordError = (url: string, error: string) => {
    imagePerformanceMonitor.recordImageError(url, error);
  };

  return {
    trackImageLoad,
    completeImageLoad,
    recordError,
    getReport: () => imagePerformanceMonitor.generateReport(),
    getFormatStats: () => imagePerformanceMonitor.getFormatEffectiveness(),
    getCoreWebVitals: () => imagePerformanceMonitor.getCoreWebVitals(),
  };
}

/**
 * Auto-instrumentation for performance tracking (optional)
 */
export function enableAutoInstrumentation() {
  if (typeof window === 'undefined') return;

  // Track image load performance automatically
  const originalImageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  
  if (originalImageSrc) {
    const propertyDescriptor: PropertyDescriptor = {
      set: function(this: HTMLImageElement, value: string) {
        const startTime = performance.now();
        
        this.addEventListener('load', () => {
          const loadTime = performance.now() - startTime;
          imagePerformanceMonitor.endImageLoad(value, {
            width: this.naturalWidth,
            height: this.naturalHeight,
            renderTime: loadTime,
          });
        }, { once: true });

        this.addEventListener('error', () => {
          imagePerformanceMonitor.recordImageError(value, 'Load failed');
        }, { once: true });

        if (originalImageSrc.set) {
          originalImageSrc.set.call(this, value);
        }
      },
      configurable: true,
      enumerable: true,
    };

    if (typeof originalImageSrc.get === 'function') {
      propertyDescriptor.get = originalImageSrc.get;
    }
    
    Object.defineProperty(HTMLImageElement.prototype, 'src', propertyDescriptor);
  }
} 