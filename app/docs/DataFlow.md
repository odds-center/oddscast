# 데이터 흐름 (Data Flow)

본 문서는 Golden Race 앱이 Supabase 백엔드와 어떻게 데이터를 주고받는지 설명합니다.

## 1. Supabase 클라이언트 초기화

앱은 `lib/supabase.ts` 파일을 통해 Supabase 클라이언트를 초기화합니다. 이 파일은 `.env` 파일에 정의된 환경 변수(`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)를 사용하여 Supabase 프로젝트에 연결합니다.

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 2. 인증 데이터 흐름

사용자 인증은 `context/AuthProvider.tsx`에 정의된 `AuthProvider`를 통해 전역적으로 관리됩니다. Supabase의 인증 기능을 직접 활용합니다.

*   **로그인 (`LoginScreen.tsx`)**:
    *   사용자가 Google 로그인을 시도하면 `@react-native-google-signin/google-signin` 라이브러리를 통해 Google ID 토큰을 얻습니다.
    *   획득한 `idToken`은 `AuthProvider`의 `signIn` 함수로 전달되며, 이 함수는 `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`을 호출하여 Supabase에 사용자를 인증합니다.
    *   인증 성공 시, Supabase는 세션 정보를 반환하고, `AuthProvider`는 이 세션 정보를 앱 전역에 제공합니다.

*   **로그아웃 (`MyPageScreen.tsx`)**:
    *   사용자가 로그아웃 버튼을 누르면 `AuthProvider`의 `signOut` 함수가 호출되며, 이는 `supabase.auth.signOut()`을 실행하여 현재 세션을 종료합니다.

*   **세션 관리 (`AuthProvider.tsx`)**:
    *   `AuthProvider`는 `supabase.auth.getSession()`을 통해 초기 세션을 가져오고, `supabase.auth.onAuthStateChange` 리스너를 사용하여 인증 상태 변화(로그인, 로그아웃, 세션 갱신 등)를 실시간으로 감지하여 앱의 세션 상태를 업데이트합니다.

## 3. 경주 데이터 흐름

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

## 4. 사용자 프로필 데이터 흐름

사용자 프로필 정보(사용자 이름, 이메일)는 Supabase 데이터베이스의 `profiles` 테이블에서 관리됩니다. 이 테이블은 `auth.users` 테이블과 1:1 관계를 가집니다.

*   **프로필 가져오기 (`MyPageScreen.tsx`, `ProfileScreen.tsx`)**:
    *   `MyPageScreen`과 `ProfileScreen`은 로그인된 사용자의 `session.user.id`를 사용하여 `supabase.from('profiles').select('username, email').eq('id', session.user.id).single()` 쿼리를 통해 해당 사용자의 프로필 정보를 가져옵니다.

*   **프로필 업데이트 (`ProfileScreen.tsx`)**:
    *   `ProfileScreen`에서 사용자가 사용자 이름을 변경하고 저장하면, `supabase.from('profiles').upsert(updates)` 쿼리를 사용하여 `profiles` 테이블의 해당 레코드를 업데이트합니다.
    *   `RLS (Row Level Security)` 정책에 따라 사용자는 자신의 프로필만 업데이트할 수 있습니다.

## 5. 데이터베이스 스키마 요약

*   **`races` 테이블**:
    *   `id` (uuid, PK)
    *   `raceNumber` (int8)
    *   `raceName` (text)
    *   `date` (timestampz)
    *   `venue` (text)
    *   `horses` (jsonb) - 말 정보 배열

*   **`profiles` 테이블**:
    *   `id` (uuid, PK, `auth.users` 참조)
    *   `email` (text, UNIQUE)
    *   `username` (text)
    *   `created_at` (timestampz)

이러한 데이터 흐름을 통해 앱은 Supabase와 효율적이고 안전하게 상호작용합니다.
