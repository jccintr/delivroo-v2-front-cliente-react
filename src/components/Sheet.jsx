import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';

/** Diálogo: "bottom sheet" no celular, janela centralizada no desktop. */
export default function Sheet({ open, onClose, title, children, footer, size = 'md', label }) {
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label ?? title}
        className={`relative flex max-h-[92dvh] w-full animate-sheet-in flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none sm:max-h-[88dvh] sm:rounded-3xl ${width}`}
      >
        {title !== undefined && (
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Fechar" className="grid size-9 place-items-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200">
              <Icon name="x" className="size-5" />
            </button>
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <footer className="border-t border-line bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
