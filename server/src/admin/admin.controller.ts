import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto, LoginAdminDto, UpdateAdminDto } from './dto';
import { AdminGuard } from './guards/admin.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { Admin } from './entities/admin.entity';

/**
 * 관리자 컨트롤러
 */
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('register')
  @UseGuards(AdminGuard)
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Post('login')
  login(@Body() loginAdminDto: LoginAdminDto) {
    return this.adminService.login(loginAdminDto);
  }

  @Get('profile')
  @UseGuards(AdminGuard)
  getProfile(@CurrentAdmin() admin: Admin) {
    return admin;
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
