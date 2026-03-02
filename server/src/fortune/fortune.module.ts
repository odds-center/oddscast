import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { UserDailyFortune } from '../database/entities/user-daily-fortune.entity';
import { FortuneController } from './fortune.controller';
import { FortuneService } from './fortune.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserDailyFortune])],
  controllers: [FortuneController],
  providers: [FortuneService],
  exports: [FortuneService],
})
export class FortuneModule {}
