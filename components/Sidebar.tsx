import Image from 'next/image';
import Link from 'next/link';
import {
  ChartNoAxesColumnIncreasing,
  History,
  LayoutDashboard,
  LogOut,
  Palette,
  RefreshCw,
  ShieldCheck,
  Table2,
  Target,
  Users,
} from 'lucide-react';

const primaryItems = [
  { tab: 'dashboard', label: 'Ao vivo', icon: LayoutDashboard },
  { tab: 'table', label: 'Tabela', icon: Table2 },
  { tab: 'ranking', label: 'Ranking', icon: ChartNoAxesColumnIncreasing },
  { tab: 'history', label: 'Histórico', icon: History },
  { tab: 'teams', label: 'Times', icon: Users },
  { tab: 'goals', label: 'Metas', icon: Target },
] as const;

export function Sidebar() {
  return (
    <aside className="app-sidebar baba-tabs" aria-label="Navegação principal">
      <div className="app-sidebar__brand">
        <Image src="/img/baba-psyzon-logo.png" alt="Baba Psyzon" width={40} height={40} priority />
        <span><strong>Baba Psyzon</strong><small>Gestão esportiva</small></span>
      </div>

      <nav className="app-sidebar__nav" aria-label="Áreas do Baba">
        <span className="app-sidebar__label">Principal</span>
        {primaryItems.map(({ tab, label, icon: Icon }, index) => (
          <button className={index === 0 ? 'active' : undefined} type="button" data-tab={tab} key={tab}>
            <Icon aria-hidden="true" size={18} strokeWidth={1.9} />
            <span>{label}</span>
          </button>
        ))}
        <span className="app-sidebar__label">Administração</span>
        <button className="organizer-only" type="button" data-tab="organizer">
          <ShieldCheck aria-hidden="true" size={18} strokeWidth={1.9} />
          <span>Organizador</span>
        </button>
        <Link href="/aparencia">
          <Palette aria-hidden="true" size={18} strokeWidth={1.9} />
          <span>Aparência</span>
        </Link>
      </nav>

      <div className="app-sidebar__profile">
        <span className="app-sidebar__avatar" aria-hidden="true">BP</span>
        <span><strong>Conta do Baba</strong><small id="sidebar-account-status">Acesso seguro</small></span>
        <button id="mode-reset-btn" type="button" data-action="reset-mode" aria-label="Trocar acesso" title="Trocar acesso">
          <RefreshCw aria-hidden="true" size={17} />
        </button>
        <button id="baba-logout-btn" className="app-sidebar__logout" type="button" data-action="logout" aria-label="Sair" title="Sair">
          <LogOut aria-hidden="true" size={17} />
        </button>
      </div>
    </aside>
  );
}
