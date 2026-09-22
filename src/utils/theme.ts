export type ThemeMode = 'dark' | 'light' | 'system';

const THEME_STORAGE_KEY = 'scamshield_theme_preference';

/**
 * Gets the current stored theme mode, or 'system' by default.
 */
export function getSavedTheme(): ThemeMode {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'system';
  }
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark' || saved === 'light' || saved === 'system') {
    return saved;
  }
  return 'system';
}

/**
 * Resolves whether the current mode resolves to dark mode in the browser.
 */
export function isDarkActive(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true; // Default fallback to dark cyber theme
}

/**
 * Applies the theme to the document HTML element and saves to localStorage.
 */
export function applyTheme(mode: ThemeMode): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (e) {
    console.warn('Unable to persist theme to localStorage:', e);
  }

  const dark = isDarkActive(mode);
  const root = document.documentElement;

  if (dark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  return dark;
}

/**
 * Sets up a listener for OS color scheme preference changes when in 'system' mode.
 */
export function setupSystemThemeListener(onThemeChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (getSavedTheme() === 'system') {
      applyTheme('system');
      onThemeChange();
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  } else if (mediaQuery.addListener) {
    // Legacy support
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }

  return () => {};
}
