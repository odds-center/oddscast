import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsString, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitCommunityPredictionDto {
  @ApiProperty({ description: 'Race ID' })
  @IsInt()
  @Type(() => Number)
  raceId!: number;

  @ApiProperty({ description: 'Predicted horse numbers (1-3 horses in order)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  predictedHrNos!: string[];
}

export class CommunityPredictionResponseDto {
  id!: string;
  raceId!: number;
  predictedHrNos!: string[];
  score!: number;
  scoredAt!: Date | null;
  createdAt!: Date;
  displayName?: string;
}

export class LeaderboardEntryDto {
  userId!: number;
  displayName!: string;
  totalScore!: number;
  predictionCount!: number;
  perfectPredictions!: number;
  rank!: number;
}

export class LeaderboardResponseDto {
  entries!: LeaderboardEntryDto[];
  period!: 'weekly' | 'monthly' | 'alltime';
  generatedAt!: Date;
}
