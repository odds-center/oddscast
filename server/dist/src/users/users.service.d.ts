import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(filters: {
        page?: number;
        limit?: number;
        role?: string;
        search?: string;
    }): Promise<{
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
    getStats(id: number): Promise<{
        totalTickets: number;
        usedTickets: number;
        availableTickets: number;
        totalFavorites: number;
    }>;
}
