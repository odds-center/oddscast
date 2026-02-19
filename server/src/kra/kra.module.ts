import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { KraService } from './kra.service';
import { KraController } from './kra.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../cache/cache.module';
import { GlobalConfigModule } from '../config/config.module';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    ConfigModule,
    CacheModule,
    GlobalConfigModule,
  ],
  controllers: [KraController],
  providers: [KraService],
  exports: [KraService],
})
export class KraModule {}
