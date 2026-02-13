import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateFavoriteDto, UpdateFavoriteDto, ToggleFavoriteDto } from './dto/favorite.dto';
export declare class FavoritesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: number, filters: {
        type?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        favorites: {
            type: import("@prisma/client").$Enums.FavoriteType;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            userId: number;
            targetId: string;
            targetName: string;
            targetData: Prisma.JsonValue | null;
            memo: string | null;
            priority: import("@prisma/client").$Enums.FavoritePriority;
            notificationsOn: boolean;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<{
        type: import("@prisma/client").$Enums.FavoriteType;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: number;
        targetId: string;
        targetName: string;
        targetData: Prisma.JsonValue | null;
        memo: string | null;
        priority: import("@prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }>;
    create(userId: number, dto: CreateFavoriteDto): Promise<{
        type: import("@prisma/client").$Enums.FavoriteType;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: number;
        targetId: string;
        targetName: string;
        targetData: Prisma.JsonValue | null;
        memo: string | null;
        priority: import("@prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }>;
    update(id: number, dto: UpdateFavoriteDto): Promise<{
        type: import("@prisma/client").$Enums.FavoriteType;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: number;
        targetId: string;
        targetName: string;
        targetData: Prisma.JsonValue | null;
        memo: string | null;
        priority: import("@prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
    toggle(userId: number, dto: ToggleFavoriteDto): Promise<{
        action: "REMOVED";
        favorite?: undefined;
    } | {
        action: "ADDED";
        favorite: {
            type: import("@prisma/client").$Enums.FavoriteType;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            userId: number;
            targetId: string;
            targetName: string;
            targetData: Prisma.JsonValue | null;
            memo: string | null;
            priority: import("@prisma/client").$Enums.FavoritePriority;
            notificationsOn: boolean;
        };
    }>;
    check(userId: number, type: string, targetId: string): Promise<{
        isFavorite: boolean;
        favorite: {
            type: import("@prisma/client").$Enums.FavoriteType;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            userId: number;
            targetId: string;
            targetName: string;
            targetData: Prisma.JsonValue | null;
            memo: string | null;
            priority: import("@prisma/client").$Enums.FavoritePriority;
            notificationsOn: boolean;
        } | undefined;
    }>;
    getStatistics(userId: number): Promise<{
        byType: (Prisma.PickEnumerable<Prisma.FavoriteGroupByOutputType, "type"[]> & {
            _count: number;
        })[];
        total: number;
    }>;
    search(userId: number, query: string): Promise<{
        type: import("@prisma/client").$Enums.FavoriteType;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: number;
        targetId: string;
        targetName: string;
        targetData: Prisma.JsonValue | null;
        memo: string | null;
        priority: import("@prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }[]>;
    export(userId: number): Promise<{
        type: import("@prisma/client").$Enums.FavoriteType;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: number;
        targetId: string;
        targetName: string;
        targetData: Prisma.JsonValue | null;
        memo: string | null;
        priority: import("@prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }[]>;
    bulkAdd(userId: number, items: CreateFavoriteDto[]): Promise<Prisma.BatchPayload>;
    bulkDelete(userId: number, ids: number[]): Promise<Prisma.BatchPayload>;
}
