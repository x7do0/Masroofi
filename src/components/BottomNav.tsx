import { HandCoins, Home, List, TrendingDown, TrendingUp } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';

export type AppPage = 'home' | 'expenses' | 'income' | 'debts' | 'history';
interface BottomNavProps { page: AppPage; onChange: (page: AppPage) => void }
const items = [
  { id: 'home' as const, label: 'الرئيسية', icon: Home },
  { id: 'expenses' as const, label: 'المصروفات', icon: TrendingDown },
  { id: 'income' as const, label: 'الدخل', icon: TrendingUp },
  { id: 'debts' as const, label: 'الديون', icon: HandCoins },
  { id: 'history' as const, label: 'السجل', icon: List },
];

export function BottomNav({ page, onChange }: BottomNavProps) {
  const navRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const nav = navRef.current;
    const shell = nav?.closest<HTMLElement>('.app-shell');
    if (!nav || !shell) return;
    // Reserve the measured height, including text zoom, rather than assuming 64px.
    const measure = () => shell.style.setProperty('--nav-height', `${nav.getBoundingClientRect().height}px`);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(nav);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      shell.style.removeProperty('--nav-height');
    };
  }, []);
  return (
    <nav ref={navRef} className="bottom-nav" aria-label="التنقل الرئيسي">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === page;
        return (
          <button key={item.id} type="button" className={`nav-item${active ? ' active' : ''}`}
            onClick={() => onChange(item.id)} aria-current={active ? 'page' : undefined}>
            <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
