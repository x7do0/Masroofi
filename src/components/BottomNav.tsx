import { Home, List, TrendingDown, TrendingUp } from 'lucide-react';

export type AppPage = 'home' | 'expenses' | 'income' | 'history';

interface BottomNavProps {
  page: AppPage;
  onChange: (page: AppPage) => void;
}

const items = [
  { id: 'home' as const, label: 'الرئيسية', icon: Home },
  { id: 'expenses' as const, label: 'المصروفات', icon: TrendingDown },
  { id: 'income' as const, label: 'الدخل', icon: TrendingUp },
  { id: 'history' as const, label: 'السجل', icon: List },
];

export function BottomNav({ page, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="التنقل الرئيسي">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === page;
        return (
          <button
            key={item.id}
            type="button"
            className={`nav-item${active ? ' active' : ''}`}
            onClick={() => onChange(item.id)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
