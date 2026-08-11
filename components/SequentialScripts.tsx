'use client';

import { useEffect } from 'react';
import type { LegacyScript } from '@/lib/legacy-document';

type SequentialScriptsProps = Readonly<{
  scripts: readonly LegacyScript[];
}>;

export function SequentialScripts({ scripts }: SequentialScriptsProps) {
  useEffect(() => {
    const runKey = `${window.location.pathname}:${scripts.map((script) => script.id).join(',')}`;
    window.BabaLegacyScriptRuns ??= new Map<string, Promise<void>>();

    if (!window.BabaLegacyScriptRuns.has(runKey)) {
      const run = scripts.reduce<Promise<void>>(
        (sequence, script) => sequence.then(() => loadLegacyScript(script)),
        Promise.resolve(),
      ).then(() => {
        window.ThemeProvider?.apply?.();
        window.BabaHtmlTools?.polishDom?.();
        window.lucide?.createIcons?.({ attrs: { 'aria-hidden': 'true', 'stroke-width': 1.8 } });
        window.dispatchEvent(new CustomEvent('next-legacy-ready'));
      }).catch((error: unknown) => {
        console.error('[Baba Psyzon] Falha ao inicializar um módulo legado.', error);
        window.dispatchEvent(new CustomEvent('next-legacy-error', { detail: { error } }));
      });
      window.BabaLegacyScriptRuns.set(runKey, run);
    }
  }, [scripts]);

  return null;
}

function loadLegacyScript(script: LegacyScript): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(script.id) as HTMLScriptElement | null;
    if (existing?.dataset.legacyLoaded === 'true') {
      resolve();
      return;
    }

    const element = existing ?? document.createElement('script');
    element.id = script.id;
    element.dataset.legacyManaged = 'true';
    if (script.module) element.type = 'module';

    if (script.src) {
      element.async = false;
      element.onload = () => {
        element.dataset.legacyLoaded = 'true';
        resolve();
      };
      element.onerror = () => reject(new Error(`Falha ao carregar ${script.src}`));
      if (!existing) {
        element.src = script.src;
        document.body.appendChild(element);
      }
      return;
    }

    element.textContent = script.code ?? '';
    element.dataset.legacyLoaded = 'true';
    if (!existing) document.body.appendChild(element);
    resolve();
  });
}

declare global {
  interface Window {
    ThemeProvider?: { apply?: () => void };
    BabaHtmlTools?: { polishDom?: (root?: Document | Element) => void };
    lucide?: { createIcons?: (options?: Record<string, unknown>) => void };
    BabaLegacyScriptRuns?: Map<string, Promise<void>>;
  }
}
