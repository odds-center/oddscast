import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateFavoriteDto, UpdateFavoriteDto, ToggleFavoriteDto } from './dto/favorite.dto';
export declare class FavoritesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string, filters: {
        type?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        favorites: {
            type: import(".prisma/client").$Enums.FavoriteType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            userId: string;
            targetId: string;
            targetName: string;
            targetData: Prisma.JsonValue | null;
            memo: string | null;
            priority: import(".prisma/client").$Enums.FavoritePriority;
            notificationsOn: boolean;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        type: import(".prisma/client").$Enums.FavoriteType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: string;
        targetId: string;
        targetName: string;
        targetData: Prisma.JsonValue | null;
        memo: string | null;
        priority: import(".prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }>;
    create(userId: string, dto: CreateFavoriteDto): Promise<{
        type: import(".prisma/client").$Enums.FavoriteType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: string;
        targetId: string;
        targetName: string;
        targetData: Prisma.JsonValue | null;
        memo: string | null;
        priority: import(".prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }>;
    update(id: string, dto: UpdateFavoriteDto): Promise<{
        type: import(".prisma/client").$Enums.FavoriteType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: string;
        targetId: string;
        targetName: string;
        targetData: Prisma.JsonValue | null;
        memo: string | null;
        priority: import(".prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    toggle(userId: string, dto: ToggleFavoriteDto): Promise<{
        action: "REMOVED";
        favorite?: undefined;
    } | {
        action: "ADDED";
        favorite: {
            type: import(".prisma/client").$Enums.FavoriteType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            userId: string;
            targetId: string;
            targetName: string;
            targetData: Prisma.JsonValue | null;
            memo: string | null;
            priority: import(".prisma/client").$Enums.FavoritePriority;
            notificationsOn: boolean;
        };
    }>;
    check(userId: string, type: string, targetId: string): Promise<{
        isFavorite: boolean;
        favorite: {
            type: import(".prisma/client").$Enums.FavoriteType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            userId: string;
            targetId: string;
            targetName: string;
            targetData: Prisma.JsonValue | null;
            memo: string | null;
            priority: import(".prisma/client").$Enums.FavoritePriority;
            notificationsOn: boolean;
        } | undefined;
    }>;
    getStatistics(userId: string): Promise<{
        byType: (Prisma.PickEnumerable<Prisma.FavoriteGroupByOutputType, "type"[]> & {
            _count: number;
        })[];
        total: number;
    }>;
    search(userId: string, query: string): Promise<{
        type: import(".prisma/client").$Enums.FavoriteType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: string;
        targetId: string;
        targetName: string;
        targetData: Prisma.JsonValue | null;
        memo: string | null;
        priority: import(".prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }[]>;
    export(userId: string): Promise<{
        type: import(".prisma/client").$Enums.FavoriteType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: string;
        targetId: string;
        targetName: string;
        targetData: Prisma.JsonValue | null;
        memo: string | null;
        priority: import(".prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }[]>;
    bulkAdd(userId: string, items: CreateFavoriteDto[]): Promise<Prisma.BatchPayload>;
    bulkDelete(userId: string, ids: string[]): Promise<Prisma.BatchPayload>;
}
