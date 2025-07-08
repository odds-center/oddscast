# 테마 시스템 (Theming System)

본 앱은 일관된 디자인과 손쉬운 테마 관리를 위해 자체적인 테마 시스템을 구축하고 있습니다. 모든 색상, 글꼴, 간격, 그림자 등의 디자인 토큰은 `constants/theme.ts` 파일에 정의되어 있으며, `ThemedText`와 같은 공통 컴포넌트를 통해 앱 전반에 적용됩니다.

## 1. `constants/theme.ts`

이 파일은 앱의 모든 디자인 토큰을 포함하는 중앙 집중식 테마 객체 `theme`를 정의합니다. 또한, 전역적으로 적용될 텍스트 스타일(`globalTextStyle`)과 자주 사용되는 공통 스타일(`commonStyles`)도 포함합니다.

```typescript
// constants/theme.ts

export const theme = {
  colors: {
    background: '#0A0A0A',
    primary: '#FFD700', // Gold
    // ... 기타 색상 정의
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
    small: { /* ... */ },
    medium: { /* ... */ },
    large: { /* ... */ },
  },
  globalTextStyle: {
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
    allowFontScaling: false,
  },
  commonStyles: {
    container: { flex: 1, padding: 16 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    row: { flexDirection: 'row', alignItems: 'center' },
    spaceBetween: { justifyContent: 'space-between' },
    flex1: { flex: 1 },
  },
};
```

*   **`colors`**: 앱에서 사용되는 모든 색상을 정의합니다. `primary`, `secondary`, `text`, `background` 등 의미론적인 이름으로 구성됩니다.
*   **`fonts`**: 앱에서 사용되는 글꼴 패밀리를 정의합니다. `useLoadFonts` 훅을 통해 로드됩니다.
*   **`spacing`**: 일관된 간격(padding, margin)을 위해 사용되는 크기 단위를 정의합니다.
*   **`radii`**: 일관된 테두리 반경(borderRadius)을 위해 사용되는 크기 단위를 정의합니다.
*   **`shadows`**: 재사용 가능한 그림자 스타일을 정의합니다.
*   **`globalTextStyle`**: 모든 `ThemedText` 컴포넌트에 기본적으로 적용되는 텍스트 스타일입니다. 텍스트 잘림 문제 해결을 위해 `includeFontPadding: false`와 `textAlignVertical: 'center'`가 포함됩니다.
*   **`commonStyles`**: `StyleSheet.create` 내에서 자주 사용되는 공통 스타일 속성들을 정의합니다. 컴포넌트의 스타일 정의 시 스프레드 연산자(`...`)를 사용하여 쉽게 적용할 수 있습니다.

## 2. `ThemedText.tsx`

`ThemedText.tsx`는 앱의 모든 텍스트를 렌더링하는 데 사용되는 핵심 컴포넌트입니다. 이 컴포넌트는 `theme.ts`에 정의된 `globalTextStyle`을 기본으로 적용하며, `type` prop을 통해 다양한 텍스트 스타일(예: `title`, `subtitle`, `caption`)을 쉽게 적용할 수 있도록 합니다.

```typescript
// components/ThemedText.tsx
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { theme } from '@/constants/theme';

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
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const secondaryColor = useThemeColor({ light: lightColor, dark: darkColor }, 'textSecondary');

  const getTextColor = () => {
    switch (type) {
      case 'subtitle':
      case 'caption':
        return secondaryColor;
      case 'link':
        return '#0a7ea4';
      default:
        return color;
    }
  };

  return (
    <Text
      style={[
        theme.globalTextStyle as any, // 전역 스타일 적용
        { color: getTextColor(), flexShrink: 1 },
        type === 'default' ? styles.default : undefined,
        // ... 기타 타입별 스타일 적용
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  // ... 기타 타입별 스타일 정의
});
```

*   `useThemeColor` 훅을 사용하여 현재 테마에 맞는 색상을 동적으로 가져옵니다.
*   `type` prop에 따라 `styles` 객체에 정의된 특정 스타일을 적용합니다. 각 타입별 스타일은 `fontFamily`, `fontSize`, `lineHeight` 등을 명시적으로 정의하여 일관성을 유지합니다.
*   `flexShrink: 1` 속성은 텍스트가 컨테이너를 벗어나지 않도록 하여 텍스트 잘림 문제를 방지합니다.

## 3. `useThemeColor.ts`

이 훅은 현재 활성화된 색상 스키마(light/dark)에 따라 `theme.ts`에 정의된 색상 값을 반환합니다. 이를 통해 다크 모드와 라이트 모드를 쉽게 지원할 수 있습니다.

## 4. 테마 적용 예시

```typescript
import { theme } from '@/constants/theme';
import { ThemedText as Text } from '@/components/ThemedText';
import { StyleSheet, View } from 'react-native';

function MyComponent() {
  return (
    <View style={styles.container}>
      <Text type="title">앱 제목</Text>
      <Text type="defaultSemiBold" style={{ color: theme.colors.primary }}>강조 텍스트</Text>
      <Text type="caption">작은 설명</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...theme.commonStyles.flex1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.m,
  },
});
```

이 테마 시스템을 통해 앱의 디자인을 효율적으로 관리하고, 향후 디자인 변경이나 다크 모드 지원 등을 쉽게 구현할 수 있습니다.
