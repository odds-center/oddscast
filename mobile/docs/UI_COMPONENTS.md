# Golden Race - UI 컴포넌트 가이드

## 🎨 개요

Golden Race 모바일 앱에서 사용되는 모든 UI 컴포넌트의 사용법과 가이드라인을 제공합니다. 일관된 디자
인 시스템을 유지하여 사용자 경험을 향상시키는 것이 목표입니다.

## 🏗️ 컴포넌트 구조

```
components/
├── common/                    # 공통 컴포넌트
│   ├── PageHeader.tsx        # 페이지 헤더
│   ├── ThemedText.tsx        # 테마 적용 텍스트
│   ├── ThemedView.tsx        # 테마 적용 뷰
│   └── index.ts              # 공통 컴포넌트 내보내기
├── ui/                       # 기본 UI 컴포넌트
│   ├── IconSymbol.tsx        # 아이콘 심볼
│   ├── Subtitle.tsx          # 부제목
│   ├── Title.tsx             # 제목
│   └── index.ts              # UI 컴포넌트 내보내기
├── screens/                   # 화면별 컴포넌트
│   ├── auth/                 # 인증 관련
│   ├── mypage/               # 마이페이지
│   ├── races/                # 경주 관련
│   └── results/              # 결과 관련
└── navigation/                # 네비게이션 컴포넌트
    └── CustomTabs.tsx        # 커스텀 탭바
```

## 🔧 공통 컴포넌트

### PageHeader

페이지 상단에 표시되는 헤더 컴포넌트입니다.

```typescript
import { PageHeader } from '@/components/common/PageHeader';

// 기본 사용법
<PageHeader
  title="경주 목록"
  subtitle="오늘의 경주를 확인하세요"
/>

// 뒤로가기 버튼 포함
<PageHeader
  title="경주 상세"
  subtitle="경주 정보"
  showBackButton={true}
  onBackPress={() => router.back()}
/>

// 액션 버튼 포함
<PageHeader
  title="마이페이지"
  subtitle="내 정보 관리"
  rightComponent={
    <TouchableOpacity onPress={handleEdit}>
      <Text>편집</Text>
    </TouchableOpacity>
  }
/>
```

**Props**:

- `title`: 헤더 제목 (필수)
- `subtitle`: 부제목 (선택)
- `showBackButton`: 뒤로가기 버튼 표시 여부
- `onBackPress`: 뒤로가기 버튼 클릭 핸들러
- `rightComponent`: 우측에 표시할 컴포넌트

### ThemedText

테마가 적용된 텍스트 컴포넌트입니다.

```typescript
import { ThemedText } from '@/components/common';

// 기본 사용법
<ThemedText>일반 텍스트</ThemedText>

// 스타일 적용
<ThemedText
  variant="heading"
  color="primary"
>
  제목 텍스트
</ThemedText>

// 커스텀 스타일
<ThemedText
  style={{
    fontSize: 18,
    fontWeight: '600'
  }}
>
  커스텀 스타일
</ThemedText>
```

**Variants**:

- `body`: 기본 텍스트
- `heading`: 제목 텍스트
- `caption`: 작은 텍스트
- `button`: 버튼 텍스트

**Colors**:

- `primary`: 주요 색상
- `secondary`: 보조 색상
- `success`: 성공 색상
- `warning`: 경고 색상
- `error`: 오류 색상

### ThemedView

테마가 적용된 뷰 컴포넌트입니다.

```typescript
import { ThemedView } from '@/components/common';

// 기본 사용법
<ThemedView>
  <Text>내용</Text>
</ThemedView>

// 배경색 적용
<ThemedView
  variant="card"
  backgroundColor="surface"
>
  <Text>카드 내용</Text>
</ThemedView>

// 테두리 및 그림자
<ThemedView
  variant="elevated"
  borderColor="border"
>
  <Text>강조된 내용</Text>
</ThemedView>
```

**Variants**:

- `container`: 기본 컨테이너
- `card`: 카드 형태
- `elevated`: 그림자 효과
- `outlined`: 테두리만 있는 형태

## 🎯 화면별 컴포넌트

### 경주 관련 컴포넌트

#### RaceCard

경주 정보를 카드 형태로 표시하는 컴포넌트입니다.

```typescript
import { RaceCard } from '@/components/races';

<RaceCard
  race={{
    id: 'race-1',
    meetCode: '1',
    raceDate: '2024-03-15',
    raceNumber: 1,
    raceName: '3세 이상 일반',
    distance: 1200,
    grade: 'G3',
    prize: 50000000,
    status: 'UPCOMING',
  }}
  onPress={() => router.push(`/races/${race.id}`)}
/>;
```

**Props**:

- `race`: 경주 정보 객체
- `onPress`: 카드 클릭 핸들러
- `showOdds`: 배당률 표시 여부
- `compact`: 컴팩트 모드

#### RaceDetail

경주 상세 정보를 표시하는 컴포넌트입니다.

```typescript
import { RaceDetail } from '@/components/races';

<RaceDetail race={raceData} horses={horsesData} odds={oddsData} onBetPress={handleBetPress} />;
```

**Props**:

- `race`: 경주 정보
- `horses`: 출마 말 정보 배열
- `odds`: 배당률 정보
- `onBetPress`: 베팅 버튼 클릭 핸들러

### 마이페이지 컴포넌트

#### ProfileCard

사용자 프로필 정보를 표시하는 컴포넌트입니다.

```typescript
import { ProfileCard } from '@/components/mypage';

<ProfileCard user={userData} onEditPress={handleEditProfile} onSettingsPress={handleSettings} />;
```

**Props**:

- `user`: 사용자 정보
- `onEditPress`: 편집 버튼 클릭 핸들러
- `onSettingsPress`: 설정 버튼 클릭 핸들러

#### NotificationSettings

알림 설정을 관리하는 컴포넌트입니다.

```typescript
import { NotificationSettings } from '@/components/mypage';

<NotificationSettings
  settings={notificationSettings}
  onSettingChange={handleSettingChange}
  onSave={handleSaveSettings}
/>;
```

**Props**:

- `settings`: 알림 설정 객체
- `onSettingChange`: 설정 변경 핸들러
- `onSave`: 설정 저장 핸들러

## 🎨 UI 컴포넌트

### IconSymbol

앱에서 사용되는 아이콘 심볼 컴포넌트입니다.

```typescript
import { IconSymbol } from '@/components/ui';

// 기본 사용법
<IconSymbol name="home" size={24} />

// 색상 적용
<IconSymbol
  name="star"
  size={20}
  color="primary"
/>

// 커스텀 스타일
<IconSymbol
  name="heart"
  size={28}
  style={{ marginRight: 8 }}
/>
```

**Available Icons**:

- `home`: 홈
- `races`: 경주
- `betting`: 베팅
- `results`: 결과
- `mypage`: 마이페이지
- `star`: 즐겨찾기
- `heart`: 좋아요
- `settings`: 설정
- `notification`: 알림

### Title & Subtitle

제목과 부제목을 표시하는 컴포넌트입니다.

```typescript
import { Title, Subtitle } from '@/components/ui';

<Title>메인 제목</Title>
<Subtitle>부제목 설명</Subtitle>

// 스타일 커스터마이징
<Title
  variant="large"
  color="primary"
>
  큰 제목
</Title>

<Subtitle
  variant="medium"
  color="secondary"
>
  중간 부제목
</Subtitle>
```

## 🎭 애니메이션 컴포넌트

### AnimatedCard

애니메이션이 적용된 카드 컴포넌트입니다.

```typescript
import { AnimatedCard } from '@/components/common';

<AnimatedCard delay={100} duration={300} direction='up'>
  <Text>애니메이션 카드</Text>
</AnimatedCard>;
```

**Props**:

- `delay`: 애니메이션 시작 지연 시간
- `duration`: 애니메이션 지속 시간
- `direction`: 애니메이션 방향 (up, down, left, right)

### LoadingSpinner

로딩 상태를 표시하는 스피너 컴포넌트입니다.

```typescript
import { LoadingSpinner } from '@/components/common';

// 기본 사용법
<LoadingSpinner />

// 크기 조정
<LoadingSpinner size="large" />

// 색상 변경
<LoadingSpinner color="primary" />

// 텍스트 포함
<LoadingSpinner text="데이터를 불러오는 중..." />
```

## 📱 반응형 컴포넌트

### ResponsiveGrid

화면 크기에 따라 그리드 레이아웃을 조정하는 컴포넌트입니다.

```typescript
import { ResponsiveGrid } from '@/components/common';

<ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} spacing={16}>
  <RaceCard race={race1} />
  <RaceCard race={race2} />
  <RaceCard race={race3} />
</ResponsiveGrid>;
```

**Props**:

- `columns`: 화면별 컬럼 수 설정
- `spacing`: 아이템 간 간격
- `breakpoints`: 반응형 브레이크포인트

## 🎨 테마 시스템

### 색상 팔레트

```typescript
// colors.ts
export const colors = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    500: '#2196F3',
    900: '#0D47A1',
  },
  secondary: {
    50: '#FFF8E1',
    100: '#FFECB3',
    500: '#FFC107',
    900: '#F57F17',
  },
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  surface: '#FFFFFF',
  background: '#F5F5F5',
  text: '#212121',
  textSecondary: '#757575',
};
```

### 타이포그래피

```typescript
// typography.ts
export const typography = {
  heading: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
};
```

### 간격 시스템

```typescript
// spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

## 🔧 컴포넌트 개발 가이드라인

### 1. 컴포넌트 설계 원칙

- **단일 책임**: 하나의 컴포넌트는 하나의 책임만 가져야 함
- **재사용성**: 가능한 한 재사용 가능하도록 설계
- **확장성**: 향후 기능 추가를 고려한 설계
- **일관성**: 기존 컴포넌트와 일관된 인터페이스

### 2. Props 설계

```typescript
interface ComponentProps {
  // 필수 props
  requiredProp: string;

  // 선택적 props
  optionalProp?: number;

  // 기본값이 있는 props
  defaultProp?: boolean;

  // 이벤트 핸들러
  onPress?: () => void;

  // 스타일 관련
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'primary' | 'secondary';

  // 접근성
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
```

### 3. 상태 관리

```typescript
// 로컬 상태
const [isLoading, setIsLoading] = useState(false);

// 외부 상태 (Zustand)
const { user } = useAuthStore();

// 계산된 값
const displayName = useMemo(() => {
  return user?.displayName || '사용자';
}, [user?.displayName]);
```

### 4. 에러 처리

```typescript
// 에러 바운더리
const [hasError, setHasError] = useState(false);

if (hasError) {
  return <ErrorFallback onRetry={() => setHasError(false)} />;
}

// 에러 핸들링
try {
  // 컴포넌트 로직
} catch (error) {
  console.error('Component error:', error);
  setHasError(true);
}
```

## 🧪 테스트 가이드

### 컴포넌트 테스트

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { RaceCard } from '@/components/races';

describe('RaceCard', () => {
  it('renders race information correctly', () => {
    const race = { id: '1', raceName: 'Test Race' };
    const { getByText } = render(<RaceCard race={race} />);

    expect(getByText('Test Race')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const race = { id: '1', raceName: 'Test Race' };
    const { getByTestId } = render(<RaceCard race={race} onPress={onPress} />);

    fireEvent.press(getByTestId('race-card'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## 📚 관련 문서

- [테마 시스템](./Theming.md) - 테마 및 스타일링 가이드
- [네비게이션](./NAVIGATION.md) - 네비게이션 구조 및 컴포넌트
- [상태 관리](./STATE_MANAGEMENT.md) - 상태 관리 전략
- [API 연동](./API_INTEGRATION.md) - 서버 API 사용법

---

> 🎨 **일관된 디자인 시스템으로 사용자 경험을 향상시키는 것이 목표입니다.**
