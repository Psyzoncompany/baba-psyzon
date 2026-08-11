'use client';

import { MoonStar, Search, Settings2 } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';

export function Topbar() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState('');

  function searchCurrentView(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchRef.current?.value.trim().toLocaleLowerCase('pt-BR') ?? '';
    if (!query) {
      setFeedback('Digite algo para buscar.');
      return;
    }
    const view = document.querySelector<HTMLElement>('.baba-view.active, .baba-gateway:not(.hidden)');
    const candidates = view?.querySelectorAll<HTMLElement>('h1, h2, h3, strong, [data-player-id], .baba-row, .baba-card');
    const match = Array.from(candidates ?? []).find((node) => node.innerText.toLocaleLowerCase('pt-BR').includes(query));
    if (!match) {
      setFeedback('Nenhum resultado nesta área.');
      return;
    }
    match.scrollIntoView({ behavior: 'smooth', block: 'center' });
    match.classList.add('app-search-match');
    window.setTimeout(() => match.classList.remove('app-search-match'), 1400);
    setFeedback('Resultado localizado.');
  }

  return (
    <header className="app-topbar baba-topbar" aria-label="Barra superior">
      <div className="app-topbar__context">
        <span className="app-topbar__mobile-mark">BP</span>
        <span><strong id="active-status-label">Nenhum baba aberto</strong><small id="active-baba-subtitle">Organize times, jogos e ranking em tempo real.</small></span>
      </div>

      <form className="app-topbar__search" role="search" onSubmit={searchCurrentView}>
        <Search aria-hidden="true" size={17} />
        <input ref={searchRef} type="search" placeholder="Buscar nesta área…" aria-label="Buscar na área atual" />
        <kbd>Enter</kbd>
        <span className="baba-visually-hidden" role="status" aria-live="polite">{feedback}</span>
      </form>

      <div className="app-topbar__actions">
        <div id="baba-sync-strip" className="app-sync-status baba-sync-strip" role="status" aria-live="polite">
          <i className="baba-sync-strip__dot" aria-hidden="true" />
          <span id="baba-sync-state">Sincronizando</span>
          <span id="baba-sync-message" className="baba-visually-hidden">Conectando dispositivos...</span>
        </div>
        <button className="app-icon-button organizer-only" type="button" data-header-tab="organizer" aria-label="Gerenciar baba" title="Gerenciar baba">
          <Settings2 aria-hidden="true" size={18} />
        </button>
        <button id="baba-theme-toggle" className="app-icon-button" type="button" aria-label="Alternar tema" title="Alternar tema" aria-pressed="false">
          <MoonStar aria-hidden="true" size={18} />
        </button>
      </div>
    </header>
  );
}
