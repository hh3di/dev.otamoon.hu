import Redis, { Cluster } from 'ioredis';

interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

interface ClusterConfig {
  host: string;
  port: number;
}

class RedisService {
  private client: Redis | Cluster | null = null;
  private isCluster: boolean = false;
  private isConnected: boolean = false;
  private isEnabled: boolean = false;

  constructor() {
    if (import.meta.env.VITE_REDIS_HOST !== 'your-redis-host') {
      this.connect();
    }
  }
  private async connect(): Promise<void> {
    try {
      const redisHost = import.meta.env.VITE_REDIS_HOST;
      const redisPort = parseInt(import.meta.env.VITE_REDIS_PORT || '6379');
      const redisPassword = import.meta.env.VITE_REDIS_PASSWORD;
      const redisCluster = import.meta.env.VITE_REDIS_CLUSTER === 'true';
      const redisClusterNodes = import.meta.env.VITE_REDIS_CLUSTER_NODES;
      if (!redisHost || redisHost === undefined || redisHost.trim() === '') {
        this.isEnabled = false;
        this.client = null;
        this.isConnected = false;
        return;
      }

      this.isEnabled = true;

      if (redisCluster) {
        // Cluster mód
        let clusterNodes: ClusterConfig[] = [];

        if (redisClusterNodes) {
          clusterNodes = redisClusterNodes.split(',').map((node: any) => {
            const [host, port] = node.trim().split(':');
            return { host, port: parseInt(port) };
          });
        } else {
          clusterNodes = [{ host: redisHost, port: redisPort }];
        }

        const clusterOptions = {
          redisOptions: {
            password: redisPassword,
            lazyConnect: true,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxRetriesPerRequest: 3,
          },
          enableOfflineQueue: false,
        };

        this.client = new Redis.Cluster(clusterNodes, clusterOptions);
        this.isCluster = true;

        console.log('🔄 Connecting to Redis Cluster:', clusterNodes);
      } else {
        // Single node mód
        const redisConfig: RedisConfig = {
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          db: parseInt(import.meta.env.VITE_REDIS_DB || '0'),
          lazyConnect: true,
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: 3,
        };

        this.client = new Redis(redisConfig);
        this.isCluster = false;

        console.log(`🔄 Connecting to Redis: ${redisHost}:${redisPort}`);
      }

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis connection error:', error.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('⚠️ Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  private canUseRedis(): boolean {
    return this.isEnabled && !!this.client && this.isConnected;
  }

  async get(key: string): Promise<any | null> {
    try {
      if (!this.canUseRedis()) {
        return null;
      }
      const result = await this.client!.get(`${import.meta.env.VITE_REDIS_PREFIX || ''}${key}`);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('❌ Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<'OK'> {
    try {
      if (!this.canUseRedis()) {
        return 'OK';
      }
      const jsonString = JSON.stringify(value);
      if (ttlSeconds) {
        return await this.client!.set(`${import.meta.env.VITE_REDIS_PREFIX || ''}${key}`, jsonString, 'EX', ttlSeconds);
      } else {
        return await this.client!.set(`${import.meta.env.VITE_REDIS_PREFIX || ''}${key}`, jsonString);
      }
    } catch (error) {
      console.error('❌ Redis SET error:', error);
      return 'OK';
    }
  }

  async delete(key: string): Promise<number> {
    try {
      if (!this.canUseRedis()) {
        return 0;
      }
      return await this.client!.del(`${import.meta.env.VITE_REDIS_PREFIX || ''}${key}`);
    } catch (error) {
      console.error('❌ Redis DELETE error:', error);
      return 0;
    }
  }

  getConnectionStatus(): { connected: boolean; mode: string } {
    return {
      connected: this.isConnected,
      mode: this.isEnabled ? (this.isCluster ? 'cluster' : 'single') : 'disabled',
    };
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.client = null;
        this.isConnected = false;
        console.log('✅ Redis disconnected');
      }
    } catch (error) {
      console.error('❌ Redis disconnect error:', error);
      throw error;
    }
  }
}

const redisService = new RedisService();

export default redisService;
export { RedisService };
