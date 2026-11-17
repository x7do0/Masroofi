export type Theme = 'light' | 'dark';
export const THEME_KEY = 'masroofi-theme';

export function resolveTheme(saved: string | null, prefersDark: boolean): Theme {
  return saved === 'light' || saved === 'dark' ? saved : prefersDark ? 'dark' : 'light';
}

export function readThemePreference(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch { return null; }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function initializeTheme(): void {
  applyTheme(resolveTheme(readThemePreference(), window.matchMedia('(prefers-color-scheme: dark)').matches));
}
