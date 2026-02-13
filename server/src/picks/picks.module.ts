import { Module } from '@nestjs/common';
import { PicksController } from './picks.controller';
import { PicksService } from './picks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PicksController],
  providers: [PicksService],
  exports: [PicksService],
})
export class PicksModule {}
