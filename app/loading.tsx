import { Activity, CalendarDays, Users } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { Panel } from '@/components/Panel';

export default function Loading() {
  return (
    <main className="app-loading" aria-busy="true" aria-label="Carregando Baba Psyzon">
      <Panel title="Preparando o Baba" description="Sincronizando a área de trabalho…">
        <div className="app-loading__metrics">
          <MetricCard icon={Users} label="Jogadores" value="—" detail="Carregando" />
          <MetricCard icon={Activity} label="Status" value="—" detail="Conectando" />
          <MetricCard icon={CalendarDays} label="Babas" value="—" detail="Carregando" />
        </div>
      </Panel>
    </main>
  );
}
