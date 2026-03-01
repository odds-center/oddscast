import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminActivityLog } from '../database/entities/admin-activity-log.entity';
import { UserActivityLog } from '../database/entities/user-activity-log.entity';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AdminActivityLog, UserActivityLog]),
  ],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
