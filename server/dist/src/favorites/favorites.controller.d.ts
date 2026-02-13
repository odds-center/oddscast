import { FavoritesService } from './favorites.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateFavoriteDto, UpdateFavoriteDto, ToggleFavoriteDto } from './dto/favorite.dto';
export declare class FavoritesController {
    private favoritesService;
    constructor(favoritesService: FavoritesService);
    findAll(user: JwtPayload, type?: string, page?: number, limit?: number): Promise<{
        favorites: {
            type: import(".prisma/client").$Enums.FavoriteType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            userId: string;
            targetId: string;
            targetName: string;
            targetData: import("@prisma/client/runtime/client").JsonValue | null;
            memo: string | null;
            priority: import(".prisma/client").$Enums.FavoritePriority;
            notificationsOn: boolean;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getStatistics(user: JwtPayload): Promise<{
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.FavoriteGroupByOutputType, "type"[]> & {
            _count: number;
        })[];
        total: number;
    }>;
    check(user: JwtPayload, type: string, targetId: string): Promise<{
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
            targetData: import("@prisma/client/runtime/client").JsonValue | null;
            memo: string | null;
            priority: import(".prisma/client").$Enums.FavoritePriority;
            notificationsOn: boolean;
        } | undefined;
    }>;
    search(user: JwtPayload, query: string): Promise<{
        type: import(".prisma/client").$Enums.FavoriteType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: string;
        targetId: string;
        targetName: string;
        targetData: import("@prisma/client/runtime/client").JsonValue | null;
        memo: string | null;
        priority: import(".prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }[]>;
    export(user: JwtPayload): Promise<{
        type: import(".prisma/client").$Enums.FavoriteType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: string;
        targetId: string;
        targetName: string;
        targetData: import("@prisma/client/runtime/client").JsonValue | null;
        memo: string | null;
        priority: import(".prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }[]>;
    findOne(id: string): Promise<{
        type: import(".prisma/client").$Enums.FavoriteType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: string;
        targetId: string;
        targetName: string;
        targetData: import("@prisma/client/runtime/client").JsonValue | null;
        memo: string | null;
        priority: import(".prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }>;
    create(user: JwtPayload, dto: CreateFavoriteDto): Promise<{
        type: import(".prisma/client").$Enums.FavoriteType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: string;
        targetId: string;
        targetName: string;
        targetData: import("@prisma/client/runtime/client").JsonValue | null;
        memo: string | null;
        priority: import(".prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }>;
    toggle(user: JwtPayload, dto: ToggleFavoriteDto): Promise<{
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
            targetData: import("@prisma/client/runtime/client").JsonValue | null;
            memo: string | null;
            priority: import(".prisma/client").$Enums.FavoritePriority;
            notificationsOn: boolean;
        };
    }>;
    bulkAdd(user: JwtPayload, items: CreateFavoriteDto[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    bulkDelete(user: JwtPayload, body: {
        ids: string[];
    }): Promise<import(".prisma/client").Prisma.BatchPayload>;
    update(id: string, dto: UpdateFavoriteDto): Promise<{
        type: import(".prisma/client").$Enums.FavoriteType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        userId: string;
        targetId: string;
        targetName: string;
        targetData: import("@prisma/client/runtime/client").JsonValue | null;
        memo: string | null;
        priority: import(".prisma/client").$Enums.FavoritePriority;
        notificationsOn: boolean;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
