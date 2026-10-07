import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

/** Barra fixa no topo: busca + abas das categorias (a aba acompanha a rolagem). */
export default function CategoryNav({ categories, active, onSelect, query, onQuery }) {
  const strip = useRef(null);

  useEffect(() => {
    const el = strip.current?.querySelector('[aria-current="true"]');
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [active]);

  return (
    <div className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 pt-3">
        <label className="relative block">
          <span className="sr-only">Buscar no cardápio</span>
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscar no cardápio"
            className="h-11 w-full rounded-full border border-line bg-stone-50 pl-11 pr-4 text-sm outline-none focus:border-brand focus:bg-white"
          />
        </label>
        {!query && (
          <nav ref={strip} aria-label="Categorias" className="no-scrollbar -mx-4 mt-1 flex gap-1 overflow-x-auto px-4">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-current={active === c.id}
                onClick={() => onSelect(c.id)}
                className={`shrink-0 border-b-[3px] px-3.5 py-3 text-sm font-bold transition ${active === c.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`}
              >
                {c.name}
              </button>
            ))}
          </nav>
        )}
        {query && <div className="h-3" />}
      </div>
    </div>
  );
}
