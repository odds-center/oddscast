import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Favorite, FavoriteType } from './entities/favorite.entity';
import {
  CreateFavoriteDto,
  UpdateFavoriteDto,
  FavoriteResponseDto,
  FavoriteListResponseDto,
  FavoriteToggleDto,
  FavoriteCheckDto,
  FavoriteStatisticsDto,
} from './dto/index';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>
  ) {}

  /**
   * 즐겨찾기 목록 조회
   */
  async getFavorites(
    userId: string,
    filters?: {
      type?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<FavoriteListResponseDto> {
    const { type, page = 1, limit = 20 } = filters || {};

    const queryBuilder = this.favoriteRepo
      .createQueryBuilder('favorite')
      .where('favorite.userId = :userId', { userId });

    if (type) {
      queryBuilder.andWhere('favorite.type = :type', { type });
    }

    const [favorites, total] = await queryBuilder
      .orderBy('favorite.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      favorites: favorites.map(f => new FavoriteResponseDto(f)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 즐겨찾기 상세 조회
   */
  async getFavorite(userId: string, id: string): Promise<FavoriteResponseDto> {
    const favorite = await this.favoriteRepo.findOne({
      where: { id, userId },
    });

    if (!favorite) {
      throw new NotFoundException('즐겨찾기를 찾을 수 없습니다.');
    }

    return new FavoriteResponseDto(favorite);
  }

  /**
   * 즐겨찾기 생성
   */
  async createFavorite(
    userId: string,
    createFavoriteDto: CreateFavoriteDto
  ): Promise<FavoriteResponseDto> {
    const { type, targetId, targetName, targetData, notes, tags } =
      createFavoriteDto;

    // 중복 확인
    const existing = await this.favoriteRepo.findOne({
      where: { userId, type, targetId },
    });

    if (existing) {
      throw new ConflictException('이미 즐겨찾기에 추가된 항목입니다.');
    }

    const favorite = this.favoriteRepo.create({
      userId,
      type,
      targetId,
      targetName,
      targetData,
      notes,
      tags,
    });

    const saved = await this.favoriteRepo.save(favorite);
    this.logger.log(`즐겨찾기 생성: ${saved.id}`);

    return new FavoriteResponseDto(saved);
  }

  /**
   * 즐겨찾기 수정
   */
  async updateFavorite(
    userId: string,
    id: string,
    updateFavoriteDto: UpdateFavoriteDto
  ): Promise<FavoriteResponseDto> {
    const favorite = await this.favoriteRepo.findOne({
      where: { id, userId },
    });

    if (!favorite) {
      throw new NotFoundException('즐겨찾기를 찾을 수 없습니다.');
    }

    Object.assign(favorite, updateFavoriteDto);
    const saved = await this.favoriteRepo.save(favorite);

    this.logger.log(`즐겨찾기 수정: ${saved.id}`);
    return new FavoriteResponseDto(saved);
  }

  /**
   * 즐겨찾기 삭제
   */
  async deleteFavorite(
    userId: string,
    id: string
  ): Promise<{ message: string }> {
    const favorite = await this.favoriteRepo.findOne({
      where: { id, userId },
    });

    if (!favorite) {
      throw new NotFoundException('즐겨찾기를 찾을 수 없습니다.');
    }

    await this.favoriteRepo.remove(favorite);
    this.logger.log(`즐겨찾기 삭제: ${id}`);

    return { message: '즐겨찾기가 삭제되었습니다.' };
  }

  /**
   * 즐겨찾기 토글 (추가/삭제)
   */
  async toggleFavorite(
    userId: string,
    toggleDto: FavoriteToggleDto
  ): Promise<{ action: 'ADDED' | 'REMOVED'; favorite?: FavoriteResponseDto }> {
    const { type, targetId, targetName, targetData } = toggleDto;

    const existing = await this.favoriteRepo.findOne({
      where: { userId, type, targetId },
    });

    if (existing) {
      // 기존 즐겨찾기 삭제
      await this.favoriteRepo.remove(existing);
      this.logger.log(`즐겨찾기 토글 - 삭제: ${existing.id}`);
      return { action: 'REMOVED' };
    } else {
      // 새 즐겨찾기 추가
      const favorite = this.favoriteRepo.create({
        userId,
        type,
        targetId,
        targetName,
        targetData,
      });

      const saved = await this.favoriteRepo.save(favorite);
      this.logger.log(`즐겨찾기 토글 - 추가: ${saved.id}`);
      return { action: 'ADDED', favorite: new FavoriteResponseDto(saved) };
    }
  }

  /**
   * 즐겨찾기 확인
   */
  async checkFavorite(
    userId: string,
    type: string,
    targetId: string
  ): Promise<FavoriteCheckDto> {
    const favorite = await this.favoriteRepo.findOne({
      where: { userId, type: type as FavoriteType, targetId },
    });

    return {
      isFavorite: !!favorite,
      favorite: favorite ? new FavoriteResponseDto(favorite) : undefined,
    };
  }

  /**
   * 즐겨찾기 통계 조회
   */
  async getFavoriteStatistics(userId: string): Promise<FavoriteStatisticsDto> {
    const totalFavorites = await this.favoriteRepo.count({
      where: { userId },
    });

    // 타입별 통계
    const favoritesByType = await this.favoriteRepo
      .createQueryBuilder('favorite')
      .select('favorite.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('favorite.userId = :userId', { userId })
      .groupBy('favorite.type')
      .getRawMany();

    const typeStats: Record<FavoriteType, number> = {
      [FavoriteType.HORSE]: 0,
      [FavoriteType.JOCKEY]: 0,
      [FavoriteType.TRAINER]: 0,
      [FavoriteType.RACE]: 0,
    };

    favoritesByType.forEach(stat => {
      typeStats[stat.type] = parseInt(stat.count);
    });

    // 최근 7일간 추가된 즐겨찾기
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentFavorites = await this.favoriteRepo.count({
      where: {
        userId,
        createdAt: { $gte: weekAgo } as any,
      },
    });

    // 가장 많이 즐겨찾기된 타입
    const mostFavoritedType = Object.entries(typeStats).reduce((a, b) =>
      typeStats[a[0] as FavoriteType] > typeStats[b[0] as FavoriteType] ? a : b
    )[0] as FavoriteType;

    return {
      totalFavorites,
      favoritesByType: typeStats,
      recentFavorites,
      mostFavoritedType,
    };
  }

  /**
   * 즐겨찾기 일괄 추가
   */
  async bulkAddFavorites(
    userId: string,
    favorites: CreateFavoriteDto[]
  ): Promise<{
    added: number;
    failed: number;
    errors: { index: number; error: string }[];
  }> {
    let added = 0;
    let failed = 0;
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < favorites.length; i++) {
      try {
        await this.createFavorite(userId, favorites[i]);
        added++;
      } catch (error) {
        failed++;
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    return { added, failed, errors };
  }

  /**
   * 즐겨찾기 일괄 삭제
   */
  async bulkDeleteFavorites(
    userId: string,
    favoriteIds: string[]
  ): Promise<{
    deleted: number;
    failed: number;
    errors: { favoriteId: string; error: string }[];
  }> {
    let deleted = 0;
    let failed = 0;
    const errors: { favoriteId: string; error: string }[] = [];

    for (const favoriteId of favoriteIds) {
      try {
        await this.deleteFavorite(userId, favoriteId);
        deleted++;
      } catch (error) {
        failed++;
        errors.push({
          favoriteId,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    return { deleted, failed, errors };
  }
}
