/**
 * GOLDEN RACE 통일 테마 — 금색 & 검정색
 * Tailwind CSS 변수와 일치시키기 위한 참조용 상수
 */
export const theme = {
  colors: {
    // 메인: 금색/검정
    gold: {
      50: '#fff9e6',
      100: '#ffecb3',
      200: '#ffdf80',
      300: '#ffd24d',
      400: '#ffc519',
      500: '#ffd700', // primary (메인 금색)
      600: '#e6c200',
      700: '#ccac00',
      800: '#b3860b', // primary-dark (다크 골드)
      900: '#996600',
    },
    black: {
      50: '#2a2a2a',
      100: '#1f1f1f',
      200: '#1a1a1a', // secondary
      300: '#141414',
      400: '#0f0f0f',
      500: '#0c0c0c', // background
      600: '#080808',
      700: '#050505',
      800: '#020202',
      900: '#000000',
    },
    // 시맨틱
    primary: '#ffd700',
    'primary-dark': '#b3860b',
    background: '#0c0c0c',
    foreground: '#ffffff',
    secondary: '#1a1a1a',
    card: '#1a1a1a',
    border: '#333333',
    'border-gold': 'rgba(255, 215, 0, 0.3)',
    'text-secondary': '#f0f0f2',
    'text-tertiary': '#e8e8ec',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  spacing: {
    nav: '4rem', // 64px mobile
    'nav-desktop': '4rem',
    content: '1rem',
    'content-md': '1.5rem',
  },
  radii: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
  },
} as const;

export type Theme = typeof theme;
