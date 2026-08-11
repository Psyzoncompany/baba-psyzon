import type { ReactNode } from 'react';

type PanelProps = Readonly<{
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}>;

export function Panel({ title, description, children, className = '' }: PanelProps) {
  return (
    <section className={`app-panel ${className}`.trim()}>
      {title || description ? <header>{title ? <h2>{title}</h2> : null}{description ? <p>{description}</p> : null}</header> : null}
      {children}
    </section>
  );
}
