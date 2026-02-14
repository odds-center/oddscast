import { UsersService } from './users.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(page?: number, limit?: number, role?: string): Promise<{
        users: {
            availableTickets: number;
            totalTickets: number;
            email: string;
            name: string;
            nickname: string | null;
            avatar: string | null;
            id: number;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    search(query: string): Promise<{
        users: {
            availableTickets: number;
            totalTickets: number;
            email: string;
            name: string;
            nickname: string | null;
            avatar: string | null;
            id: number;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getMe(user: JwtPayload): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: number;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }>;
    getMyStats(user: JwtPayload): Promise<{
        totalTickets: number;
        usedTickets: number;
        availableTickets: number;
        totalFavorites: number;
    }>;
    getProfile(id: number): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: number;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }>;
    updateProfile(id: number, dto: UpdateUserDto): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: number;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    findOne(id: number): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: number;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }>;
    getStats(id: number): Promise<{
        totalTickets: number;
        usedTickets: number;
        availableTickets: number;
        totalFavorites: number;
    }>;
    getStatistics(id: number): Promise<{
        totalTickets: number;
        usedTickets: number;
        availableTickets: number;
        totalFavorites: number;
    }>;
    getAchievements(_id: string): never[];
    getActivities(_id: string): {
        activities: never[];
        total: number;
        page: number;
        totalPages: number;
    };
    getNotifications(_id: string): {
        notifications: never[];
        total: number;
        page: number;
        totalPages: number;
    };
    getPreferences(_id: string): {
        marketing: boolean;
        notifications: boolean;
    };
    updatePreferences(_id: string, _body: any): {
        marketing: boolean;
        notifications: boolean;
    };
    update(id: number, dto: UpdateUserDto): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: number;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
