import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: '사용자 이름', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: '인증 제공자', required: false })
  @IsOptional()
  @IsString()
  authProvider?: string;

  @ApiProperty({ description: '제공자 ID', required: false })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiProperty({ description: '계정 활성화 상태', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: '이메일 인증 상태', required: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({ description: '사용자 역할', required: false })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ description: '리프레시 토큰', required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
