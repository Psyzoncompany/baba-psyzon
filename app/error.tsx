'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export default function ErrorPage({ reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <main className="app-feedback-page">
      <EmptyState icon={AlertTriangle} title="Não foi possível abrir esta área" description="Seus dados não foram alterados. Tente carregar novamente." action={<button className="app-primary-button" type="button" onClick={reset}><RotateCcw aria-hidden="true" /> Tentar novamente</button>} />
    </main>
  );
}
