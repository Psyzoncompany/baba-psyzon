'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = Readonly<{
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  closeOnBackdrop?: boolean;
}>;

export function Modal({ open, title, children, footer, onClose, closeOnBackdrop = true }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="app-modal"
      aria-labelledby="app-modal-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (closeOnBackdrop && event.target === event.currentTarget) onClose(); }}
    >
      <div className="app-modal__panel">
        <header><h2 id="app-modal-title">{title}</h2><button type="button" onClick={onClose} aria-label="Fechar"><X aria-hidden="true" /></button></header>
        <div className="app-modal__content">{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </div>
    </dialog>
  );
}
