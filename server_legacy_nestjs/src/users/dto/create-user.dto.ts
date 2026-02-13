import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '사용자 이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '사용자 이름' })
  @IsString()
  name: string;

  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: '인증 제공자', default: 'google' })
  @IsOptional()
  @IsString()
  authProvider?: string;

  @ApiProperty({ description: '제공자 ID', required: false })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiProperty({ description: '계정 활성화 상태', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: '이메일 인증 상태', default: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({ description: '사용자 역할', default: 'user' })
  @IsOptional()
  @IsString()
  role?: string;
}
