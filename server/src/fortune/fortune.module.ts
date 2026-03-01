import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDailyFortune } from '../database/entities/user-daily-fortune.entity';
import { FortuneController } from './fortune.controller';
import { FortuneService } from './fortune.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserDailyFortune])],
  controllers: [FortuneController],
  providers: [FortuneService],
  exports: [FortuneService],
})
export class FortuneModule {}
