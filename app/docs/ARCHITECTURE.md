# 아키텍처 (Architecture)

본 문서는 Golden Race 앱의 전체적인 아키텍처, 주요 모듈 간의 관계, 데이터 흐름 및 프로젝트 구조를 설명합니다.

## 1. 프로젝트 구조

프로젝트의 주요 폴더 구조는 다음과 같습니다.

-   **`/app`**: Expo Router를 위한 라우팅 설정 폴더입니다. 파일 기반으로 URL 및 내비게이션 스택이 결정됩니다.
    -   **`_layout.tsx`**: 최상위 레이아웃 및 내비게이션(Stack) 설정. `AuthProvider`를 통해 인증 상태에 따라 `(auth)` 또는 `(app)` 그룹으로 분기합니다.
    -   **`(app)`**: 로그인 후 접근 가능한 메인 앱 화면들을 위한 그룹 폴더.
        -   **`_layout.tsx`**: 메인 앱의 탭 내비게이션(`CustomTabs`) 설정.
        -   **`index.tsx`**: 앱의 기본 진입점 (현재는 `races` 탭으로 리디렉션).
        -   **`races.tsx`**: 경주 목록 화면.
        -   **`results.tsx`**: 경주 결과 화면.
        -   **`mypage/`**: 마이페이지 관련 화면들을 위한 그룹 폴더.
            -   **`_layout.tsx`**: 마이페이지 스택 내비게이션 설정.
            -   **`index.tsx`**: 마이페이지 메인 화면.
            -   **`profile.tsx`**: 사용자 프로필 관리 화면.
            -   `favorites.tsx`, `help.tsx`, `history.tsx`, `notifications.tsx`, `settings.tsx` 등 마이페이지 하위 화면들.
    -   **`(auth)`**: 인증 관련 화면들을 위한 그룹 폴더.
        -   **`_layout.tsx`**: 인증 스택 내비게이션 설정.
        -   **`login.tsx`**: 로그인 화면.

-   **`/components`**: 여러 화면에서 재사용되는 공통 UI 컴포넌트 폴더입니다.
    -   **`/common`**: 앱 전반에 걸쳐 사용되는 공통 컴포넌트 (예: `PageHeader.tsx`).
    -   **`/navigation`**: 내비게이션 관련 컴포넌트 (예: `CustomTabs.tsx`).
    -   **`/screens`**: 실제 UI 화면 컴포넌트들이 위치하는 폴더입니다. 기능별로 하위 폴더를 만들어 관리합니다.
        -   **`/auth`**: 로그인 화면 (`LoginScreen.tsx`).
        -   **`/mypage`**: 마이페이지 관련 화면 (`MyPageScreen.tsx`, `ProfileScreen.tsx`).
        -   **`/races`**: 경주 목록 관련 화면 (`RacesScreen.tsx`, `RaceCard.tsx`).
        -   **`/results`**: 경주 결과 관련 화면 (`ResultsScreen.tsx`).
    -   **`/ui`**: 일반 UI 요소 (예: `ThemedText.tsx`, `IconSymbol.tsx`, `Title.tsx`, `Subtitle.tsx`).

-   **`/constants`**: 색상, 글꼴, 더미 데이터, 테마 등 앱 전역에서 사용되는 상수 값들을 관리하는 폴더입니다.

-   **`/hooks`**: 커스텀 훅(Hook)들을 관리하는 폴더입니다.

-   **`/lib`**: Supabase 클라이언트 초기화 등 라이브러리 관련 설정 파일 (`supabase.ts`).

-   **`/context`**: 전역 상태 관리 컨텍스트 (예: `AuthProvider.tsx`).

-   **`/docs`**: 프로젝트 관련 문서들을 저장하는 폴더입니다.

## 2. 내비게이션 규칙

-   앱의 최상위 내비게이션은 `app/_layout.tsx`에 정의된 Stack Navigator가 관리합니다.
-   **인증 흐름**: `AuthProvider`를 통해 사용자 세션 상태를 확인하고, 로그인되지 않은 사용자에게는 `(auth)` 그룹의 로그인 화면을, 로그인된 사용자에게는 `(app)` 그룹의 메인 앱 화면을 보여줍니다.
-   로그인 후 진입하는 메인 화면은 `app/(app)/_layout.tsx`에 정의된 Tab Navigator (`CustomTabs`)가 관리합니다.
-   새로운 화면을 추가할 때는 먼저 `components/screens` 폴더에 UI 컴포넌트를 생성하고, 그 다음 `app` 폴더에 해당 컴포넌트를 렌더링하는 라우트 파일을 생성합니다.

## 3. UI 개발 규칙

-   화면의 전체적인 UI는 `components/screens` 폴더 내에서 개발합니다.
-   여러 곳에서 재사용될 가능성이 있는 부분은 `components/ui` 또는 `components/navigation`, `components/common` 폴더에 별도의 컴포넌트로 분리합니다.
-   `ThemedText`, `Title`, `Subtitle` 등 기존의 테마 컴포넌트를 적극 활용하여 디자인 일관성을 유지합니다.
-   공통적으로 사용되는 스타일 속성(예: `flex`, `justifyContent`, `alignItems`)은 `constants/theme.ts`의 `commonStyles`를 활용합니다.

## 4. 데이터 흐름 (Data Flow)

본 문서는 Golden Race 앱이 Supabase 백엔드와 어떻게 데이터를 주고받는지 설명합니다.

### 4.1. Supabase 클라이언트 초기화

앱은 `lib/supabase.ts` 파일을 통해 Supabase 클라이언트를 초기화합니다. 이 파일은 `.env` 파일에 정의된 환경 변수(`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)를 사용하여 Supabase 프로젝트에 연결합니다.

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4.2. 인증 데이터 흐름

사용자 인증은 `context/AuthProvider.tsx`에 정의된 `AuthProvider`를 통해 전역적으로 관리됩니다. Supabase의 인증 기능을 직접 활용합니다.

*   **로그인 (`LoginScreen.tsx`)**:
    *   사용자가 Google 로그인을 시도하면 `@react-native-google-signin/google-signin` 라이브러리를 통해 Google ID 토큰을 얻습니다.
    *   획득한 `idToken`은 `AuthProvider`의 `signIn` 함수로 전달되며, 이 함수는 `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`을 호출하여 Supabase에 사용자를 인증합니다.
    *   인증 성공 시, Supabase는 세션 정보를 반환하고, `AuthProvider`는 이 세션 정보를 앱 전역에 제공합니다.

*   **로그아웃 (`MyPageScreen.tsx`)**:
    *   사용자가 로그아웃 버튼을 누르면 `AuthProvider`의 `signOut` 함수가 호출되며, 이는 `supabase.auth.signOut()`을 실행하여 현재 세션을 종료합니다.

*   **세션 관리 (`AuthProvider.tsx`)**:
    *   `AuthProvider`는 `supabase.auth.getSession()`을 통해 초기 세션을 가져오고, `supabase.auth.onAuthStateChange` 리스너를 사용하여 인증 상태 변화(로그인, 로그아웃, 세션 갱신 등)를 실시간으로 감지하여 앱의 세션 상태를 업데이트합니다.

### 4.3. 경주 데이터 흐름

경주 데이터는 Supabase 데이터베이스의 `races` 테이블에서 관리됩니다.

*   **경주 목록 가져오기 (`RacesScreen.tsx`)**:
    *   `RacesScreen`은 `useEffect` 훅 내에서 `supabase.from('races').select('*')` 쿼리를 사용하여 모든 경주 데이터를 가져옵니다.
    *   선택된 경마장(`selectedVenue`)에 따라 `eq('venue', selectedVenue)` 필터를 적용하여 특정 경마장의 경주만 가져올 수 있습니다.
    *   데이터는 `date` 필드를 기준으로 정렬됩니다.

```typescript
// components/screens/races/RacesScreen.tsx
useEffect(() => {
  const fetchRaces = async () => {
    // ... 로딩 및 에러 처리 ...
    let query = supabase.from('races').select('*');
    if (selectedVenue !== 'all') {
      query = query.eq('venue', selectedVenue);
    }
    const { data, error } = await query.order('date', { ascending: true });
    // ... 데이터 설정 ...
  };
  fetchRaces();
}, [selectedVenue]);
```

### 4.4. 사용자 프로필 데이터 흐름

사용자 프로필 정보(사용자 이름, 이메일, 알림 설정 등)는 Supabase 데이터베이스의 `profiles` 테이블에서 관리됩니다. 이 테이블은 `auth.users` 테이블과 1:1 관계를 가집니다.

*   **프로필 가져오기 (`MyPageScreen.tsx`, `ProfileScreen.tsx`, `NotificationSettingsScreen.tsx`)**:
    *   `MyPageScreen`, `ProfileScreen`, `NotificationSettingsScreen`은 로그인된 사용자의 `session.user.id`를 사용하여 `supabase.from('profiles').select('username, email, notifications_enabled').eq('id', session.user.id).single()` 쿼리를 통해 해당 사용자의 프로필 정보를 가져옵니다.

*   **프로필 업데이트 (`ProfileScreen.tsx`, `NotificationSettingsScreen.tsx`)**:
    *   `ProfileScreen`에서 사용자가 사용자 이름을 변경하고 저장하면, `supabase.from('profiles').upsert(updates)` 쿼리를 사용하여 `profiles` 테이블의 해당 레코드를 업데이트합니다.
    *   `NotificationSettingsScreen`에서 알림 설정을 변경하면, `supabase.from('profiles').update({ notifications_enabled: newValue })` 쿼리를 사용하여 `profiles` 테이블의 해당 레코드를 업데이트합니다.
    *   `RLS (Row Level Security)` 정책에 따라 사용자는 자신의 프로필만 업데이트할 수 있습니다.
