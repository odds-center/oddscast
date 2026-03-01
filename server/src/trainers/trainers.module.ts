import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RaceResult } from '../database/entities/race-result.entity';
import { TrainersController } from './trainers.controller';
import { TrainersService } from './trainers.service';

@Module({
  imports: [TypeOrmModule.forFeature([RaceResult])],
  controllers: [TrainersController],
  providers: [TrainersService],
  exports: [TrainersService],
})
export class TrainersModule {}
