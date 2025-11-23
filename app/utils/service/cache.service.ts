import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Cache Service TypeScript interfaces
interface CacheConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

interface CacheError {
  status: number;
  message: string;
  data?: any;
}

interface CacheResponse<T = any> {
  data: T;
  status: number;
  headers?: any;
}

interface CacheSetOptions {
  ttl?: number; // Time to live in seconds
}

// Cache Service Configuration - Optimized for speed
const CACHE_CONFIG: CacheConfig = {
  baseURL: process.env.CACHE_SERVICE_URL || '',
  timeout: 2000, // 2 seconds - cache should be fast
  retries: 1, // Only 1 retry for cache operations
};

class CacheService {
  private axiosInstance: AxiosInstance;
  private config: CacheConfig;
  private pendingRequests = new Map<string, Promise<any>>();
  private localCache = new Map<string, { data: any; timestamp: number }>();
  private readonly LOCAL_CACHE_TTL = 1000; // 1 second local cache

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...CACHE_CONFIG, ...config };
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();

    // Clean up local cache every 10 seconds
    setInterval(() => this.cleanupLocalCache(), 10000);
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Connection: 'keep-alive',
        Authorization: `Bearer ${process.env.CACHE_SERVICE_API_KEY || ''}`,
      },
      // Performance optimizations
      maxRedirects: 0, // No redirects for cache service
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      // HTTP/2 and connection reuse
      httpAgent: false,
      httpsAgent: false,
    });
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (this.shouldRetry(error) && !originalRequest._retry) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

          if (originalRequest._retryCount <= this.config.retries) {
            await this.delay(200); // Fast retry for cache - only 200ms delay
            return this.axiosInstance(originalRequest);
          }
        }

        throw this.handleError(error);
      },
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    return (
      !error.response ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      (error.response.status >= 500 && error.response.status !== 501)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleError(error: any): CacheError {
    const response = error.response as AxiosResponse | undefined;
    if (response) {
      return {
        status: response.status,
        message: this.extractErrorMessage(response.data) || response.statusText,
        data: response.data,
      };
    }
    return {
      status: 500,
      message: error?.message || 'Cache service unavailable',
      data: error,
    };
  }

  private extractErrorMessage(data: any): string | null {
    if (typeof data === 'string') return data;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    return null;
  }

  private cleanupLocalCache(): void {
    const now = Date.now();
    for (const [key, cache] of this.localCache.entries()) {
      if (now - cache.timestamp > this.LOCAL_CACHE_TTL) {
        this.localCache.delete(key);
      }
    }
  }

  /**
   * Get cache entry by key from global cache
   * @param key Cache key
   * @returns Cached data or null if not found
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!key) {
      throw new Error('Cache key is required');
    }

    // Check local cache first (1 second TTL)
    const localCached = this.localCache.get(key);
    if (localCached && Date.now() - localCached.timestamp < this.LOCAL_CACHE_TTL) {
      return localCached.data;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    const requestPromise = (async () => {
      try {
        const response: AxiosResponse<T> = await this.axiosInstance.get('/cache', {
          params: { key },
        });

        const data = response.data;

        // Store in local cache
        this.localCache.set(key, { data, timestamp: Date.now() });

        return data;
      } catch (error: any) {
        const cacheError = this.handleError(error);

        // If cache miss (404), store null in local cache to prevent repeated requests
        if (cacheError.status === 404) {
          this.localCache.set(key, { data: null, timestamp: Date.now() });
          return null;
        }

        // For other errors, throw the error
        throw cacheError;
      } finally {
        // Clean up pending request
        this.pendingRequests.delete(key);
      }
    })();

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Set cache entry with optional TTL
   * @param key Cache key
   * @param data Data to cache
   * @param options Cache options (TTL)
   * @returns Success message
   */
  async set<T = any>(key: string, data: T, options: CacheSetOptions = {}) {
    if (!key) {
      throw new Error('Cache key is required');
    }

    if (data === undefined) {
      throw new Error('Cache data is required');
    }
    try {
      const requestBody: { data: T; ttl?: number } = { data };

      if (options.ttl !== undefined) {
        requestBody.ttl = options.ttl;
      }

      const response: AxiosResponse<{ message: string }> = await this.axiosInstance.post('/cache', requestBody, {
        params: { key },
      });

      // Update local cache
      this.localCache.set(key, { data, timestamp: Date.now() });

      // Clear any pending requests for this key
      this.pendingRequests.delete(key);

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete cache entry by key
   * @param key Cache key to delete
   * @returns Success message
   */
  async delete(key: string): Promise<{ message: string }> {
    if (!key) {
      throw new Error('Cache key is required');
    }
    try {
      const response: AxiosResponse<{ message: string }> = await this.axiosInstance.delete('/cache', {
        params: { key },
      });

      // Clear from local cache and pending requests
      this.localCache.delete(key);
      this.pendingRequests.delete(key);

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Clear all local cache
   */
  clearLocalCache(): void {
    this.localCache.clear();
    this.pendingRequests.clear();
  }
}

// Singleton instance
const cacheService = new CacheService();

// Export the service instance and class
export { CacheService, cacheService };
export default cacheService;

// Type exports
export type { CacheError, CacheResponse, CacheSetOptions };
