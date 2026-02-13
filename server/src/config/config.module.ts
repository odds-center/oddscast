import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { GlobalConfigService } from './config.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfigController],
  providers: [GlobalConfigService],
  exports: [GlobalConfigService],
})
export class GlobalConfigModule {}
