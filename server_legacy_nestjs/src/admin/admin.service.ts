import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Admin, AdminRole } from './entities/admin.entity';
import { CreateAdminDto, LoginAdminDto, UpdateAdminDto } from './dto';

/**
 * 관리자 서비스
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const existingAdmin = await this.adminRepository.findOne({
      where: { email: createAdminDto.email },
    });

    if (existingAdmin) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    const hashedPassword = await Admin.hashPassword(createAdminDto.password);

    const admin = this.adminRepository.create({
      ...createAdminDto,
      password: hashedPassword,
    });

    return this.adminRepository.save(admin);
  }

  async login(loginAdminDto: LoginAdminDto) {
    const admin = await this.adminRepository.findOne({
      where: { email: loginAdminDto.email },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.'
      );
    }

    const isPasswordValid = await admin.validatePassword(
      loginAdminDto.password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.'
      );
    }

    // 마지막 로그인 시간 업데이트
    admin.lastLoginAt = new Date();
    await this.adminRepository.save(admin);

    const payload = {
      sub: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role,
      type: 'admin',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
    };
  }

  async findAll(): Promise<Admin[]> {
    return this.adminRepository.find({
      select: [
        'id',
        'email',
        'username',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt',
      ],
    });
  }

  async findOne(id: number): Promise<Admin> {
    return this.adminRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'username',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt',
      ],
    });
  }

  async update(id: number, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    const admin = await this.findOne(id);

    if (updateAdminDto.password) {
      updateAdminDto.password = await Admin.hashPassword(
        updateAdminDto.password
      );
    }

    Object.assign(admin, updateAdminDto);
    return this.adminRepository.save(admin);
  }

  async remove(id: number): Promise<void> {
    await this.adminRepository.delete(id);
  }

  async validateAdmin(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id, isActive: true },
    });

    if (!admin) {
      throw new UnauthorizedException('유효하지 않은 관리자입니다.');
    }

    return admin;
  }
}
