import { Module } from '@nestjs/common';
import { Race } from './entities/race.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RacesController } from './races.controller';
import { RacesService } from './races.service';
import { KraApiModule } from '../kra-api/kra-api.module';

@Module({
  imports: [TypeOrmModule.forFeature([Race]), KraApiModule],
  controllers: [RacesController],
  providers: [RacesService],
  exports: [RacesService],
})
export class RacesModule {}
