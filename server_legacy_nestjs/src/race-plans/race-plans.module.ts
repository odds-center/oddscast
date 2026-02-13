import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RacePlan } from '../races/entities/race-plan.entity';
import { RacePlansController } from './race-plans.controller';
import { RacePlansService } from './race-plans.service';
import { DataSourceModule } from '../data-source/data-source.module';

@Module({
  imports: [TypeOrmModule.forFeature([RacePlan]), DataSourceModule],
  controllers: [RacePlansController],
  providers: [RacePlansService],
  exports: [RacePlansService],
})
export class RacePlansModule {}
