import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { UserPointBalance } from './entities/user-point-balance.entity';
import { UserPoints } from './entities/user-points.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserPointBalance, UserPoints])],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
