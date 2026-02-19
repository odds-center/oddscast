"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const google_auth_library_1 = require("google-auth-library");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, config) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        this.googleClient = new google_auth_library_1.OAuth2Client(clientId);
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing)
            throw new common_1.ConflictException('이미 등록된 이메일입니다');
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashed,
                name: dto.name,
                nickname: dto.nickname,
            },
        });
        const token = this.generateToken(user.id, user.email, user.role);
        return { user: this.sanitize(user), ...token };
    }
    async login(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new common_1.UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const token = this.generateToken(user.id, user.email, user.role);
        return { user: this.sanitize(user), ...token };
    }
    async googleLogin(idToken) {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        if (!clientId) {
            throw new common_1.UnauthorizedException('Google 로그인이 설정되지 않았습니다.');
        }
        let ticket;
        try {
            ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: clientId,
            });
        }
        catch {
            throw new common_1.UnauthorizedException('유효하지 않은 Google 토큰입니다.');
        }
        const payload = ticket.getPayload();
        if (!payload?.email) {
            throw new common_1.UnauthorizedException('Google 프로필에서 이메일을 가져올 수 없습니다.');
        }
        const { email, name, picture } = payload;
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const randomPassword = await bcrypt.hash(`google_${Date.now()}_${Math.random().toString(36)}`, 10);
            const baseName = name || email.split('@')[0];
            user = await this.prisma.user.create({
                data: {
                    email,
                    password: randomPassword,
                    name: baseName,
                    nickname: baseName,
                    avatar: picture || null,
                    isEmailVerified: true,
                },
            });
        }
        else {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    avatar: picture || user.avatar,
                },
            });
        }
        const token = this.generateToken(user.id, user.email, user.role);
        return { user: this.sanitize(user), ...token };
    }
    async adminLogin(loginId, password) {
        const admin = await this.prisma.adminUser.findUnique({
            where: { loginId },
        });
        if (!admin)
            throw new common_1.UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다');
        if (!admin.isActive) {
            throw new common_1.UnauthorizedException('비활성화된 계정입니다');
        }
        const valid = await bcrypt.compare(password, admin.password);
        if (!valid)
            throw new common_1.UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다');
        await this.prisma.adminUser.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });
        const token = this.generateToken(admin.id, admin.loginId, 'ADMIN');
        return { user: this.sanitizeAdmin(admin), ...token };
    }
    async getProfile(userId, role) {
        if (role === 'ADMIN') {
            const admin = await this.prisma.adminUser.findUnique({
                where: { id: userId },
            });
            if (!admin)
                throw new common_1.UnauthorizedException();
            return this.sanitizeAdmin(admin);
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        return this.sanitize(user);
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: dto,
        });
        return this.sanitize(user);
    }
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('현재 비밀번호가 일치하지 않습니다');
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashed },
        });
        return { message: '비밀번호가 변경되었습니다' };
    }
    async deleteAccount(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
        return { message: '계정이 비활성화되었습니다' };
    }
    async refreshToken(userId, role) {
        if (role === 'ADMIN') {
            const admin = await this.prisma.adminUser.findUnique({
                where: { id: userId },
            });
            if (!admin)
                throw new common_1.UnauthorizedException();
            return this.generateToken(admin.id, admin.loginId, 'ADMIN');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        return this.generateToken(user.id, user.email, user.role);
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            return { message: '비밀번호 재설정 이메일이 발송되었습니다.' };
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });
        await this.prisma.passwordResetToken.create({
            data: { userId: user.id, token, expiresAt },
        });
        const resendApiKey = this.config.get('RESEND_API_KEY');
        if (resendApiKey) {
        }
        const devReturnToken = this.config.get('DEV_RETURN_RESET_TOKEN') === 'true';
        return {
            message: '비밀번호 재설정 이메일이 발송되었습니다.',
            ...(devReturnToken && { resetToken: token }),
        };
    }
    async resetPassword(token, newPassword) {
        const record = await this.prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (!record || record.expiresAt < new Date()) {
            throw new common_1.BadRequestException('유효하지 않거나 만료된 토큰입니다.');
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: record.userId },
                data: { password: hashed },
            }),
            this.prisma.passwordResetToken.delete({ where: { id: record.id } }),
        ]);
        return { message: '비밀번호가 재설정되었습니다.' };
    }
    async verifyEmail(token) {
        const record = await this.prisma.emailVerificationToken.findUnique({
            where: { token },
        });
        if (!record || record.expiresAt < new Date()) {
            throw new common_1.BadRequestException('유효하지 않거나 만료된 토큰입니다.');
        }
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: record.userId },
                data: { isEmailVerified: true },
            }),
            this.prisma.emailVerificationToken.delete({ where: { id: record.id } }),
        ]);
        return { message: '이메일이 인증되었습니다.' };
    }
    async resendVerification(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            return { message: '인증 메일이 재발송되었습니다.' };
        }
        if (user.isEmailVerified) {
            return { message: '이미 인증된 이메일입니다.' };
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.prisma.emailVerificationToken.deleteMany({
            where: { userId: user.id },
        });
        await this.prisma.emailVerificationToken.create({
            data: { userId: user.id, token, expiresAt },
        });
        const resendApiKey = this.config.get('RESEND_API_KEY');
        if (resendApiKey) {
        }
        const devReturnToken = this.config.get('DEV_RETURN_RESET_TOKEN') === 'true';
        return {
            message: '인증 메일이 재발송되었습니다.',
            ...(devReturnToken && { verificationToken: token }),
        };
    }
    generateToken(userId, email, role) {
        const payload = { sub: userId, email, role };
        return {
            accessToken: this.jwtService.sign(payload),
            refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
        };
    }
    sanitize(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            nickname: user.nickname,
            avatar: user.avatar,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    sanitizeAdmin(admin) {
        return {
            id: admin.id,
            loginId: admin.loginId,
            name: admin.name,
            role: 'ADMIN',
            isActive: admin.isActive,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map