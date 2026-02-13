import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AdminLoginDto, GoogleAuthDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("./auth.service").SanitizedUser;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("./auth.service").SanitizedUser;
    }>;
    googleLogin(dto: GoogleAuthDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("./auth.service").SanitizedUser;
    }>;
    adminLogin(dto: AdminLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("./auth.service").SanitizedAdminUser;
    }>;
    logout(_user: JwtPayload): {
        message: string;
    };
    getMe(user: JwtPayload): Promise<import("./auth.service").SanitizedUser | import("./auth.service").SanitizedAdminUser>;
    getProfile(user: JwtPayload): Promise<import("./auth.service").SanitizedUser | import("./auth.service").SanitizedAdminUser>;
    updateProfile(user: JwtPayload, dto: UpdateProfileDto): Promise<import("./auth.service").SanitizedUser>;
    updatePassword(user: JwtPayload, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    changePassword(user: JwtPayload, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    forgotPassword(_body: {
        email: string;
    }): {
        message: string;
    };
    resetPassword(_body: {
        token: string;
        newPassword: string;
    }): {
        message: string;
    };
    verifyEmail(_body: {
        token: string;
    }): {
        message: string;
    };
    resendVerification(_body: {
        email: string;
    }): {
        message: string;
    };
    deleteAccount(user: JwtPayload): Promise<{
        message: string;
    }>;
    refreshToken(user: JwtPayload): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    checkAuth(user: JwtPayload): {
        authenticated: boolean;
        userId: number;
    };
}
