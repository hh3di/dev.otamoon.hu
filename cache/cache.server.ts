interface CacheEntry<T = any> {
  data: T;
  lastUpdate: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // TTL in milliseconds
}

class MemoryCache {
  private static instance: MemoryCache;
  private cache: Map<string, CacheEntry>;
  private readonly DEFAULT_TTL = 10 * 1000; // 10 másodperc

  private constructor() {
    this.cache = new Map();
    this.startCleanup();
  }

  public static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  async set<T = any>(key: string, data: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || this.DEFAULT_TTL;

    this.cache.set(key, {
      data,
      lastUpdate: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  private startCleanup() {
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
          if (now > entry.expiresAt) {
            this.cache.delete(key);
          }
        }
      },
      5 * 60 * 1000,
    ); // 5 perc
  }
}

export const memoryCache = MemoryCache.getInstance();
