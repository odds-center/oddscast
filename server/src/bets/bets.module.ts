import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bet } from '../database/entities/bet.entity';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bet])],
  controllers: [BetsController],
  providers: [BetsService],
  exports: [BetsService],
})
export class BetsModule {}
