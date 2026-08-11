import { LegacyBody } from '@/components/LegacyBody';
import { MobileNavigation } from '@/components/MobileNavigation';
import { SequentialScripts } from '@/components/SequentialScripts';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { readLegacyDocument } from '@/lib/legacy-document';

export default function HomePage() {
  const legacy = readLegacyDocument('baba.html', { removeMainHeader: true });

  return (
    <>
      <LegacyBody className={legacy.bodyClass} />
      <Topbar />
      <Sidebar />
      <div className="legacy-content" dangerouslySetInnerHTML={{ __html: legacy.body }} />
      <MobileNavigation />
      <SequentialScripts scripts={legacy.scripts} />
    </>
  );
}
