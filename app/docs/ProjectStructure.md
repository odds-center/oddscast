# 프로젝트 구조 및 규칙

## 1. 폴더 구조

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
    -   **`/navigation`**: 내비게이션 관련 컴포넌트 (예: `CustomTabs.tsx`).
    -   **`/screens`**: 실제 UI 화면 컴포넌트들이 위치하는 폴더입니다. 기능별로 하위 폴더를 만들어 관리합니다.
        -   **`/auth`**: 로그인 화면 (`LoginScreen.tsx`).
        -   **`/mypage`**: 마이페이지 관련 화면 (`MyPageScreen.tsx`, `ProfileScreen.tsx`).
        -   **`/races`**: 경주 목록 관련 화면 (`RacesScreen.tsx`, `RaceCard.tsx`).
        -   **`/results`**: 경주 결과 관련 화면 (`ResultsScreen.tsx`).
    -   **`/ui`**: 일반 UI 요소 (예: `ThemedText.tsx`, `IconSymbol.tsx`).

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
-   여러 곳에서 재사용될 가능성이 있는 부분은 `components/ui` 또는 `components/navigation` 폴더에 별도의 컴포넌트로 분리합니다.
-   `ThemedText` 등 기존의 테마 컴포넌트를 적극 활용하여 디자인 일관성을 유지합니다.
-   공통적으로 사용되는 스타일 속성(예: `flex`, `justifyContent`, `alignItems`)은 `constants/theme.ts`의 `commonStyles`를 활용합니다.