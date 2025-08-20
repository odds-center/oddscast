import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RacePlan } from '../entities/race-plan.entity';
import { RacePlansController } from './race-plans.controller';
import { RacePlansService } from './race-plans.service';

@Module({
  imports: [TypeOrmModule.forFeature([RacePlan])],
  controllers: [RacePlansController],
  providers: [RacePlansService],
  exports: [RacePlansService],
})
export class RacePlansModule {}
