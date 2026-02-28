/**
 * Accessibility preferences: high contrast, font size.
 * Persisted to localStorage; applied to document via data attributes.
 */
import { create } from 'zustand';

export type FontSizeLevel = 'small' | 'medium' | 'large';

const STORAGE_KEY = 'oddscast_accessibility';

interface StoredPrefs {
  highContrast?: boolean;
  fontSize?: FontSizeLevel;
}

function load(): StoredPrefs {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredPrefs;
    return {
      highContrast: Boolean(parsed.highContrast),
      fontSize: ['small', 'medium', 'large'].includes(parsed.fontSize ?? '')
        ? (parsed.fontSize as FontSizeLevel)
        : 'medium',
    };
  } catch {
    return {};
  }
}

function save(prefs: StoredPrefs): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

interface AccessibilityState {
  highContrast: boolean;
  fontSize: FontSizeLevel;
  setHighContrast: (on: boolean) => void;
  setFontSize: (level: FontSizeLevel) => void;
  hydrate: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
  highContrast: false,
  fontSize: 'medium',

  setHighContrast: (on) => {
    set({ highContrast: on });
    save({ ...load(), highContrast: on });
    applyToDocument({ ...get(), highContrast: on });
  },

  setFontSize: (level) => {
    set({ fontSize: level });
    save({ ...load(), fontSize: level });
    applyToDocument({ ...get(), fontSize: level });
  },

  hydrate: () => {
    const prefs = load();
    set({
      highContrast: prefs.highContrast ?? false,
      fontSize: (prefs.fontSize as FontSizeLevel) ?? 'medium',
    });
    applyToDocument({
      highContrast: prefs.highContrast ?? false,
      fontSize: (prefs.fontSize as FontSizeLevel) ?? 'medium',
    });
  },
}));

function applyToDocument(state: { highContrast: boolean; fontSize: FontSizeLevel }) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-high-contrast', state.highContrast ? 'true' : 'false');
  root.setAttribute('data-font-size', state.fontSize);
}
