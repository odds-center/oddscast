import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService - DATABASE_URL에 따라 자동 연결 방식 선택
 * - prisma:// 또는 prisma+postgres:// → Prisma Accelerate (accelerateUrl)
 * - postgresql:// → 직접 연결 (PrismaPg adapter)
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const url = config.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error(
        'DATABASE_URL is not defined. Check your .env file in the server directory.',
      );
    }

    const isAccelerate =
      url.startsWith('prisma://') || url.startsWith('prisma+postgres://');

    if (isAccelerate) {
      super({ accelerateUrl: url });
    } else {
      const adapter = new PrismaPg({ connectionString: url });
      super({ adapter });
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
