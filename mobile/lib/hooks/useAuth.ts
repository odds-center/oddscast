import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthApi } from '@/lib/api/authApi';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/lib/types/auth';
import type { User } from '@/lib/types/user';
import googleAuth from '@/utils/GoogleAuthService';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

// Google 로그인
export const useGoogleLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Google 로그인 실행
      const result = await googleAuth.signIn();

      if (result.type === 'success' && result.data) {
        // Google 사용자 정보를 서버에 전송하여 인증 처리
        // 임시로 사용자 정보만 반환 (실제로는 서버 API 호출 필요)
        const mockAuthResponse: AuthResponse = {
          user: {
            id: result.data.user.id,
            email: result.data.user.email,
            name: result.data.user.name,
            avatar: result.data.user.photo,
            authProvider: 'google',
            providerId: result.data.user.id,
            isActive: true,
            isVerified: true,
            role: 'user',
            totalBets: 0,
            wonBets: 0,
            lostBets: 0,
            winRate: 0,
            totalWinnings: 0,
            totalLosses: 0,
            roi: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          accessToken: result.data.idToken,
          refreshToken: result.data.serverAuthCode || '',
          expiresIn: 3600,
          tokenType: 'Bearer',
        };

        return mockAuthResponse;
      } else {
        throw new Error(result.error || 'Google 로그인에 실패했습니다.');
      }
    },
    onSuccess: (authResponse: AuthResponse) => {
      // 사용자 정보 설정
      queryClient.setQueryData(['user'], authResponse.user);

      // 인증 상태 업데이트
      queryClient.setQueryData(['auth'], { isAuthenticated: true, user: authResponse.user });

      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// 로그인
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => AuthApi.login(credentials),
    onSuccess: (authResponse: AuthResponse) => {
      // 사용자 정보 설정
      queryClient.setQueryData(['user'], authResponse.user);

      // 인증 상태 업데이트
      queryClient.setQueryData(['auth'], { isAuthenticated: true, user: authResponse.user });

      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// 회원가입
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => AuthApi.register(userData),
    onSuccess: (authResponse: AuthResponse) => {
      // 사용자 정보 설정
      queryClient.setQueryData(['user'], authResponse.user);

      // 인증 상태 업데이트
      queryClient.setQueryData(['auth'], { isAuthenticated: true, user: authResponse.user });

      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// 로그아웃
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Google 로그아웃도 함께 실행
      try {
        await googleAuth.signOut();
      } catch (error) {
        console.warn('Google 로그아웃 실패:', error);
      }

      return AuthApi.logout();
    },
    onSuccess: () => {
      // 사용자 정보 제거
      queryClient.removeQueries({ queryKey: ['user'] });

      // 인증 상태 업데이트
      queryClient.setQueryData(['auth'], { isAuthenticated: false, user: null });

      // 모든 쿼리 무효화
      queryClient.clear();
    },
  });
};

// 토큰 갱신
export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AuthApi.refreshToken(),
    onSuccess: (authResponse: AuthResponse) => {
      // 사용자 정보 업데이트
      queryClient.setQueryData(['user'], authResponse.user);

      // 인증 상태 업데이트
      queryClient.setQueryData(['auth'], { isAuthenticated: true, user: authResponse.user });
    },
  });
};

// 현재 사용자 정보 조회
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => AuthApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 프로필 업데이트
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateData: Partial<User>) => AuthApi.updateProfile(updateData),
    onSuccess: (updatedUser: User) => {
      // 사용자 정보 업데이트
      queryClient.setQueryData(['user'], updatedUser);

      // 인증 상태 업데이트
      queryClient.setQueryData(['auth'], (oldData: AuthState | undefined) => ({
        ...oldData,
        user: updatedUser,
      }));
    },
  });
};

// 비밀번호 변경
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (passwordData: { currentPassword: string; newPassword: string }) =>
      AuthApi.changePassword(passwordData),
  });
};

// 비밀번호 찾기
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => AuthApi.forgotPassword(email),
  });
};

// 비밀번호 재설정
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (resetData: { token: string; newPassword: string }) =>
      AuthApi.resetPassword(resetData),
  });
};

// 이메일 인증
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: (token: string) => AuthApi.verifyEmail(token),
  });
};

// 인증 이메일 재전송
export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: (email: string) => AuthApi.resendVerificationEmail(email),
  });
};
