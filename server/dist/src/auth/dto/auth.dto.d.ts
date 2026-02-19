export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    nickname: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class AdminLoginDto {
    loginId: string;
    password: string;
}
export declare class GoogleAuthDto {
    idToken: string;
}
export declare class UpdateProfileDto {
    name?: string;
    nickname?: string;
    avatar?: string;
}
export declare class ChangePasswordDto {
    oldPassword: string;
    newPassword: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class VerifyEmailDto {
    token: string;
}
export declare class ResendVerificationDto {
    email: string;
}
