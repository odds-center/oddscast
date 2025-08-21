import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 프로필 조회' })
  @ApiResponse({ status: 200, description: '사용자 프로필', type: User })
  async getProfile(@Request() req: any): Promise<User | null> {
    // JWT 토큰에서 사용자 ID 추출 (인증 미들웨어 필요)
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('인증되지 않은 사용자입니다.');
    }
    return this.usersService.findById(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 상세 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 정보', type: User })
  async findById(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '새 사용자 생성' })
  @ApiResponse({ status: 201, description: '사용자 생성 완료', type: User })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 정보 수정' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 수정 완료', type: User })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User | null> {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 비활성화' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 비활성화 완료' })
  async deactivate(@Param('id') id: string): Promise<void> {
    return this.usersService.deactivate(id);
  }

  @Put(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 활성화' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 활성화 완료' })
  async activate(@Param('id') id: string): Promise<void> {
    return this.usersService.activate(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 삭제' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 삭제 완료' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }

  @Post('google-auth')
  @ApiOperation({ summary: '구글 로그인/회원가입' })
  @ApiResponse({ status: 200, description: '구글 인증 완료', type: User })
  async googleAuth(@Body() googleUser: any): Promise<User> {
    return this.usersService.findOrCreateByGoogle(googleUser);
  }
}
