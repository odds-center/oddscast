import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { UsersService } from '../../users/users.service';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('role') role?: string
  ) {
    try {
      // Query 파라미터를 안전하게 숫자로 변환
      const page = pageStr ? parseInt(pageStr, 10) : 1;
      const limit = limitStr ? parseInt(limitStr, 10) : 20;

      // 값이 유효하지 않으면 기본값 사용
      const validPage = isNaN(page) ? 1 : page;
      const validLimit = isNaN(limit) ? 20 : limit;

      // DB 레벨에서 페이지네이션 처리 (성능 향상)
      const result = await this.usersService.findWithPagination({
        page: validPage,
        limit: validLimit,
        search,
        role,
      });

      return {
        data: result.data,
        meta: {
          total: result.total,
          page: validPage,
          limit: validLimit,
          totalPages: Math.ceil(result.total / validLimit),
        },
      };
    } catch (error) {
      return {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
        error: error.message,
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Patch(':id/activate')
  async activateUser(@Param('id') id: string) {
    return this.usersService.update(id, { isActive: true });
  }

  @Patch(':id/deactivate')
  async deactivateUser(@Param('id') id: string) {
    return this.usersService.update(id, { isActive: false });
  }
}
