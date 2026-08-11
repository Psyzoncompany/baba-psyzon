'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import type { LegacyScript } from '@/lib/legacy-document';

type SequentialScriptsProps = Readonly<{
  scripts: readonly LegacyScript[];
}>;

export function SequentialScripts({ scripts }: SequentialScriptsProps) {
  const [loadedCount, setLoadedCount] = useState(0);
  const current = scripts[loadedCount];

  useEffect(() => {
    if (loadedCount !== scripts.length) return;
    window.ThemeProvider?.apply?.();
    window.BabaHtmlTools?.polishDom?.();
    window.lucide?.createIcons?.({ attrs: { 'aria-hidden': 'true', 'stroke-width': 1.8 } });
    window.dispatchEvent(new CustomEvent('next-legacy-ready'));
  }, [loadedCount, scripts.length]);

  if (!current) return null;

  const advance = () => setLoadedCount((count) => Math.min(count + 1, scripts.length));
  return current.src ? (
    <Script
      id={current.id}
      src={current.src}
      type={current.module ? 'module' : undefined}
      strategy="afterInteractive"
      onLoad={advance}
      onError={advance}
    />
  ) : (
    <Script id={current.id} strategy="afterInteractive" onReady={advance}>
      {current.code ?? ''}
    </Script>
  );
}

declare global {
  interface Window {
    ThemeProvider?: { apply?: () => void };
    BabaHtmlTools?: { polishDom?: (root?: Document | Element) => void };
    lucide?: { createIcons?: (options?: Record<string, unknown>) => void };
  }
}
