import { Laptop, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

const order: ThemeMode[] = ['system', 'light', 'dark'];

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('masroofi-theme');
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  useEffect(() => {
    applyTheme(mode);
    localStorage.setItem('masroofi-theme', mode);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => mode === 'system' && applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const next = () => setMode(order[(order.indexOf(mode) + 1) % order.length]);
  const Icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Laptop;
  const label = mode === 'dark' ? 'داكن' : mode === 'light' ? 'فاتح' : 'النظام';

  return (
    <button type="button" className="theme-toggle" onClick={next} aria-label={`المظهر الحالي: ${label}. اضغط للتغيير`} title={`المظهر: ${label}`}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}
