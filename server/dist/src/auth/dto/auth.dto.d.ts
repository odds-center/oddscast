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
