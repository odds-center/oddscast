import { TextStyle, ViewStyle } from 'react-native';
import { GOLD_THEME } from './theme';

/**
 * 🎨 통일된 디자인 토큰
 *
 * 모든 컴포넌트에서 일관되게 사용할 수 있는 디자인 토큰입니다.
 * 하드코딩된 값 대신 이 토큰들을 사용하세요.
 */

// ==========================================
// 🎨 색상 토큰
// ==========================================

export const Colors = {
  // Primary (골드)
  primary: {
    main: GOLD_THEME.GOLD.LIGHT, // #FFD700
    medium: GOLD_THEME.GOLD.MEDIUM, // #DAA520
    dark: GOLD_THEME.GOLD.DARK, // #B8860B
    gray: GOLD_THEME.GOLD.GRAY, // #CD853F
  },

  // Background
  background: {
    primary: GOLD_THEME.BACKGROUND.PRIMARY, // #0C0C0C
    secondary: GOLD_THEME.BACKGROUND.SECONDARY, // #1A1A1A
    card: GOLD_THEME.BACKGROUND.CARD, // #1A1A1A
    overlay: GOLD_THEME.BACKGROUND.OVERLAY, // rgba(0, 0, 0, 0.7)
  },

  // Text
  text: {
    primary: GOLD_THEME.TEXT.PRIMARY, // #FFFFFF
    secondary: GOLD_THEME.TEXT.SECONDARY, // #FFD700
    tertiary: GOLD_THEME.TEXT.TERTIARY, // #9BA1A6
    disabled: GOLD_THEME.TEXT.DISABLED, // #687076
  },

  // Border
  border: {
    primary: GOLD_THEME.BORDER.PRIMARY, // #333333
    secondary: GOLD_THEME.BORDER.SECONDARY, // #404040
    gold: GOLD_THEME.BORDER.GOLD, // rgba(255, 215, 0, 0.3)
  },

  // Status
  status: {
    success: GOLD_THEME.STATUS.SUCCESS, // #FFD700
    warning: GOLD_THEME.STATUS.WARNING, // #DAA520
    error: GOLD_THEME.STATUS.ERROR, // #B8860B
    info: GOLD_THEME.STATUS.INFO, // #CD853F
  },
} as const;

// ==========================================
// 📏 간격 토큰
// ==========================================

export const Spacing = {
  // Base spacing (4px 기준)
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

// ==========================================
// 🔲 Border Radius
// ==========================================

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// ==========================================
// 📝 타이포그래피 토큰
// ==========================================

export const Typography: Record<string, TextStyle> = {
  // Headings
  h1: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  h2: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  h3: {
    fontFamily: 'Lato_700Bold',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  h4: {
    fontFamily: 'Lato_700Bold',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  // Body
  bodyLarge: {
    fontFamily: 'Lato_400Regular',
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text.primary,
  },
  body: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text.primary,
  },
  bodySmall: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.primary,
  },

  // Special
  caption: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text.tertiary,
  },
  label: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  button: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.text.primary,
  },
} as const;

// ==========================================
// 🎴 카드 스타일
// ==========================================

export const CardStyles: Record<string, ViewStyle> = {
  base: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.gold,
  },
  elevated: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border.gold,
  },
  compact: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
} as const;

// ==========================================
// 🔘 버튼 스타일
// ==========================================

export const ButtonStyles: Record<string, ViewStyle> = {
  primary: {
    backgroundColor: Colors.primary.dark,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border.gold,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    backgroundColor: Colors.primary.dark,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
} as const;

// ==========================================
// 📊 Shadow 토큰
// ==========================================

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  gold: {
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

// ==========================================
// 🎛️ 공통 레이아웃 스타일
// ==========================================

export const Layout = {
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  centered: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  spaceBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
} as const;
