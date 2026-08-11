import Link from 'next/link';
import { ChartNoAxesColumnIncreasing, Ellipsis, LayoutDashboard, Palette, Table2, Users } from 'lucide-react';

export function MobileNavigation() {
  return (
    <nav className="app-mobile-navigation" aria-label="Navegação móvel">
      <button className="active" type="button" data-tab="dashboard"><LayoutDashboard aria-hidden="true" /><span>Ao vivo</span></button>
      <button type="button" data-tab="table"><Table2 aria-hidden="true" /><span>Tabela</span></button>
      <button className="app-mobile-navigation__primary" type="button" data-tab="teams"><Users aria-hidden="true" /><span>Times</span></button>
      <button type="button" data-tab="ranking"><ChartNoAxesColumnIncreasing aria-hidden="true" /><span>Ranking</span></button>
      <div className="baba-more-nav">
        <button id="baba-more-toggle" type="button" aria-haspopup="true" aria-controls="baba-more-menu" aria-expanded="false">
          <Ellipsis aria-hidden="true" /><span>Mais</span>
        </button>
        <div id="baba-more-menu" className="baba-more-menu hidden" role="menu">
          <button type="button" data-tab="history" role="menuitem">Histórico</button>
          <button type="button" data-tab="goals" role="menuitem">Metas</button>
          <button className="organizer-only" type="button" data-tab="organizer" role="menuitem">Organizador</button>
          <Link href="/aparencia" role="menuitem"><Palette aria-hidden="true" size={16} /> Aparência</Link>
          <button type="button" data-action="reset-mode" role="menuitem">Trocar acesso</button>
          <button type="button" data-action="logout" role="menuitem">Sair</button>
        </div>
      </div>
    </nav>
  );
}
