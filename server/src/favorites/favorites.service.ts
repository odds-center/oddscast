import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FavoriteType, FavoritePriority } from '../database/db-enums';
import { Favorite } from '../database/entities/favorite.entity';
import {
  CreateFavoriteDto,
  UpdateFavoriteDto,
  ToggleFavoriteDto,
} from './dto/favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
  ) {}

  async findAll(
    userId: number,
    filters: { type?: string; page?: number; limit?: number },
  ) {
    const { page = 1, limit = 20, type = 'RACE' } = filters;
    const favType = (type || 'RACE') as FavoriteType;
    const [favorites, total] = await this.favoriteRepo.findAndCount({
      where: { userId, type: favType },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      favorites,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const fav = await this.favoriteRepo.findOne({ where: { id } });
    if (!fav) throw new NotFoundException('즐겨찾기를 찾을 수 없습니다');
    return fav;
  }

  async create(userId: number, dto: CreateFavoriteDto) {
    const now = new Date();
    const favorite = this.favoriteRepo.create({
      userId,
      type: dto.type as FavoriteType,
      targetId: dto.targetId,
      targetName: dto.targetName ?? '',
      targetData: dto.targetData ?? null,
      memo: dto.memo ?? null,
      priority: (dto.priority as FavoritePriority) ?? FavoritePriority.MEDIUM,
      tags: dto.tags ?? [],
      updatedAt: now,
    });
    return this.favoriteRepo.save(favorite);
  }

  async update(id: number, dto: UpdateFavoriteDto, userId?: number) {
    const where: Record<string, unknown> = { id };
    if (userId !== undefined) where.userId = userId;
    const favorite = await this.favoriteRepo.findOne({ where });
    if (!favorite) throw new NotFoundException('즐겨찾기를 찾을 수 없습니다');
    if (dto.targetName !== undefined) favorite.targetName = dto.targetName;
    if (dto.targetData !== undefined) favorite.targetData = dto.targetData;
    if (dto.memo !== undefined) favorite.memo = dto.memo;
    if (dto.priority !== undefined)
      favorite.priority = dto.priority as FavoritePriority;
    if (dto.tags !== undefined) favorite.tags = dto.tags;
    return this.favoriteRepo.save(favorite);
  }

  async remove(id: number, userId?: number) {
    const where: Record<string, unknown> = { id };
    if (userId !== undefined) where.userId = userId;
    const result = await this.favoriteRepo.delete(where);
    if (!result.affected) throw new NotFoundException('즐겨찾기를 찾을 수 없습니다');
    return { message: '즐겨찾기가 삭제되었습니다' };
  }

  async toggle(userId: number, dto: ToggleFavoriteDto) {
    const existing = await this.favoriteRepo.findOne({
      where: {
        userId,
        type: dto.type as FavoriteType,
        targetId: dto.targetId,
      },
    });
    if (existing) {
      await this.favoriteRepo.delete(existing.id);
      return { action: 'REMOVED' as const };
    }
    const fav = await this.create(userId, {
      type: dto.type,
      targetId: dto.targetId,
      targetName: dto.targetName,
      targetData: dto.targetData,
      priority: dto.priority,
      tags: dto.tags,
    });
    return { action: 'ADDED' as const, favorite: fav };
  }

  async check(userId: number, type: string, targetId: string) {
    const fav = await this.favoriteRepo.findOne({
      where: {
        userId,
        type: type as FavoriteType,
        targetId,
      },
    });
    return { isFavorite: !!fav, favorite: fav ?? undefined };
  }

  async getStatistics(userId: number) {
    const rows = await this.favoriteRepo
      .createQueryBuilder('f')
      .select('f.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('f.userId = :userId', { userId })
      .groupBy('f.type')
      .getRawMany<{ type: string; count: string }>();
    const byType = rows.map((r) => ({
      type: r.type,
      _count: parseInt(r.count, 10),
    }));
    const total = byType.reduce((sum, c) => sum + (c._count ?? 0), 0);
    return { byType, total };
  }

  async search(userId: number, query: string) {
    const term = `%${query}%`;
    return this.favoriteRepo
      .createQueryBuilder('f')
      .where('f.userId = :userId', { userId })
      .andWhere('f.type = :type', { type: 'RACE' })
      .andWhere('(f.targetName ILIKE :term OR f.memo ILIKE :term)', { term })
      .orderBy('f.createdAt', 'DESC')
      .getMany();
  }

  async export(userId: number) {
    return this.favoriteRepo.find({
      where: { userId, type: FavoriteType.RACE },
      order: { createdAt: 'DESC' },
    });
  }

  async bulkAdd(userId: number, items: CreateFavoriteDto[]) {
    const raceItems = items.filter((item) => item.type === 'RACE');
    let inserted = 0;
    for (const item of raceItems) {
      const existing = await this.favoriteRepo.findOne({
        where: {
          userId,
          type: FavoriteType.RACE,
          targetId: item.targetId,
        },
      });
      if (existing) continue;
      const now = new Date();
      await this.favoriteRepo.save(
        this.favoriteRepo.create({
          userId,
          type: FavoriteType.RACE,
          targetId: item.targetId,
          targetName: item.targetName ?? '',
          targetData: item.targetData ?? null,
          memo: item.memo ?? null,
          priority:
            (item.priority as FavoritePriority) ?? FavoritePriority.MEDIUM,
          tags: item.tags ?? [],
          updatedAt: now,
        }),
      );
      inserted++;
    }
    return { count: inserted };
  }

  async bulkDelete(userId: number, ids: number[]) {
    if (ids.length === 0) return { count: 0 };
    const result = await this.favoriteRepo.delete({
      userId,
      id: In(ids),
    });
    return { count: result.affected ?? 0 };
  }
}
