import type { Metadata } from 'next';
import { LegacyBody } from '@/components/LegacyBody';
import { SequentialScripts } from '@/components/SequentialScripts';
import { readLegacyDocument } from '@/lib/legacy-document';

export const metadata: Metadata = {
  title: 'Mesa Tática',
  description: 'Editor de estratégias, formações e jogadas de futsal do Baba Psyzon.',
};

export default function TacticalBoardPage() {
  const legacy = readLegacyDocument('mesa-tatica.html');
  return (
    <>
      <LegacyBody className={legacy.bodyClass} />
      <div className="legacy-content" dangerouslySetInnerHTML={{ __html: legacy.body }} />
      <SequentialScripts scripts={legacy.scripts} />
    </>
  );
}
