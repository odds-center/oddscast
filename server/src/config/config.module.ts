import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalConfig } from '../database/entities/global-config.entity';
import { ConfigController } from './config.controller';
import { GlobalConfigService } from './config.service';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalConfig])],
  controllers: [ConfigController],
  providers: [GlobalConfigService],
  exports: [GlobalConfigService],
})
export class GlobalConfigModule {}
