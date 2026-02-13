import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, UpdateProfileDto } from './dto/auth.dto';
export interface SanitizedUser {
    id: string;
    email: string;
    name: string;
    nickname: string | null;
    avatar: string | null;
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
    adminLogin(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: SanitizedUser;
    }>;
    getProfile(userId: string): Promise<SanitizedUser>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<SanitizedUser>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
    refreshToken(userId: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private generateToken;
    private sanitize;
}
