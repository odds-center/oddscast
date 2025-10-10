# 테마 시스템 (Theming System)

본 앱은 일관된 디자인과 손쉬운 테마 관리를 위해 자체적인 테마 시스템을 구축하고 있습니다. 모든 색상, 글꼴, 간격, 그림자 등의 디자인 토큰은 `constants/theme.ts` 파일에 정의되어 있으며, `useAppTheme` 훅을 통해 앱 전반에 적용됩니다.

## 1. `constants/theme.ts` 및 `useAppTheme` 훅

`constants/theme.ts` 파일은 앱의 모든 디자인 토큰을 포함하는 `Colors` 객체를 `light`와 `dark` 모드로 구분하여 정의합니다. 또한, `useAppTheme` 훅을 제공하여 현재 활성화된 색상 스키마(light/dark)에 따라 적절한 테마 속성들을 반환합니다.

```typescript
// constants/theme.ts
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { useColorScheme } from '@/hooks/useColorScheme';

export const useLoadFonts = () => {
  return useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });
};

const Colors = {
  light: {
    background: '#FFFFFF',
    primary: '#FFD700', // Gold
    secondary: '#E0E0E0', // Light Gray
    accent: '#FF6B35', // Orange
    success: '#4CAF50', // Green
    warning: '#FF9800', // Orange
    error: '#F44336', // Red
    text: '#11181C', // Dark Gray for text on light background
    textSecondary: '#666666',
    textTertiary: '#999999',
    card: '#F0F0F0',
    cardSecondary: '#E8E8E8',
    border: '#D0D0D0',
    borderLight: '#E0E0E0',
    overlay: 'rgba(255, 255, 255, 0.7)',
    gradient: {
      primary: ['#FFD700', '#FFA500'],
      secondary: ['#E0E0E0', '#D0D0D0'],
      card: ['#F0F0F0', '#E8E8E8'],
      background: ['#FFFFFF', '#F8F8F8'],
    },
  },
  dark: {
    background: '#0A0A0A',
    primary: '#FFD700', // Gold
    secondary: '#1E3A2F', // Dark Green
    accent: '#FF6B35', // Orange
    success: '#4CAF50', // Green
    warning: '#FF9800', // Orange
    error: '#F44336', // Red
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#808080',
    card: '#1A1A1A',
    cardSecondary: '#2A2A2A',
    border: '#333333',
    borderLight: '#404040',
    overlay: 'rgba(0, 0, 0, 0.7)',
    gradient: {
      primary: ['#FFD700', '#FFA500'],
      secondary: ['#1E3A2F', '#2D5A3F'],
      card: ['#1A1A1A', '#2A2A2A'],
      background: ['#0A0A0A', '#1A1A1A'],
    },
  },
};

export const theme = {
  globalTextStyle: {
    includeFontPadding: false,
    textAlignVertical: 'center',
    allowFontScaling: false,
  },
  fonts: {
    heading: 'PlayfairDisplay_700Bold',
    body: 'Lato_400Regular',
    bold: 'Lato_700Bold',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  radii: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    round: 50,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 8.84,
      elevation: 12,
    },
  },
  commonStyles: {
    container: {
      flex: 1,
      padding: 16,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spaceBetween: {
      justifyContent: 'space-between',
    },
    flex1: {
      flex: 1,
    },
  },
};

export const useAppTheme = () => {
  const colorScheme = useColorScheme();
  return {
    ...theme,
    colors: Colors[colorScheme ?? 'light'],
  };
};
```

- **`Colors` 객체**: 앱에서 사용되는 모든 색상을 `light`와 `dark` 모드로 구분하여 정의합니다. `primary`, `secondary`, `text`, `background` 등 의미론적인 이름으로 구성됩니다.
- **`theme` 객체**: `globalTextStyle`, `fonts`, `spacing`, `radii`, `shadows`, `commonStyles` 등 색상 외의 공통 테마 속성들을 정의합니다.
- **`useAppTheme` 훅**: `useColorScheme` 훅을 사용하여 현재 시스템의 색상 스키마(light/dark)를 감지하고, `Colors` 객체에서 해당 스키마에 맞는 색상 팔레트를 반환합니다. 이 훅을 통해 컴포넌트에서 현재 테마에 맞는 색상 및 기타 테마 속성에 접근할 수 있습니다.

## 2. `ThemedText.tsx`

`ThemedText.tsx`는 앱의 모든 텍스트를 렌더링하는 데 사용되는 핵심 컴포넌트입니다. 이 컴포넌트는 `useAppTheme` 훅을 통해 현재 테마의 `globalTextStyle`을 기본으로 적용하며, `type` prop을 통해 다양한 텍스트 스타일(예: `title`, `subtitle`, `caption`)을 쉽게 적용할 수 있도록 합니다.

```typescript
// components/ThemedText.tsx
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppTheme } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'defaultSemiBold' | 'link' | 'stat' | 'caption';
  // ... 기타 props
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { colors, fonts, globalTextStyle } = useAppTheme();
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  // type별 색상 직접 지정
  let textColor = color;
  if (type === 'link') {
    textColor = '#0a7ea4';
  }

  return (
    <Text
      style={[
        globalTextStyle as any, // 전역 스타일 적용
        { color: textColor, flexShrink: 1 },
        type === 'default' ? styles(fonts).default : undefined,
        type === 'title' ? styles(fonts).title : undefined,
        type === 'subtitle' ? styles(fonts).subtitle : undefined,
        type === 'defaultSemiBold' ? styles(fonts).defaultSemiBold : undefined,
        type === 'link' ? styles(fonts).link : undefined,
        type === 'stat' ? styles(fonts).stat : undefined,
        type === 'caption' ? styles(fonts).caption : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = (fonts: any) =>
  StyleSheet.create({
    default: {
      fontFamily: fonts.body,
      fontSize: 16,
      lineHeight: 24,
    },
    // ... 기타 타입별 스타일 정의
  });
```

- `useThemeColor` 훅을 사용하여 현재 테마에 맞는 색상을 동적으로 가져옵니다.
- `type` prop에 따라 `styles` 객체에 정의된 특정 스타일을 적용합니다. 각 타입별 스타일은 `fontFamily`, `fontSize`, `lineHeight` 등을 명시적으로 정의하여 일관성을 유지합니다.
- `flexShrink: 1` 속성은 텍스트가 컨테이너를 벗어나지 않도록 하여 텍스트 잘림 문제를 방지합니다.

## 3. `useThemeColor.ts`

이 훅은 현재 활성화된 색상 스키마(light/dark)에 따라 `constants/Colors.ts`에 정의된 색상 값을 반환합니다. 이를 통해 다크 모드와 라이트 모드를 쉽게 지원할 수 있습니다.

## 4. 테마 적용 예시

`useAppTheme` 훅을 사용하여 컴포넌트 내에서 현재 테마의 색상, 간격, 글꼴 등에 접근할 수 있습니다.

```typescript
import { useAppTheme } from '@/constants/theme';
import { ThemedText as Text } from '@/components/ThemedText';
import { StyleSheet, View } from 'react-native';

function MyComponent() {
  const { colors, spacing, commonStyles } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      ...commonStyles.flex1,
      backgroundColor: colors.background,
      padding: spacing.m,
    },
  });

  return (
    <View style={styles.container}>
      <Text type='title'>앱 제목</Text>
      <Text type='defaultSemiBold' style={{ color: colors.primary }}>
        강조 텍스트
      </Text>
      <Text type='caption'>작은 설명</Text>
    </View>
  );
}
```

이 테마 시스템을 통해 앱의 디자인을 효율적으로 관리하고, 향후 디자인 변경이나 다크 모드 지원 등을 쉽게 구현할 수 있습니다.

---

**마지막 업데이트**: 2025년 10월 10일
