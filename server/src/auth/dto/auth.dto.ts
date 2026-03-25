import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: '비밀번호는 6자 이상이어야 합니다' })
  password: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  name: string;

  @ApiProperty({ example: '경마왕', description: '닉네임 (필수)' })
  @IsString({ message: '닉네임을 입력하세요' })
  @MinLength(2, { message: '닉네임은 2자 이상이어야 합니다' })
  nickname: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

/** 관리자 로그인 — 아이디 + 비밀번호 */
export class AdminLoginDto {
  @ApiProperty({ example: 'admin', description: '관리자 아이디' })
  @IsString()
  @MinLength(1, { message: '아이디를 입력하세요' })
  loginId: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class DeleteAccountDto {
  @ApiProperty({ description: 'Current password to confirm account deletion' })
  @IsString()
  @MinLength(1, { message: '비밀번호를 입력하세요' })
  password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Saved meet filter: 서울|제주|부산경남 (FEATURE_ROADMAP 5.2)',
  })
  @IsOptional()
  @IsString()
  favoriteMeet?: string | null;

  @ApiPropertyOptional({ description: 'Whether user has completed onboarding tutorial' })
  @IsOptional()
  @IsBoolean()
  hasSeenOnboarding?: boolean;

  @ApiPropertyOptional({ description: 'Coach mark tour ID to mark as completed (appended to completedTours array)' })
  @IsOptional()
  @IsString()
  completedTour?: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  oldPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

/** 비밀번호 찾기 요청 */
export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;
}

/** 비밀번호 재설정 요청 */
export class ResetPasswordDto {
  @ApiProperty({ description: 'forgot-password에서 발급받은 토큰' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(6, { message: '비밀번호는 6자 이상이어야 합니다' })
  newPassword: string;
}

/** 이메일 인증 요청 */
export class VerifyEmailDto {
  @ApiProperty({ description: '인증 메일의 토큰' })
  @IsString()
  token: string;
}

/** 인증 메일 재발송 요청 */
export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;
}
