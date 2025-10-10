# Golden Race - 네비게이션 가이드

## 🧭 개요

Golden Race 모바일 앱의 네비게이션 구조와 사용법을 설명합니다. Expo Router를 기반으로 한 파일 기반
라우팅과 탭 네비게이션을 사용하여 직관적인 사용자 경험을 제공합니다.

## 🏗️ 네비게이션 구조

### 전체 구조

```
app/
├── _layout.tsx                 # 루트 레이아웃
├── (app)/                      # 인증된 사용자 전용
│   ├── _layout.tsx            # 탭 네비게이션 레이아웃
│   ├── index.tsx              # 홈 화면
│   ├── races/                 # 경주 관련 화면
│   │   ├── races.tsx          # 경주 목록
│   │   └── [raceId].tsx       # 경주 상세 (동적 라우트)
│   ├── betting/               # 베팅 관련 화면
│   │   ├── betting.tsx        # 베팅 선택
│   │   ├── confirm.tsx        # 베팅 확인
│   │   └── history.tsx        # 베팅 내역
│   ├── results/               # 결과 관련 화면
│   │   └── results.tsx        # 경주 결과
│   └── mypage/                # 마이페이지
│       ├── _layout.tsx        # 마이페이지 레이아웃
│       ├── index.tsx          # 프로필
│       ├── favorites.tsx      # 즐겨찾기
│       ├── history.tsx        # 베팅 히스토리
│       ├── notifications.tsx  # 알림 설정
│       ├── settings.tsx       # 앱 설정
│       └── help.tsx           # 도움말
├── (auth)/                     # 인증 관련 화면
│   ├── _layout.tsx            # 인증 레이아웃
│   └── login.tsx              # 로그인
└── +not-found.tsx             # 404 페이지
```

### 탭 네비게이션 구조

```
Tab Navigator (Bottom Tabs)
├── 🏠 Home (홈)
├── 🏇 Races (경주)
├── 🎯 Betting (베팅)
├── 📊 Results (결과)
└── 👤 MyPage (마이페이지)
```

## 🔧 네비게이션 컴포넌트

### CustomTabs

커스텀 탭바 컴포넌트입니다.

```typescript
import { CustomTabs } from '@/components/navigation';

// 기본 사용법
<CustomTabs />

// 커스텀 스타일
<CustomTabs
  activeColor="primary"
  inactiveColor="textSecondary"
  showLabels={true}
  tabBarStyle={{
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  }}
/>
```

**Props**:

- `activeColor`: 활성 탭 색상
- `inactiveColor`: 비활성 탭 색상
- `showLabels`: 탭 라벨 표시 여부
- `tabBarStyle`: 탭바 스타일

### TabBarBackground

탭바 배경 컴포넌트입니다.

```typescript
import { TabBarBackground } from '@/components/ui';

<TabBarBackground
  style={{
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }}
/>;
```

## 🚀 라우팅 사용법

### 기본 네비게이션

```typescript
import { useRouter } from 'expo-router';

export default function MyComponent() {
  const router = useRouter();

  // 화면 이동
  const handleNavigate = () => {
    router.push('/races/race-123');
  };

  // 뒤로가기
  const handleGoBack = () => {
    router.back();
  };

  // 홈으로 이동
  const handleGoHome = () => {
    router.push('/');
  };

  // 탭 변경
  const handleTabChange = () => {
    router.push('/(app)/mypage');
  };

  return (
    <View>
      <Button title='경주 상세' onPress={handleNavigate} />
      <Button title='뒤로가기' onPress={handleGoBack} />
      <Button title='홈으로' onPress={handleGoHome} />
      <Button title='마이페이지' onPress={handleTabChange} />
    </View>
  );
}O
```

### 동적 라우팅

```typescript
// [raceId].tsx
import { useLocalSearchParams } from 'expo-router';

export default function RaceDetailScreen() {
  const { raceId } = useLocalSearchParams<{ raceId: string }>();

  useEffect(() => {
    if (raceId) {
      fetchRaceDetails(raceId);
    }
  }, [raceId]);

  return (
    <View>
      <Text>경주 ID: {raceId}</Text>
    </View>
  );
}
```

### 조건부 네비게이션

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

export default function ProtectedScreen() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      // 인증되지 않은 사용자는 로그인 화면으로
      router.replace('/(auth)/login');
    }
  }, [user]);

  if (!user) {
    return null; // 리다이렉트 중
  }

  return (
    <View>
      <Text>보호된 화면</Text>
    </View>
  );
}
```

## 📱 화면별 네비게이션

### 홈 화면 (`/`)

```typescript
// app/(app)/index.tsx
export default function HomeScreen() {
  const router = useRouter();

  const handleRacePress = (raceId: string) => {
    router.push(`/races/${raceId}`);
  };

  const handleBettingPress = () => {
    router.push('/(app)/betting/betting');
  };

  return (
    <ScrollView>
      <PageHeader title='Golden Race' subtitle='오늘의 경주' />

      {/* 빠른 베팅 */}
      <TouchableOpacity onPress={handleBettingPress}>
        <Text>빠른 베팅</Text>
      </TouchableOpacity>

      {/* 오늘의 경주 */}
      <RaceList onRacePress={handleRacePress} />
    </ScrollView>
  );
}
```

### 경주 화면 (`/races`)

```typescript
// app/(app)/races/races.tsx
export default function RacesScreen() {
  const router = useRouter();

  const handleRacePress = (raceId: string) => {
    router.push(`/races/${raceId}`);
  };

  const handleFilterPress = () => {
    // 필터 모달 표시
  };

  return (
    <View>
      <PageHeader
        title='경주 목록'
        subtitle='경주 정보를 확인하세요'
        rightComponent={
          <TouchableOpacity onPress={handleFilterPress}>
            <IconSymbol name='filter' size={24} />
          </TouchableOpacity>
        }
      />

      <RaceList onRacePress={handleRacePress} />
    </View>
  );
}
```

### 경주 상세 화면 (`/races/[raceId]`)

```typescript
// app/(app)/races/[raceId].tsx
export default function RaceDetailScreen() {
  const { raceId } = useLocalSearchParams<{ raceId: string }>();
  const router = useRouter();

  const handleBettingPress = () => {
    router.push(`/(app)/betting/betting?raceId=${raceId}`);
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View>
      <PageHeader
        title='경주 상세'
        subtitle='경주 정보'
        showBackButton={true}
        onBackPress={handleBackPress}
      />

      <RaceDetail raceId={raceId} />

      <Button title='베팅하기' onPress={handleBettingPress} />
    </View>
  );
}
```

### 베팅 화면 (`/betting`)

```typescript
// app/(app)/betting/betting.tsx
export default function BettingScreen() {
  const { raceId } = useLocalSearchParams<{ raceId: string }>();
  const router = useRouter();

  const handleConfirmPress = () => {
    router.push(
      `/(app)/betting/confirm?raceId=${raceId}&betData=${encodeURIComponent(
        JSON.stringify(betData)
      )}`
    );
  };

  return (
    <View>
      <PageHeader title='베팅 선택' subtitle='말과 베팅 유형을 선택하세요' showBackButton={true} />

      <BettingForm raceId={raceId} />

      <Button title='베팅 확인' onPress={handleConfirmPress} />
    </View>
  );
}
```

### 마이페이지 (`/mypage`)

```typescript
// app/(app)/mypage/_layout.tsx
export default function MyPageLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          title: '마이페이지',
          headerShown: false,
        }}
      />
      <Stack.Screen name='favorites' options={{ title: '즐겨찾기' }} />
      <Stack.Screen name='history' options={{ title: '베팅 히스토리' }} />
      <Stack.Screen name='notifications' options={{ title: '알림 설정' }} />
      <Stack.Screen name='settings' options={{ title: '설정' }} />
      <Stack.Screen name='help' options={{ title: '도움말' }} />
    </Stack>
  );
}
```

## 🔐 인증 네비게이션

### 로그인 화면 (`/(auth)/login`)

```typescript
// app/(auth)/login.tsx
export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
      // 로그인 성공 시 홈 화면으로
      router.replace('/(app)/');
    } catch (error) {
      console.error('로그인 실패:', error);
    }
  };

  return (
    <View>
      <PageHeader title='로그인' subtitle='Golden Race에 오신 것을 환영합니다' />

      <Button title='Google로 로그인' onPress={handleGoogleSignIn} />
    </View>
  );
}
```

### 인증 상태에 따른 리다이렉트

```typescript
// app/_layout.tsx
export default function RootLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // 인증되지 않은 사용자는 인증 화면으로
    return <Redirect href='/(auth)/login' />;
  }

  // 인증된 사용자는 메인 앱으로
  return <Redirect href='/(app)/' />;
}
```

## 🎨 네비게이션 스타일링

### 탭바 스타일

```typescript
// app/(app)/_layout.tsx
export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => <IconSymbol name='home' size={size} color={color} />,
        }}
      />
      {/* 다른 탭들... */}
    </Tabs>
  );
}
```

### 헤더 스타일

```typescript
// app/(app)/races/_layout.tsx
export default function RacesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name='races'
        options={{
          title: '경주 목록',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='[raceId]'
        options={{
          title: '경주 상세',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
```

## 🔄 네비게이션 상태 관리

### 현재 라우트 정보

```typescript
import { usePathname } from 'expo-router';

export default function NavigationAwareComponent() {
  const pathname = usePathname();

  // 현재 경로에 따른 조건부 렌더링
  const isHomeScreen = pathname === '/';
  const isRaceDetail = pathname.startsWith('/races/') && pathname !== '/races';
  const isBettingScreen = pathname.startsWith('/betting');

  return (
    <View>
      {isHomeScreen && <HomeSpecificComponent />}
      {isRaceDetail && <RaceDetailComponent />}
      {isBettingScreen && <BettingSpecificComponent />}
    </View>
  );
}
```

### 네비게이션 이벤트

```typescript
import { useFocusEffect } from '@react-navigation/native';

export default function ScreenWithFocusEffect() {
  useFocusEffect(
    useCallback(() => {
      // 화면이 포커스될 때 실행
      console.log('화면이 포커스되었습니다');

      return () => {
        // 화면이 포커스를 잃을 때 실행
        console.log('화면이 포커스를 잃었습니다');
      };
    }, [])
  );

  return <View />;
}
```

## 🧪 네비게이션 테스트

### 라우팅 테스트

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

// useRouter 모킹
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

describe('Navigation', () => {
  it('navigates to race detail when race card is pressed', () => {
    const mockRouter = {
      push: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    const { getByTestId } = render(<RaceCard race={mockRace} />);

    fireEvent.press(getByTestId('race-card'));

    expect(mockRouter.push).toHaveBeenCalledWith('/races/race-123');
  });
});
```

## 📚 관련 문서

- [UI 컴포넌트](./UI_COMPONENTS.md) - UI 컴포넌트 가이드
- [상태 관리](./STATE_MANAGEMENT.md) - 상태 관리 전략
- [테마 시스템](./Theming.md) - 테마 및 스타일링
- [API 연동](./API_INTEGRATION.md) - 서버 API 사용법

---

> 🧭 **직관적이고 일관된 네비게이션으로 사용자 경험을 향상시키는 것이 목표입니다.**

---

**마지막 업데이트**: 2025년 10월 10일
