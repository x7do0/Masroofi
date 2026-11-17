import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { applyTheme, readThemePreference, resolveTheme, THEME_KEY, type Theme } from '../utils/theme';

export function ThemeToggle() {
  const [preference, setPreference] = useState<Theme | null>(readThemePreference);
  const [prefersDark, setPrefersDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = resolveTheme(preference, prefersDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setPrefersDark(media.matches);
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null) setPreference(readThemePreference());
    };
    media.addEventListener('change', onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => { applyTheme(theme); }, [theme]);

  const next = () => {
    const value = theme === 'dark' ? 'light' : 'dark';
    setPreference(value);
    try { localStorage.setItem(THEME_KEY, value); } catch { /* The current session still switches. */ }
  };
  const Icon = theme === 'dark' ? Moon : Sun;
  const label = theme === 'dark' ? 'داكن' : 'فاتح';
  const nextLabel = theme === 'dark' ? 'فاتح' : 'داكن';

  return (
    <button type="button" className="theme-toggle" onClick={next} aria-label={`المظهر الحالي: ${label}. التبديل إلى ${nextLabel}`} title={`التبديل إلى ${nextLabel}`}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}
