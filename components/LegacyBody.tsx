'use client';

import { useEffect } from 'react';

type LegacyBodyProps = Readonly<{
  className: string;
}>;

const MANAGED_CLASSES = [
  'baba-page',
  'baba-app-mode',
  'tactical-page',
  'baba-appearance-page',
];

export function LegacyBody({ className }: LegacyBodyProps) {
  useEffect(() => {
    const nextClasses = className.split(/\s+/).filter(Boolean);
    document.body.classList.remove(...MANAGED_CLASSES);
    document.body.classList.add(...nextClasses);
    return () => document.body.classList.remove(...nextClasses);
  }, [className]);

  return null;
}
