import React, { createContext, useContext, PropsWithChildren } from 'react';
import { useAppTheme } from '@/constants/theme';

interface AppThemeContextType {
  colors: ReturnType<typeof useAppTheme>['colors'];
  fonts: ReturnType<typeof useAppTheme>['fonts'];
  spacing: ReturnType<typeof useAppTheme>['spacing'];
  radii: ReturnType<typeof useAppTheme>['radii'];
  shadows: ReturnType<typeof useAppTheme>['shadows'];
  globalTextStyle: ReturnType<typeof useAppTheme>['globalTextStyle'];
  commonStyles: ReturnType<typeof useAppTheme>['commonStyles'];
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export const AppThemeProvider = ({ children }: PropsWithChildren<{}>) => {
  const theme = useAppTheme();

  // Ensure theme is always valid and force re-render on theme changes
  const validTheme = theme || {
    colors: {
      background: '#0C2A1E',
      primary: '#E5C99C',
      secondary: '#1E3A2F',
      accent: '#FF6B35',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      text: '#FFFFFF',
      textSecondary: '#9BA1A6',
      textTertiary: '#687076',
      card: '#1A1A1A',
      cardSecondary: '#2A2A2A',
      border: '#333333',
      borderLight: '#404040',
      overlay: 'rgba(0, 0, 0, 0.7)',
      gradient: {
        primary: ['#E5C99C', '#B48A3C'],
        secondary: ['#1E3A2F', '#2D5A3F'],
        card: ['#1A1A1A', '#2A2A2A'],
        background: ['#0C2A1E', '#1A1A1A'],
      },
    },
    fonts: {
      heading: 'System',
      body: 'System',
      bold: 'System',
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
    globalTextStyle: {
      includeFontPadding: false,
      textAlignVertical: 'center',
      allowFontScaling: false,
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

  return <AppThemeContext.Provider value={validTheme}>{children}</AppThemeContext.Provider>;
};

export const useAppThemeContext = () => {
  const context = useContext(AppThemeContext);

  // Always return a valid theme object, even if context is undefined
  if (!context) {
    console.warn(
      'useAppThemeContext must be used within an AppThemeProvider, returning fallback theme'
    );
    // Return a fallback theme instead of throwing
    return {
      colors: {
        background: '#0C2A1E',
        primary: '#E5C99C',
        secondary: '#1E3A2F',
        accent: '#FF6B35',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        text: '#FFFFFF',
        textSecondary: '#9BA1A6',
        textTertiary: '#687076',
        card: '#1A1A1A',
        cardSecondary: '#2A2A2A',
        border: '#333333',
        borderLight: '#404040',
        overlay: 'rgba(0, 0, 0, 0.7)',
        gradient: {
          primary: ['#E5C99C', '#B48A3C'],
          secondary: ['#1E3A2F', '#2D5A3F'],
          card: ['#1A1A1A', '#2A2A2A'],
          background: ['#0C2A1E', '#1A1A1A'],
        },
      },
      fonts: {
        heading: 'System',
        body: 'System',
        bold: 'System',
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
      globalTextStyle: {
        includeFontPadding: false,
        textAlignVertical: 'center',
        allowFontScaling: false,
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
  }
  return context;
};
