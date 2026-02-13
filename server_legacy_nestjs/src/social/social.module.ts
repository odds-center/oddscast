import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicBet } from './entities/public-bet.entity';
import { BetLike } from './entities/bet-like.entity';
import { BetComment } from './entities/bet-comment.entity';
import { UserFollow } from './entities/user-follow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PublicBet, BetLike, BetComment, UserFollow]),
  ],
  exports: [TypeOrmModule],
})
export class SocialModule {}
