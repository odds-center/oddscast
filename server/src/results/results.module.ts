import { Module } from '@nestjs/common';
import { Result } from './entities/result.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';

@Module({
  imports: [TypeOrmModule.forFeature([Result])],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
