# 변경 로그 (CHANGELOG)

이 문서는 Gemini CLI 에이전트와의 상호작용을 통해 `goldenrace` 프로젝트에 적용된 주요 변경 사항들을 요약합니다.

## 1. Supabase 데이터베이스 및 인증 관련 변경

### 1.1. `public.profiles` 테이블 생성 및 스키마 업데이트

`relation public.profiles does not exist` 오류 해결을 위해 `profiles` 테이블을 생성하고, 사용자 프로필 정보를 관리하도록 스키마를 확장했습니다.

- **테이블 생성 SQL:**

  ```sql
  CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE,
    username text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    notifications_enabled BOOLEAN DEFAULT TRUE
  );
  ```

- **`handle_new_user` 함수 및 `on_auth_user_created` 트리거 업데이트:**
  새로운 사용자가 Google 로그인을 통해 가입할 때 `auth.users` 테이블의 `id`, `email` 뿐만 아니라 `raw_user_meta_data`에서 `username`을 추출하여 `profiles` 테이블에 자동으로 저장하도록 트리거 로직을 수정했습니다.

  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, username)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name');
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

- **`updated_at` 컬럼 추가 및 자동 갱신 트리거:**
  프로필 정보가 업데이트될 때마다 `updated_at` 타임스탬프가 자동으로 갱신되도록 컬럼을 추가하고 트리거를 설정했습니다.

  ```sql
  -- 1. Add updated_at column
  ALTER TABLE public.profiles
  ADD COLUMN updated_at timestamp with time zone;

  -- 2. Set initial values for existing data (optional, if there's existing data)
  UPDATE public.profiles
  SET updated_at = created_at;

  -- 3. Function to update the updated_at timestamp automatically
  CREATE OR REPLACE FUNCTION public.handle_profile_update()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- 4. Trigger to run the function on profile update
  CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();
  ```

- **기존 사용자 프로필 데이터 마이그레이션:**
  트리거 설정 이전에 가입한 기존 사용자들의 `profiles` 데이터를 채우기 위한 SQL 쿼리를 제공했습니다.

  ```sql
  INSERT INTO public.profiles (id, email)
  SELECT id, email FROM auth.users
  ON CONFLICT (id) DO NOTHING;
  ```

- **JWT 만료 기간 설정 안내:**
  로그인 유지 기능을 위해 Supabase 대시보드에서 JWT 만료 기간을 30일(2,592,000초)로 설정하도록 안내했습니다. (Authentication -> Settings -> JWT expiry)

### 1.2. 알림 설정 기능 추가

사용자가 알림을 켜고 끌 수 있도록 `profiles` 테이블에 `notifications_enabled` 컬럼을 추가하고, `notifications.tsx` 파일에 해당 기능을 구현했습니다.

- **`profiles` 테이블에 `notifications_enabled` 컬럼 추가:**
  ```sql
  ALTER TABLE public.profiles
  ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE;
  ```
- **`app/app/(app)/mypage/notifications.tsx` 수정:**
  - `PageHeader` 컴포넌트 적용.
  - Supabase에서 `notifications_enabled` 설정을 불러오고 업데이트하는 로직 구현.
  - `raceAlert` 및 `resultAlert` 스위치 제거 (현재 DB 연동 컬럼 없음).

## 2. UI/UX 및 코드 구조 개선

### 2.1. 원치 않는 탭 제거 (`races/[raceId]`)

`races/raceId` 경로가 탭 메뉴에 표시되는 문제를 해결하기 위해 `app/components/navigation/CustomTabs.tsx` 파일에 `Tabs.Screen`의 `href: null` 옵션을 추가했습니다.

- **`app/components/navigation/CustomTabs.tsx` 수정:**
  ```typescript
  <Tabs.Screen name='races/[raceId]' options={{ href: null }} />
  ```

### 2.2. 마이페이지 기본 섹션 표시 문제 해결

마이페이지의 기본 화면(`index.tsx`)이 표시되지 않던 문제를 해결하기 위해 `app/app/(app)/mypage/_layout.tsx` 파일에 `index` 스크린을 추가했습니다.

- **`app/app/(app)/mypage/_layout.tsx` 수정:**
  ```typescript
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name='index' options={{ headerShown: false }} />
    <Stack.Screen name='profile' options={{ headerShown: false }} />
  </Stack>
  ```

### 2.3. 텍스트 색상 및 테마 일관성 개선

앱의 텍스트 색상 및 전반적인 UI 테마를 라이트/다크 모드에 맞춰 일관성 있게 변경했습니다.

- **`app/constants/Colors.ts` 수정:**
  라이트 모드에서 텍스트 가독성을 위해 `light.text` 색상을 어두운 색(`'#11181C'`)으로 되돌렸습니다. 다크 모드 `dark.text`는 흰색(`'#FFFFFF'`)으로 유지했습니다.

  ```typescript
  export const Colors = {
    light: {
      text: '#11181C', // Dark text on light background
      background: '#F5F5F5',
      // ... other light colors
    },
    dark: {
      text: '#FFFFFF', // White text on dark background
      background: '#0A0A0A',
      // ... other dark colors
    },
  };
  ```

- **`app/constants/theme.ts` 재구성:**
  `theme.colors` 객체를 `light`와 `dark` 모드를 구분하여 정의하고, `useAppTheme` 훅을 도입하여 현재 테마에 맞는 색상을 동적으로 가져오도록 변경했습니다.

  ```typescript
  // Inside theme.ts
  import { useColorScheme } from '@/hooks/useColorScheme';

  // ... (Colors object defined with light and dark modes)

  export const useAppTheme = () => {
    const colorScheme = useColorScheme();
    return {
      ...theme, // Base theme properties
      colors: Colors[colorScheme ?? 'light'], // Dynamic colors based on theme
    };
  };
  ```

- **`ThemedText.tsx` 수정:**
  `subtitle` 및 `caption` 타입의 텍스트 색상 오버라이드를 제거하여 기본 텍스트 색상(테마에 따라 어둡거나 흰색)을 따르도록 했습니다.

  ```typescript
  // Inside ThemedText.tsx
  // type별 색상 직접 지정
  let textColor = color;
  if (type === 'link') {
    textColor = '#0a7ea4'; // Link color remains specific
  }
  // Removed overrides for 'subtitle' and 'caption'
  ```

- **`useAppTheme` 적용:**
  `theme` 객체를 직접 참조하던 여러 컴포넌트(`favorites.tsx`, `help.tsx`, `history.tsx`, `notifications.tsx`, `profile.tsx`, `settings.tsx`, `[raceId].tsx`, `RaceCard.tsx`, `RacesScreen.tsx`, `ResultsScreen.tsx`, `ThemedText.tsx`, `CustomTabs.tsx`, `PageHeader.tsx`, `Subtitle.tsx`, `Title.tsx`)에서 `useAppTheme` 훅을 사용하여 동적으로 테마 색상에 접근하도록 변경했습니다.

### 2.4. 텍스트 잘림 문제 해결

하단 탭 바에 의해 텍스트가 잘리는 문제를 해결하기 위해 `app/components/ui/TabBarBackground.tsx` 파일의 `useBottomTabOverflow` 훅이 실제 탭 바 높이를 반환하도록 수정했습니다.

- **`app/components/ui/TabBarBackground.tsx` 수정:**

  ```typescript
  import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

  export function useBottomTabOverflow() {
    return useBottomTabBarHeight();
  }
  ```

### 2.5. 공통 `Title` 및 `Subtitle` 컴포넌트 생성 및 적용

반복되는 `ThemedText type='title'` 및 `type='subtitle'` 패턴을 재사용 가능한 `Title` 및 `Subtitle` 컴포넌트로 분리하고, 해당 컴포넌트들을 사용하는 모든 파일에 적용했습니다.

- **`app/components/ui/Title.tsx` 생성:**

  ```typescript
  // Example content
  import { ThemedText, ThemedTextProps } from '@/components/ThemedText';
  import { useAppTheme } from '@/constants/theme';
  import React from 'react';
  import { StyleProp, TextStyle } from 'react-native';

  export const Title = (props: ThemedTextProps) => {
    const { colors, spacing } = useAppTheme();
    return (
      <ThemedText
        type='title'
        style={
          [{ color: colors.text, marginBottom: spacing.xs }, props.style] as StyleProp<TextStyle>
        }
        {...props}
      />
    );
  };
  ```

- **`app/components/ui/Subtitle.tsx` 생성:**

  ```typescript
  // Example content
  import { ThemedText, ThemedTextProps } from '@/components/ThemedText';
  import { useAppTheme } from '@/constants/theme';
  import React from 'react';
  import { StyleProp, TextStyle } from 'react-native';

  export const Subtitle = (props: ThemedTextProps) => {
    const { colors } = useAppTheme();
    return (
      <ThemedText
        type='subtitle'
        style={[{ color: colors.textSecondary }, props.style] as StyleProp<TextStyle>}
        {...props}
      />
    );
  };
  ```

- **`app/components/ui/index.ts` 업데이트:**
  `Title` 및 `Subtitle` 컴포넌트를 내보내도록 추가했습니다.

### 2.6. 공통 `PageHeader` 컴포넌트 생성 및 적용

각 페이지의 상단 헤더 구조를 재사용 가능한 `PageHeader` 컴포넌트로 분리하고, 해당 컴포넌트들을 사용하는 모든 파일에 적용했습니다.

- **`app/components/common/PageHeader.tsx` 생성:**

  ```typescript
  // Example content
  import React from 'react';
  import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
  import { Ionicons } from '@expo/vector-icons';
  import { useAppTheme } from '@/constants/theme';
  import { Title, Subtitle } from '@/components/ui';

  interface PageHeaderProps {
    title: string;
    subtitle: string;
    showNotificationButton?: boolean;
    onNotificationPress?: () => void;
    notificationIconName?: keyof typeof Ionicons.glyphMap;
    notificationIconColor?: string;
  }

  export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    showNotificationButton = false,
    onNotificationPress,
    notificationIconName = 'notifications-outline',
    notificationIconColor,
  }) => {
    const { colors, spacing, shadows } = useAppTheme();
    const finalNotificationIconColor = notificationIconColor || colors.primary;

    const styles = StyleSheet.create({
      header: {
        paddingTop: 60,
        paddingHorizontal: spacing.l,
        paddingBottom: spacing.m,
      },
      headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.small,
      },
    });

    return (
      <View style={styles.header}>
        <StatusBar
          barStyle={colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
          backgroundColor='transparent'
          translucent
        />
        <View style={styles.headerContent}>
          <View>
            <Title style={styles.title}>{title}</Title>
            <Subtitle style={styles.subtitle}>{subtitle}</Subtitle>
          </View>
          {showNotificationButton && (
            <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
              <Ionicons name={notificationIconName} size={24} color={finalNotificationIconColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  ```

- **`app/components/common/index.ts` 업데이트:**
  `PageHeader` 컴포넌트를 내보내도록 추가했습니다.

### 2.7. 프로필 업데이트 `TextInput` 플레이스홀더 색상 변경

프로필 관리 화면의 `TextInput` 플레이스홀더 색상을 흰색으로 변경하여 가독성을 높였습니다.

- **`app/app/(app)/mypage/profile.tsx` 수정:**
  `placeholderTextColor`를 `theme.colors.text` (이제 `useAppTheme().colors.text`)로 변경했습니다.

---

**마지막 업데이트**: 2025년 10월 10일
