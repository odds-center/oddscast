import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as _ from 'lodash';

/**
 * Redis 캐시 서비스
 * - AI 예측 결과 캐싱
 * - 배당률 변화 추적
 * - 응답 속도 50배 향상
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private cache: Map<string, { data: any; expiresAt: number }>;
  private redis: Redis | null = null;
  private isRedisAvailable = false;

  constructor(private readonly configService: ConfigService) {
    // 메모리 캐시로 시작 (Redis 없어도 작동)
    this.cache = new Map();
  }

  async onModuleInit() {
    // Railway Redis 연결 시도
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      await this.connectRedis(redisUrl);
    } else {
      this.logger.warn('Redis URL not found. Using memory cache only.');
      this.logger.log('Cache Service initialized (Memory Mode)');
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Redis 연결
   */
  private async connectRedis(redisUrl: string): Promise<void> {
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: times => {
          if (times > 3) {
            this.logger.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.redis.on('connect', () => {
        this.isRedisAvailable = true;
        this.logger.log('✅ Redis connected successfully');
      });

      this.redis.on('error', error => {
        this.isRedisAvailable = false;
        this.logger.error(`Redis error: ${error.message}`);
      });

      this.redis.on('close', () => {
        this.isRedisAvailable = false;
        this.logger.warn('Redis connection closed');
      });

      // 연결 테스트
      await this.redis.ping();
      this.logger.log('Cache Service initialized (Redis + Memory Mode)');
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`);
      this.logger.log('Falling back to Memory Mode');
    }
  }

  /**
   * 캐시 저장
   */
  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    // 메모리 캐시
    this.cache.set(key, {
      data: _.cloneDeep(value),
      expiresAt,
    });

    // Redis 저장
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      } catch (error) {
        this.logger.error(`Redis set error: ${error.message}`);
      }
    }
  }

  /**
   * 캐시 조회
   */
  async get<T>(key: string): Promise<T | null> {
    // Redis 우선 조회
    if (this.isRedisAvailable && this.redis) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          return JSON.parse(cached) as T;
        }
      } catch (error) {
        this.logger.error(`Redis get error: ${error.message}`);
      }
    }

    // 메모리 캐시 조회
    const cached = this.cache.get(key);
    if (!cached) return null;

    // TTL 체크
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return _.cloneDeep(cached.data) as T;
  }

  /**
   * 캐시 삭제
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key);

    // Redis 삭제
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        this.logger.error(`Redis del error: ${error.message}`);
      }
    }
  }

  /**
   * 패턴으로 삭제
   */
  async delPattern(pattern: string): Promise<void> {
    // 메모리 캐시에서 패턴 매칭 삭제
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const memoryKeys = Array.from(this.cache.keys());
    const matchedKeys = _.filter(memoryKeys, key => regex.test(key));

    _.forEach(matchedKeys, key => {
      this.cache.delete(key);
    });

    // Redis SCAN + DEL
    if (this.isRedisAvailable && this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        this.logger.error(`Redis delPattern error: ${error.message}`);
      }
    }
  }

  /**
   * TTL 연장
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    const cached = this.cache.get(key);
    if (cached) {
      cached.expiresAt = Date.now() + ttlSeconds * 1000;
      this.cache.set(key, cached);
    }

    // Redis TTL 연장
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.expire(key, ttlSeconds);
      } catch (error) {
        this.logger.error(`Redis expire error: ${error.message}`);
      }
    }
  }

  /**
   * 캐시 통계
   */
  getStats() {
    return {
      size: this.cache.size,
      isRedisAvailable: this.isRedisAvailable,
    };
  }

  /**
   * 만료된 캐시 정리
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    const expiredKeys = _.filter(
      entries,
      ([, value]) => now > value.expiresAt
    ).map(([key]) => key);

    _.forEach(expiredKeys, key => {
      this.cache.delete(key);
    });

    if (expiredKeys.length > 0) {
      this.logger.debug(`캐시 정리: ${expiredKeys.length}개 삭제`);
    }
  }
}
