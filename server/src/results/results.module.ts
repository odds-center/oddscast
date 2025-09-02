import { Module } from '@nestjs/common';
import { Result, DividendRate } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { DividendRatesService } from './dividend-rates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Result, DividendRate])],
  controllers: [ResultsController],
  providers: [ResultsService, DividendRatesService],
  exports: [ResultsService, DividendRatesService],
})
export class ResultsModule {}
