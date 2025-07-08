# 경마 예측 앱 개발 문서

## 1. 프로젝트 개요

본 프로젝트는 React Native (Expo)를 사용하여 경마 결과를 예측하는 모바일 애플리케이션을 개발하는 것을 목표로 합니다. 사용자에게 다가오는 경주 정보를 제공하고, AI 기반의 예측 데이터를 시각적으로 보여줌으로써 보다 즐겁고 정보에 기반한 베팅 경험을 제공하고자 합니다.

**백엔드**: Supabase (PostgreSQL, 인증, 실시간 데이터베이스)

## 2. 주요 기능

-   **Google 소셜 로그인**: Supabase를 통한 Google 계정 기반의 사용자 인증.
-   **사용자 프로필 관리**: 사용자 이름 및 이메일 정보 조회 및 업데이트.
-   **경주 목록 조회**: Supabase DB에서 가져온 예정된 경주 리스트를 날짜와 장소별로 확인.
-   **경주 상세 정보**: 특정 경주에 출마하는 말, 기수, 부담중량, 게이트 등 상세 정보 제공.
-   **AI 예측 정보**: 각 경주에 대한 AI의 승리 확률 예측 데이터 제공 (현재는 목 데이터).
-   **경주 결과 확인**: 지난 경주의 결과 (순위, 배당률 등) 확인.
-   **관심 경주 등록**: 사용자가 관심 있는 경주를 저장하고 알림을 받을 수 있음 (향후 구현 예정).

## 3. 화면 구성 (UI)

앱의 네비게이션은 다음과 같은 탭으로 구성됩니다.

-   **`홈 (경주 목록)`**: 앱의 메인 화면으로, 오늘 및 예정된 경주 목록을 보여줍니다.
-   **`경주 결과`**: 과거 경주들의 결과를 확인할 수 있는 화면입니다.
-   **`내 정보`**: 사용자 프로필, 관심 경주 목록, 환경 설정 등을 관리하는 화면입니다.
    *   **`프로필 관리`**: 사용자 이름 및 이메일 정보 조회 및 업데이트.

## 4. 컴포넌트 구조

재사용성을 높이기 위해 다음과 같은 UI 컴포넌트를 설계하고 `components/` 디렉토리 내에 구현합니다.

-   `ThemedText.tsx`: 앱의 전반적인 텍스트 스타일을 관리하는 공통 텍스트 컴포넌트.
-   `RaceCard.tsx`: 경주 목록 화면에 사용될 각 경주 정보 카드.
-   `HorseInfo.tsx`: 경주 상세 화면에서 각 말의 정보를 보여주는 컴포넌트.
-   `PredictionChart.tsx`: AI 예측 데이터를 시각화하여 보여줄 차트 컴포넌트.
-   `ScreenLayout.tsx`: 화면의 전체적인 레이아웃을 담당하는 컴포넌트.
-   `CustomTabs.tsx`: 앱의 하단 탭 내비게이션을 위한 공통 컴포넌트.

## 5. 데이터 모델

앱에서 사용할 주요 데이터의 구조는 다음과 같습니다.

-   **Race (경주 정보)** - Supabase `races` 테이블

    ```typescript
    interface Race {
      id: string;
      raceNumber: number;
      raceName: string;
      date: string; // 'YYYY-MM-DD HH:mm'
      venue: string; // 경마장 (예: 서울, 부산경남)
      horses: Horse[]; // JSONB 타입으로 저장
    }
    ```

-   **Horse (말 정보)** - `Race` 인터페이스 내부에 포함

    ```typescript
    interface Horse {
      id: string;
      horseName: string;
      jockey: string; // 기수
      trainer: string; // 조교사
      gateNumber: number;
      predictionRate: number; // AI 예측 승률
    }
    ```

-   **Profile (사용자 프로필)** - Supabase `profiles` 테이블

    ```typescript
    interface Profile {
      id: string; // auth.users 테이블의 id와 연결
      email: string; // 사용자 이메일
      username: string; // 사용자 이름
      created_at: string;
    }
    ```

---