import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, UpdateProfileDto } from './dto/auth.dto';
export interface SanitizedUser {
    id: number;
    email: string;
    name: string;
    nickname: string | null;
    avatar: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface SanitizedAdminUser {
    id: number;
    loginId: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    private config;
    private googleClient;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: SanitizedUser;
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: SanitizedUser;
    }>;
    googleLogin(idToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: SanitizedUser;
    }>;
    adminLogin(loginId: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: SanitizedAdminUser;
    }>;
    getProfile(userId: number, role?: string): Promise<SanitizedUser | SanitizedAdminUser>;
    updateProfile(userId: number, dto: UpdateProfileDto): Promise<SanitizedUser>;
    changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    deleteAccount(userId: number): Promise<{
        message: string;
    }>;
    refreshToken(userId: number, role?: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private generateToken;
    private sanitize;
    private sanitizeAdmin;
}
