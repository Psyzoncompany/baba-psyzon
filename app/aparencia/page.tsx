import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Palette, RotateCcw, Shield } from 'lucide-react';
import { LegacyBody } from '@/components/LegacyBody';
import { SequentialScripts } from '@/components/SequentialScripts';
import { readLegacyDocument } from '@/lib/legacy-document';

export const metadata: Metadata = {
  title: 'Aparência',
  description: 'Preferências visuais e identidade dos times do Baba Psyzon.',
};

const segmentedSettings = [
  { name: 'mode', label: 'Modo', values: [['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Escuro']] },
  { name: 'density', label: 'Densidade', values: [['compact', 'Compacta'], ['normal', 'Normal'], ['comfortable', 'Confortável']] },
  { name: 'radius', label: 'Raio dos componentes', values: [['small', 'Pequeno'], ['medium', 'Médio'], ['large', 'Grande']] },
  { name: 'motion', label: 'Animações', values: [['full', 'Ativadas'], ['reduced', 'Reduzidas']] },
] as const;

export default function AppearancePage() {
  const legacy = readLegacyDocument('baba-aparencia.html');
  return (
    <>
      <LegacyBody className={legacy.bodyClass} />
      <header className="appearance-topbar">
        <div className="appearance-topbar__inner">
          <Link className="appearance-back" href="/" aria-label="Voltar ao Baba"><ArrowLeft aria-hidden="true" /><span>Voltar</span></Link>
          <Link className="appearance-brand" href="/">
            <Image src="/icons/baba-icon-192.png" alt="Baba Psyzon" width={40} height={40} priority />
            <span><strong>Baba Psyzon</strong><small>Configurações</small></span>
          </Link>
          <span className="appearance-mode" data-theme-current>Claro</span>
        </div>
      </header>

      <main className="appearance-shell">
        <header className="appearance-heading"><span>Preferências</span><h1>Aparência</h1></header>
        <section className="appearance-panel theme-settings-card" data-theme-settings aria-labelledby="appearance-title">
          <div className="theme-settings-heading">
            <span><Palette aria-hidden="true" /><h2 id="appearance-title">Interface</h2></span>
            <small className="theme-settings-current" data-theme-current>Claro</small>
          </div>
          <div className="theme-settings-grid">
            {segmentedSettings.map((setting) => (
              <div className="theme-setting" key={setting.name}>
                <span>{setting.label}</span>
                <div className="theme-segmented" style={{ '--segments': setting.values.length } as React.CSSProperties}>
                  {setting.values.map(([value, label]) => <label key={value}><input type="radio" name={setting.name} value={value} /><span>{label}</span></label>)}
                </div>
              </div>
            ))}
            <label className="theme-setting"><span>Idioma</span><select name="language" aria-label="Idioma da interface"><option value="pt-BR">Português (Brasil)</option></select></label>
          </div>
          <div className="theme-settings-actions">
            <button className="secondary" type="button" data-theme-reset><RotateCcw aria-hidden="true" /><span>Restaurar padrão</span></button>
          </div>
        </section>

        <section className="appearance-team-section" aria-labelledby="team-theme-title">
          <header className="appearance-team-section__heading">
            <span><Shield aria-hidden="true" /><span><strong id="team-theme-title">Identidade dos times</strong><small>Nomes, cores e escudos</small></span></span>
            <button className="secondary" type="button" data-team-reset-all>Restaurar todos</button>
          </header>
          <p className="team-theme-access-note" data-team-access-note hidden>Somente o organizador pode alterar nomes, cores e escudos dos times.</p>
          <div className="team-theme-grid" data-team-theme-grid />
          <p className="team-theme-status" data-team-theme-status role="status" aria-live="polite" />
        </section>
      </main>
      <SequentialScripts scripts={legacy.scripts} />
    </>
  );
}
