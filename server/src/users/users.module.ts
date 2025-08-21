import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserSocialAuth } from './entities/user-social-auth.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSocialAuth])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
