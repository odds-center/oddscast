import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserSocialAuth } from './entities/user-social-auth.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSocialAuth)
    private readonly userSocialAuthRepository: Repository<UserSocialAuth>
  ) {}

  /**
   * ID로 사용자를 찾습니다.
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`사용자를 찾을 수 없습니다: ${id}`);
    }
    return user;
  }

  /**
   * 이메일로 사용자를 찾습니다.
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  /**
   * Google ID로 사용자를 찾습니다.
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { providerId: googleId },
    });
  }

  /**
   * 새 사용자를 생성합니다.
   */
  async create(createUserDto: Partial<User>): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    this.logger.log(`새 사용자 생성: ${savedUser.email}`);
    return savedUser;
  }

  /**
   * 사용자 정보를 업데이트합니다.
   */
  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  /**
   * 사용자를 삭제합니다.
   */
  async delete(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`사용자를 찾을 수 없습니다: ${id}`);
    }
    this.logger.log(`사용자 삭제: ${id}`);
  }

  /**
   * 사용자를 비활성화합니다.
   */
  async deactivate(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: false });
    this.logger.log(`사용자 비활성화: ${id}`);
  }

  /**
   * 사용자를 활성화합니다.
   */
  async activate(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: true });
    this.logger.log(`사용자 활성화: ${id}`);
  }

  /**
   * 모든 사용자를 조회합니다.
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  /**
   * 페이지네이션 + 검색을 지원하는 사용자 조회 (Admin용)
   */
  async findWithPagination(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
  }): Promise<{ data: User[]; total: number }> {
    const { page, limit, search, role } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // 검색 필터
    if (search) {
      queryBuilder.where('user.email LIKE :search OR user.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    // 역할 필터
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // 정렬 및 페이지네이션
    queryBuilder.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    // 총 개수와 데이터 동시 조회
    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Google ID로 사용자를 찾거나 생성합니다.
   */
  async findOrCreateByGoogle(googleUser: any): Promise<User> {
    let user = await this.findByGoogleId(googleUser.sub);

    if (!user) {
      // 이메일로 기존 사용자 확인
      user = await this.findByEmail(googleUser.email);

      if (user) {
        // 기존 사용자에 Google ID 추가
        user.providerId = googleUser.sub;
        user = await this.update(user.id, { providerId: googleUser.sub });
      } else {
        // 새 사용자 생성
        user = await this.create({
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
          providerId: googleUser.sub,
          authProvider: 'google',
          isActive: true,
          isVerified: googleUser.email_verified,
        });
      }
    }

    return user;
  }

  /**
   * Google OAuth 정보를 저장하거나 업데이트합니다.
   */
  async saveOrUpdateGoogleAuth(params: {
    userId: string;
    providerId: string;
    email: string;
    name?: string;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    tokenExpiresAt?: Date;
    rawData?: any;
  }): Promise<UserSocialAuth> {
    // 사용자당 각 provider는 하나씩만 존재
    const existingAuth = await this.userSocialAuthRepository.findOne({
      where: { userId: params.userId, provider: 'google' },
    });

    if (existingAuth) {
      // 기존 OAuth 정보 업데이트
      Object.assign(existingAuth, {
        ...params,
        updatedAt: new Date(),
      });
      return await this.userSocialAuthRepository.save(existingAuth);
    } else {
      // 새 OAuth 정보 생성
      const newAuth = this.userSocialAuthRepository.create({
        ...params,
        provider: 'google',
      });
      return await this.userSocialAuthRepository.save(newAuth);
    }
  }

  /**
   * Google OAuth 정보를 조회합니다.
   */
  async findGoogleAuth(userId: string): Promise<UserSocialAuth | null> {
    return await this.userSocialAuthRepository.findOne({
      where: { userId, provider: 'google' },
    });
  }

  /**
   * Google OAuth 정보를 삭제합니다.
   */
  async removeGoogleAuth(userId: string): Promise<void> {
    await this.userSocialAuthRepository.delete({
      userId,
      provider: 'google',
    });
    this.logger.log(`Google OAuth 정보 삭제: ${userId}`);
  }

  /**
   * 소셜 OAuth 정보를 저장하거나 업데이트합니다.
   */
  async saveOrUpdateSocialAuth(params: {
    userId: string;
    provider: string; // 'google', 'facebook', 'apple' 등
    providerId: string;
    email: string;
    name?: string;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    tokenExpiresAt?: Date;
    rawData?: any;
  }): Promise<UserSocialAuth> {
    // 사용자당 각 provider는 하나씩만 존재
    const existingAuth = await this.userSocialAuthRepository.findOne({
      where: { userId: params.userId, provider: params.provider },
    });

    if (existingAuth) {
      // 기존 OAuth 정보 업데이트
      Object.assign(existingAuth, {
        ...params,
        updatedAt: new Date(),
      });
      return await this.userSocialAuthRepository.save(existingAuth);
    } else {
      // 새 OAuth 정보 생성
      const newAuth = this.userSocialAuthRepository.create(params);
      return await this.userSocialAuthRepository.save(newAuth);
    }
  }

  /**
   * 특정 provider의 OAuth 정보를 조회합니다.
   */
  async findSocialAuth(
    userId: string,
    provider: string
  ): Promise<UserSocialAuth | null> {
    return await this.userSocialAuthRepository.findOne({
      where: { userId, provider },
    });
  }

  /**
   * 사용자의 모든 소셜 OAuth 정보를 조회합니다.
   */
  async findAllSocialAuth(userId: string): Promise<UserSocialAuth[]> {
    return await this.userSocialAuthRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 특정 provider의 OAuth 정보를 삭제합니다.
   */
  async removeSocialAuth(userId: string, provider: string): Promise<void> {
    await this.userSocialAuthRepository.delete({
      userId,
      provider,
    });
    this.logger.log(`${provider} OAuth 정보 삭제: ${userId}`);
  }

  /**
   * 사용자의 모든 소셜 OAuth 정보를 삭제합니다.
   */
  async removeAllSocialAuth(userId: string): Promise<void> {
    await this.userSocialAuthRepository.delete({
      userId,
    });
    this.logger.log(`모든 소셜 OAuth 정보 삭제: ${userId}`);
  }
}
