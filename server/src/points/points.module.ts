import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsService } from './points.service';
import { UserPointBalance } from '../entities/user-point-balance.entity';
import { UserPoints } from '../entities/user-points.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserPointBalance, UserPoints, User])],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
