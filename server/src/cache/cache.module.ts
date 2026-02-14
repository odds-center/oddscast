import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Keyv } from 'keyv';
import KeyvRedis from '@keyv/redis';
import { CacheableMemory } from 'cacheable';

const TTL_MS = 60 * 60 * 1000; // 1시간

const nestCacheModule = NestCacheModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => {
    const redisUrl = config.get<string>('REDIS_URL');
    const stores: Keyv[] = [
      new Keyv({
        store: new CacheableMemory({ ttl: TTL_MS, lruSize: 5000 }),
      }),
    ];

    if (redisUrl) {
      try {
        stores.push(new Keyv({ store: new KeyvRedis(redisUrl) }));
      } catch (e) {
        console.warn(
          '[Cache] Redis 연결 실패, 인메모리만 사용:',
          (e as Error).message,
        );
      }
    }

    return {
      stores,
      ttl: TTL_MS,
      isGlobal: true,
    };
  },
});

/**
 * Redis 캐시 모듈
 * REDIS_URL 설정 시 Redis 사용, 미설정 시 인메모리 캐시 사용
 */
@Global()
@Module({
  imports: [nestCacheModule],
  exports: [nestCacheModule],
})
export class CacheModule {}
