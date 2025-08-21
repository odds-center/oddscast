# Golden Race - 상태 관리 가이드

## 🔄 개요

Golden Race 모바일 앱의 상태 관리 전략과 구현 방법을 설명합니다. React Query(TanStack Query)와
Zustand를 조합하여 효율적이고 예측 가능한 상태 관리를 구현합니다.

## 🏗️ 상태 관리 아키텍처

### 전체 구조

```
상태 관리 계층
├── 🗄️ 서버 상태 (React Query)
│   ├── 경주 정보
│   ├── 베팅 데이터
│   ├── 사용자 정보
│   └── 실시간 데이터
├── 🎯 클라이언트 상태 (Zustand)
│   ├── UI 상태
│   ├── 인증 상태
│   ├── 테마 설정
│   └── 로컬 설정
└── 🔗 동기화 레이어
    ├── 캐시 무효화
    ├── 낙관적 업데이트
    └── 오프라인 동기화
```

### 기술 스택O

- **React Query (TanStack Query)**: 서버 상태 관리
- **Zustand**: 클라이언트 상태 관리
- **React Context**: 테마 및 인증 컨텍스트
- **AsyncStorage**: 로컬 데이터 저장

## 🗄️ 서버 상태 관리 (React Query)

### 기본 설정

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// App.tsx
import { QueryClientProvider } from '@tanstack/react-query';

export default function App() {
  return <QueryClientProvider client={queryClient}>{/* 앱 컴포넌트들 */}</QueryClientProvider>;
}
```

### 경주 데이터 쿼리

```typescript
// hooks/useRaces.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { racesApi } from '@/lib/api/races';

export const useRaces = (filters?: RaceFilters) => {
  return useQuery({
    queryKey: ['races', filters],
    queryFn: () => racesApi.getRaces(filters),
    staleTime: 2 * 60 * 1000, // 2분
  });
};

export const useRace = (raceId: string) => {
  return useQuery({
    queryKey: ['race', raceId],
    queryFn: () => racesApi.getRace(raceId),
    enabled: !!raceId,
  });
};

export const useRaceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: racesApi.updateRace,
    onSuccess: (data, variables) => {
      // 성공 시 캐시 업데이트
      queryClient.setQueryData(['race', variables.id], data);
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
    onError: (error) => {
      console.error('경주 업데이트 실패:', error);
    },
  });
};
```

### 베팅 데이터 쿼리

```typescript
// hooks/useBets.ts
export const useBets = (userId: string) => {
  return useQuery({
    queryKey: ['bets', userId],
    queryFn: () => betsApi.getBets(userId),
    staleTime: 1 * 60 * 1000, // 1분
  });
};

export const useCreateBet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: betsApi.createBet,
    onMutate: async (newBet) => {
      // 낙관적 업데이트
      await queryClient.cancelQueries({ queryKey: ['bets', newBet.userId] });

      const previousBets = queryClient.getQueryData(['bets', newBet.userId]);

      queryClient.setQueryData(['bets', newBet.userId], (old: Bet[]) => [
        ...old,
        { ...newBet, id: 'temp-' + Date.now(), status: 'PENDING' },
      ]);

      return { previousBets };
    },
    onError: (err, newBet, context) => {
      // 에러 시 이전 상태로 롤백
      if (context?.previousBets) {
        queryClient.setQueryData(['bets', newBet.userId], context.previousBets);
      }
    },
    onSettled: (data, error, variables) => {
      // 완료 시 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['bets', variables.userId] });
    },
  });
};
```

### 실시간 데이터 동기화

```typescript
// hooks/useRealtimeRaces.ts
export const useRealtimeRaces = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      // 주기적으로 데이터 갱신
      queryClient.invalidateQueries({ queryKey: ['races'] });
    }, 30000); // 30초마다

    return () => clearInterval(interval);
  }, [queryClient]);

  return useRaces();
};
```

## 🎯 클라이언트 상태 관리 (Zustand)

### 인증 상태 스토어

```typescript
// store/authSlice.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (user: User, token: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),

      signIn: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }),

      signOut: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
```

### UI 상태 스토어

```typescript
// store/uiSlice.ts
interface UIState {
  theme: 'light' | 'dark';
  language: 'ko' | 'en';
  notifications: NotificationSettings;
  sidebarOpen: boolean;

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'ko' | 'en') => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'ko',
      notifications: {
        push: true,
        email: false,
        sms: false,
        raceStart: true,
        bettingResult: true,
      },
      sidebarOpen: false,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      updateNotifications: (settings) =>
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        })),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### 베팅 상태 스토어

```typescript
// store/bettingSlice.ts
interface BettingState {
  currentBet: Bet | null;
  betHistory: Bet[];
  favorites: string[]; // 즐겨찾기한 말 ID들

  // Actions
  setCurrentBet: (bet: Bet | null) => void;
  addToHistory: (bet: Bet) => void;
  toggleFavorite: (horseId: string) => void;
  clearHistory: () => void;
}

export const useBettingStore = create<BettingState>()(
  persist(
    (set, get) => ({
      currentBet: null,
      betHistory: [],
      favorites: [],

      setCurrentBet: (bet) => set({ currentBet: bet }),

      addToHistory: (bet) =>
        set((state) => ({
          betHistory: [bet, ...state.betHistory].slice(0, 100), // 최근 100개만 유지
        })),

      toggleFavorite: (horseId) =>
        set((state) => ({
          favorites: state.favorites.includes(horseId)
            ? state.favorites.filter((id) => id !== horseId)
            : [...state.favorites, horseId],
        })),

      clearHistory: () => set({ betHistory: [] }),
    }),
    {
      name: 'betting-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        betHistory: state.betHistory,
        favorites: state.favorites,
      }),
    }
  )
);
```

## 🔗 상태 동기화 전략

### 캐시 무효화 전략

```typescript
// utils/cacheUtils.ts
export const invalidateRelatedQueries = (
  queryClient: QueryClient,
  entityType: 'race' | 'bet' | 'user'
) => {
  switch (entityType) {
    case 'race':
      queryClient.invalidateQueries({ queryKey: ['races'] });
      queryClient.invalidateQueries({ queryKey: ['race'] });
      break;
    case 'bet':
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      break;
    case 'user':
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      break;
  }
};
```

### 낙관적 업데이트

```typescript
// hooks/useOptimisticUpdate.ts
export const useOptimisticUpdate = <T>(queryKey: string[], updateFn: (oldData: T) => T) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: any) => {
      // 실제 API 호출
      return await api.update(variables);
    },
    onMutate: async (variables) => {
      // 낙관적 업데이트
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: T) => updateFn(old));

      return { previousData };
    },
    onError: (err, variables, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // 완료 시 캐시 무효화
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
```

## 📱 컴포넌트에서 상태 사용

### 서버 상태 사용

```typescript
// components/races/RaceList.tsx
export default function RaceList() {
  const { data: races, isLoading, error } = useRaces();
  const { mutate: updateRace } = useRaceMutation();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const handleRaceUpdate = (raceId: string, updates: Partial<Race>) => {
    updateRace({ id: raceId, ...updates });
  };

  return (
    <FlatList
      data={races}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <RaceCard race={item} onUpdate={handleRaceUpdate} />}
    />
  );
}
```

### 클라이언트 상태 사용

```typescript
// components/common/ThemeToggle.tsx
export default function ThemeToggle() {
  const { theme, setTheme } = useUIStore();
  const { colors } = useAppTheme();

  const handleToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={{
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: 8,
      }}
    >
      <IconSymbol name={theme === 'light' ? 'moon' : 'sun'} size={24} color={colors.text} />
    </TouchableOpacity>
  );
}
```

### 복합 상태 사용

```typescript
// components/betting/BettingForm.tsx
export default function BettingForm({ raceId }: { raceId: string }) {
  const { user } = useAuthStore();
  const { currentBet, setCurrentBet } = useBettingStore();
  const { mutate: createBet, isLoading } = useCreateBet();

  const handleSubmit = (betData: BetFormData) => {
    if (!user) return;

    const bet: Bet = {
      id: '',
      userId: user.id,
      raceId,
      ...betData,
      createdAt: new Date(),
      status: 'PENDING',
    };

    setCurrentBet(bet);
    createBet(bet);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* 폼 필드들 */}
      <Button title='베팅하기' onPress={handleSubmit} disabled={isLoading} />
    </Form>
  );
}
```

## 🔄 상태 지속성 및 동기화

### 오프라인 지원

```typescript
// utils/offlineSync.ts
export const setupOfflineSync = (queryClient: QueryClient) => {
  // 오프라인 상태 감지
  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      // 온라인 상태가 되면 동기화
      syncOfflineData(queryClient);
    }
  });
};

const syncOfflineData = async (queryClient: QueryClient) => {
  const offlineMutations = await AsyncStorage.getItem('offline-mutations');

  if (offlineMutations) {
    const mutations = JSON.parse(offlineMutations);

    for (const mutation of mutations) {
      try {
        await queryClient.executeMutation(mutation);
      } catch (error) {
        console.error('오프라인 동기화 실패:', error);
      }
    }

    await AsyncStorage.removeItem('offline-mutations');
  }
};
```

### 백그라운드 동기화

```typescript
// utils/backgroundSync.ts
export const setupBackgroundSync = () => {
  // 앱이 백그라운드로 갈 때
  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'background') {
      // 백그라운드에서 데이터 동기화
      syncInBackground();
    }
  });
};

const syncInBackground = async () => {
  try {
    // 백그라운드 작업 실행
    await BackgroundFetch.registerTaskAsync('data-sync', {
      minimumInterval: 15 * 60, // 15분
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    console.error('백그라운드 동기화 설정 실패:', error);
  }
};
```

## 🧪 상태 관리 테스트

### 스토어 테스트

```typescript
// __tests__/store/authSlice.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '@/store/authSlice';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  it('should sign in user', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.signIn(mockUser, 'token123');
    });

    expect(result.current.user).toBe(mockUser);
    expect(result.current.token).toBe('token123');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should sign out user', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.signIn(mockUser, 'token123');
      result.current.signOut();
    });

    expect(result.current.user).toBe(null);
    expect(result.current.token).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### 쿼리 테스트

```typescript
// __tests__/hooks/useRaces.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRaces } from '@/hooks/useRaces';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('useRaces', () => {
  it('should fetch races successfully', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRaces(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRaces);
  });
});
```

## 📚 관련 문서

- [UI 컴포넌트](./UI_COMPONENTS.md) - UI 컴포넌트 가이드
- [네비게이션](./NAVIGATION.md) - 네비게이션 구조 및 컴포넌트
- [API 연동](./API_INTEGRATION.md) - 서버 API 사용법
- [테마 시스템](./Theming.md) - 테마 및 스타일링

---

> 🔄 **효율적이고 예측 가능한 상태 관리로 사용자 경험을 향상시키는 것이 목표입니다.**
