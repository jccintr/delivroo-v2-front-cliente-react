import Icon from './Icon.jsx';
import { formatBRL } from '../lib/money.js';

/** Barra fixa no rodapé do celular. */
export default function CartBar({ count, totalCents, onOpen }) {
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 lg:hidden" style={{ background: 'linear-gradient(to top, rgba(250,250,249,1) 55%, rgba(250,250,249,0))' }}>
      <button type="button" onClick={onOpen} className="mx-auto flex h-14 w-full max-w-lg items-center justify-between rounded-full bg-brand px-5 font-bold text-on-brand shadow-xl transition active:scale-[.98]">
        <span className="flex items-center gap-3">
          <span className="relative">
            <Icon name="bag" className="size-6" />
            <span className="absolute -right-2 -top-2 grid min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-extrabold text-brand">{count}</span>
          </span>
          Ver sacola
        </span>
        <span className="tabular-nums">{formatBRL(totalCents)}</span>
      </button>
    </div>
  );
}
