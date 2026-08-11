import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export default function NotFound() {
  return (
    <main className="app-feedback-page">
      <EmptyState icon={FileQuestion} title="Página não encontrada" description="O endereço informado não existe no Baba Psyzon." action={<Link className="app-primary-button" href="/"><ArrowLeft aria-hidden="true" /> Voltar ao painel</Link>} />
    </main>
  );
}
