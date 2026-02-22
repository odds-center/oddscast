/**
 * Authentication type — based on @oddscast/shared + webapp extension
 */
export type {
  LoginRequest,
  RegisterRequest,
  AuthTokens,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '@oddscast/shared';

/** webapp AuthResponse (login/register response) */
export interface AuthResponse {
  user: import('./user').User;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface UpdateProfileRequest {
  name?: string;
  nickname?: string;
  avatar?: string;
  profileBio?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: import('./user').User | null;
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
