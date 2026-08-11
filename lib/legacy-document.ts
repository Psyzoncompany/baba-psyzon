import 'server-only';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type LegacyScript = Readonly<{
  id: string;
  src?: string;
  code?: string;
  module?: boolean;
}>;

type LegacyDocument = Readonly<{
  body: string;
  bodyClass: string;
  scripts: readonly LegacyScript[];
}>;

const SCRIPT_PATTERN = /<script([^>]*)>([\s\S]*?)<\/script>/gi;

function absoluteAssetPaths(markup: string): string {
  return markup
    .replace(/\bsrc=(['"])(?!https?:|\/|data:)([^'"]+)\1/gi, 'src=$1/$2$1')
    .replace(/href=(['"])baba\.html\1/gi, 'href=$1/$1')
    .replace(/href=(['"])mesa-tatica\.html\1/gi, 'href=$1/mesa-tatica$1')
    .replace(/href=(['"])baba-aparencia\.html\1/gi, 'href=$1/aparencia$1');
}

export function readLegacyDocument(fileName: string, options: { removeMainHeader?: boolean } = {}): LegacyDocument {
  const source = readFileSync(join(process.cwd(), 'public', fileName), 'utf8');
  const bodyMatch = source.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) throw new Error(`Documento legado sem body: ${fileName}`);

  const bodyClass = bodyMatch[1].match(/class=(['"])(.*?)\1/i)?.[2] ?? '';
  const scripts: LegacyScript[] = [];
  let scriptIndex = 0;
  source.replace(SCRIPT_PATTERN, (_tag, rawAttributes: string, code: string) => {
    scriptIndex += 1;
    const src = rawAttributes.match(/\bsrc=(['"])(.*?)\1/i)?.[2];
    const explicitId = rawAttributes.match(/\bid=(['"])(.*?)\1/i)?.[2];
    scripts.push({
      id: explicitId || `${fileName.replace(/\W+/g, '-')}-script-${scriptIndex}`,
      ...(src ? { src: `/${src.replace(/^\//, '')}` } : { code }),
      module: /\btype=(['"])module\1/i.test(rawAttributes),
    });
    return '';
  });

  let body = bodyMatch[2].replace(SCRIPT_PATTERN, '');
  if (options.removeMainHeader) {
    body = body.replace(/<header class="baba-topbar[\s\S]*?<\/header>/i, '');
  }

  return { body: absoluteAssetPaths(body), bodyClass, scripts };
}
