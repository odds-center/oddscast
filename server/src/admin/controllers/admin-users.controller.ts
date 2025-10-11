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

      // UsersService의 findAll은 파라미터가 없으므로 전체 조회
      const users = await this.usersService.findAll();

      // 필터링
      let filteredUsers = users;
      if (search) {
        filteredUsers = users.filter(
          user => user.email.includes(search) || user.name.includes(search)
        );
      }
      if (role) {
        filteredUsers = filteredUsers.filter(user => user.role === role);
      }

      // 페이지네이션 직접 구현
      const startIndex = (validPage - 1) * validLimit;
      const endIndex = startIndex + validLimit;

      return {
        data: filteredUsers.slice(startIndex, endIndex),
        meta: {
          total: filteredUsers.length,
          page: validPage,
          limit: validLimit,
          totalPages: Math.ceil(filteredUsers.length / validLimit),
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
