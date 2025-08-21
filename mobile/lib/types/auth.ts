// 인증 관련 타입 정의
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export interface AuthResponse {
  user: any; // User 타입은 user.ts에서 import
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  profileBio?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null; // User 타입은 user.ts에서 import
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface SocialAuthRequest {
  provider: 'google' | 'facebook' | 'apple' | 'kakao' | 'naver';
  accessToken: string;
  userInfo?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export interface SocialAuthResponse extends AuthResponse {
  isNewUser: boolean;
  provider: string;
}

export interface TwoFactorAuthRequest {
  code: string;
  method: 'sms' | 'email' | 'authenticator';
}

export interface TwoFactorAuthSetup {
  isEnabled: boolean;
  methods: Array<{
    type: 'sms' | 'email' | 'authenticator';
    isVerified: boolean;
    lastUsed?: string;
  }>;
  backupCodes: string[];
}

export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
    deviceType: string;
    os: string;
    browser: string;
  };
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress: string;
  userAgent: string;
  deviceType: string;
  os: string;
  browser: string;
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
  success: boolean;
  failureReason?: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  maxAge: number; // days
  preventReuse: number; // number of previous passwords
}

export interface AccountLockoutPolicy {
  maxFailedAttempts: number;
  lockoutDuration: number; // minutes
  requireUnlock: boolean;
  notifyUser: boolean;
}

export interface AuthSettings {
  passwordPolicy: PasswordPolicy;
  accountLockoutPolicy: AccountLockoutPolicy;
  sessionTimeout: number; // minutes
  maxConcurrentSessions: number;
  requireEmailVerification: boolean;
  requireTwoFactorAuth: boolean;
  allowedAuthProviders: string[];
  maintenanceMode: boolean;
}
