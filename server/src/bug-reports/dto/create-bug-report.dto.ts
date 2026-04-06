import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BugReportCategory } from '../../database/entities';

export class CreateBugReportDto {
  @ApiProperty({ description: 'Bug report title', maxLength: 200 })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Bug description (min 10 characters)' })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty({
    enum: BugReportCategory,
    default: BugReportCategory.OTHER,
    required: false,
  })
  @IsEnum(BugReportCategory)
  @IsOptional()
  category?: BugReportCategory;

  @ApiProperty({ required: false, description: 'URL where the bug occurred' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  pageUrl?: string;

  @ApiProperty({ required: false, description: 'Browser user-agent string' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  userAgent?: string;
}
