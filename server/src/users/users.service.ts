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
  providerId?: string;
  authProvider?: string;
  isActive?: boolean;
  isVerified?: boolean;
  role?: string;
  refreshToken?: string;
}

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
  providerId?: string;
  authProvider?: string;
  isActive?: boolean;
  isVerified?: boolean;
  role?: string;
  lastLogin?: Date;
  refreshToken?: string;
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
      where: { providerId: googleId },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['createdRaces'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    try {
      await this.usersRepository.update(id, updateUserDto);
      return this.findById(id);
    } catch (error) {
      this.logger.error(`사용자 업데이트 실패: ${error.message}`);
      throw error;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await this.usersRepository.update(id, {
        lastLogin: new Date(),
      });
    } catch (error) {
      this.logger.error(`마지막 로그인 시간 업데이트 실패: ${error.message}`);
      throw error;
    }
  }

  async deactivate(id: string): Promise<void> {
    try {
      await this.usersRepository.update(id, {
        isActive: false,
      });
      this.logger.log(`사용자 비활성화: ${id}`);
    } catch (error) {
      this.logger.error(`사용자 비활성화 실패: ${error.message}`);
      throw error;
    }
  }

  async activate(id: string): Promise<void> {
    try {
      await this.usersRepository.update(id, {
        isActive: true,
      });
      this.logger.log(`사용자 활성화: ${id}`);
    } catch (error) {
      this.logger.error(`사용자 활성화 실패: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }
      await this.usersRepository.remove(user);
      this.logger.log(`사용자 삭제: ${id}`);
    } catch (error) {
      this.logger.error(`사용자 삭제 실패: ${error.message}`);
      throw error;
    }
  }

  async findOrCreateByGoogle(googleUser: any): Promise<User> {
    try {
      let user = await this.findByGoogleId(googleUser.sub);

      if (!user) {
        // 새 사용자 생성
        const createUserDto: CreateUserDto = {
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
          providerId: googleUser.sub,
          authProvider: 'google',
          isActive: true,
          isVerified: true,
          role: 'user',
        };

        user = await this.create(createUserDto);
        this.logger.log(`새 사용자 생성: ${user.email}`);
      } else {
        // 기존 사용자 정보 업데이트
        await this.update(user.id, {
          name: googleUser.name,
          avatar: googleUser.picture,
          providerId: googleUser.sub,
          authProvider: 'google',
          isVerified: true,
        });
        this.logger.log(`기존 사용자 정보 업데이트: ${user.email}`);
      }

      // 마지막 로그인 시간 업데이트
      await this.updateLastLogin(user.id);

      return user;
    } catch (error) {
      this.logger.error(`구글 사용자 찾기/생성 실패: ${error.message}`);
      throw error;
    }
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    try {
      return this.usersRepository.findOne({
        where: { refreshToken: refreshToken },
      });
    } catch (error) {
      this.logger.error(`리프레시 토큰으로 사용자 찾기 실패: ${error.message}`);
      return null;
    }
  }
}
