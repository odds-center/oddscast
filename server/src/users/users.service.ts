import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface CreateUserDto {
  email: string;
  name?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  googleId: string;
  refreshToken?: string;
  locale?: string;
  timezone?: string;
}

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  refreshToken?: string;
  locale?: string;
  timezone?: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = this.usersRepository.create(createUserDto);
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('사용자가 이미 존재합니다.');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { googleId },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['createdRaces'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    await this.usersRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async deactivate(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      isActive: false,
    });
  }

  async activate(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      isActive: true,
    });
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    await this.usersRepository.remove(user);
  }

  async findOrCreateByGoogle(googleUser: any): Promise<User> {
    let user = await this.findByGoogleId(googleUser.sub);

    if (!user) {
      // 새 사용자 생성
      const createUserDto: CreateUserDto = {
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        googleId: googleUser.sub,
        locale: googleUser.locale,
      };

      user = await this.create(createUserDto);
      this.logger.log(`새 사용자 생성: ${user.email}`);
    } else {
      // 기존 사용자 정보 업데이트
      await this.update(user.id, {
        name: googleUser.name,
        avatar: googleUser.picture,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        locale: googleUser.locale,
      });
    }

    // 마지막 로그인 시간 업데이트
    await this.updateLastLogin(user.id);

    return user;
  }
}
