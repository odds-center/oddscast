import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Favorite,
  FavoritePriority,
  FavoriteType,
} from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>
  ) {}

  // 즐겨찾기 생성
  async create(
    userId: string,
    createFavoriteDto: CreateFavoriteDto
  ): Promise<Favorite> {
    try {
      // 중복 체크
      const existing = await this.favoritesRepository.findOne({
        where: {
          userId,
          type: createFavoriteDto.type,
          targetId: createFavoriteDto.targetId,
        },
      });

      if (existing) {
        throw new ConflictException('이미 즐겨찾기에 추가된 항목입니다.');
      }

      const favorite = this.favoritesRepository.create({
        userId,
        ...createFavoriteDto,
      });

      const saved = await this.favoritesRepository.save(favorite);
      this.logger.log(`즐겨찾기 생성: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`즐겨찾기 생성 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 즐겨찾기 목록 조회 (필터링 및 페이지네이션)
  async findAll(
    userId: string,
    filters?: {
      type?: FavoriteType;
      priority?: FavoritePriority;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    favorites: Favorite[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const queryBuilder = this.favoritesRepository
        .createQueryBuilder('favorite')
        .where('favorite.userId = :userId', { userId });

      if (filters?.type) {
        queryBuilder.andWhere('favorite.type = :type', { type: filters.type });
      }

      if (filters?.priority) {
        queryBuilder.andWhere('favorite.priority = :priority', {
          priority: filters.priority,
        });
      }

      queryBuilder.orderBy('favorite.createdAt', 'DESC').skip(skip).take(limit);

      const [favorites, total] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(total / limit);

      return {
        favorites,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `즐겨찾기 목록 조회 실패: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  // 개별 즐겨찾기 조회
  async findOne(userId: string, favoriteId: string): Promise<Favorite> {
    try {
      const favorite = await this.favoritesRepository.findOne({
        where: { id: favoriteId, userId },
      });

      if (!favorite) {
        throw new NotFoundException('즐겨찾기를 찾을 수 없습니다.');
      }

      return favorite;
    } catch (error) {
      this.logger.error(`즐겨찾기 조회 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 즐겨찾기 수정
  async update(
    userId: string,
    favoriteId: string,
    updateFavoriteDto: UpdateFavoriteDto
  ): Promise<Favorite> {
    try {
      const favorite = await this.findOne(userId, favoriteId);

      Object.assign(favorite, updateFavoriteDto);

      const updated = await this.favoritesRepository.save(favorite);
      this.logger.log(`즐겨찾기 수정: ${updated.id}`);
      return updated;
    } catch (error) {
      this.logger.error(`즐겨찾기 수정 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 즐겨찾기 삭제
  async remove(userId: string, favoriteId: string): Promise<void> {
    try {
      const favorite = await this.findOne(userId, favoriteId);
      await this.favoritesRepository.remove(favorite);
      this.logger.log(`즐겨찾기 삭제: ${favoriteId}`);
    } catch (error) {
      this.logger.error(`즐겨찾기 삭제 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 특정 대상이 즐겨찾기에 있는지 확인
  async checkFavorite(
    userId: string,
    type: FavoriteType,
    targetId: string
  ): Promise<boolean> {
    try {
      const favorite = await this.favoritesRepository.findOne({
        where: { userId, type, targetId },
      });

      return !!favorite;
    } catch (error) {
      this.logger.error(`즐겨찾기 확인 실패: ${error.message}`, error.stack);
      return false;
    }
  }

  // 즐겨찾기 통계
  async getStatistics(userId: string): Promise<{
    totalFavorites: number;
    byType: Record<FavoriteType, number>;
    byPriority: Record<FavoritePriority, number>;
    recentAdditions: Favorite[];
  }> {
    try {
      const [favorites, total] = await this.favoritesRepository.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      const byType = favorites.reduce(
        (acc, fav) => {
          acc[fav.type] = (acc[fav.type] || 0) + 1;
          return acc;
        },
        {} as Record<FavoriteType, number>
      );

      const byPriority = favorites.reduce(
        (acc, fav) => {
          acc[fav.priority] = (acc[fav.priority] || 0) + 1;
          return acc;
        },
        {} as Record<FavoritePriority, number>
      );

      const recentAdditions = favorites.slice(0, 5);

      return {
        totalFavorites: total,
        byType,
        byPriority,
        recentAdditions,
      };
    } catch (error) {
      this.logger.error(
        `즐겨찾기 통계 조회 실패: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  // 즐겨찾기 일괄 삭제
  async bulkDelete(
    userId: string,
    favoriteIds: string[]
  ): Promise<{
    deleted: number;
    failed: number;
    errors: { favoriteId: string; error: string }[];
  }> {
    const result = {
      deleted: 0,
      failed: 0,
      errors: [] as { favoriteId: string; error: string }[],
    };

    for (const favoriteId of favoriteIds) {
      try {
        await this.remove(userId, favoriteId);
        result.deleted++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          favoriteId,
          error: error.message,
        });
      }
    }

    return result;
  }
}
