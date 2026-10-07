import { useEffect, useMemo, useRef, useState } from 'react';
import Sheet from './Sheet.jsx';
import Icon from './Icon.jsx';
import OptionGroup from './OptionGroup.jsx';
import QuantityStepper from './QuantityStepper.jsx';
import { formatBRL } from '../lib/money.js';
import { firstInvalidGroup, fromPrice, hasPriceRange, priceItem } from '../lib/pricing.js';

const SIZE_WORDS = /(broto|grande|m[eé]dia|pequen|meia|inteira|\d\s?(ml|l)\b)/i;

/** seleções iniciais: opções marcadas como padrão (respeitando o máximo do grupo) */
function defaultSelections(product) {
  const result = {};
  for (const group of product.optionGroups) {
    const defaults = group.options.filter((o) => o.isDefault).slice(0, group.maxSelect);
    if (defaults.length) result[group.id] = Object.fromEntries(defaults.map((o) => [o.id, 1]));
  }
  return result;
}

export const Thumb = ({ product, className = '' }) => (
  product.imageUrl
    ? <img src={product.imageUrl} alt={product.name} loading="lazy" className={`${className} object-cover`} />
    : <div className={`${className} grid place-items-center bg-gradient-to-br from-stone-100 to-stone-200 text-3xl font-extrabold text-stone-400`} aria-hidden="true">{product.name.trim().charAt(0).toUpperCase()}</div>
);

/**
 * Escolha de um produto: variação, grupos de opções, observação e quantidade.
 * `initial` (item do carrinho) liga o modo edição.
 */
export default function ProductSheet({ product, initial, canOrder, onClose, onConfirm }) {
  const [variantId, setVariantId] = useState(initial?.variantId ?? product.variants[0].id);
  const [selections, setSelections] = useState(initial?.selections ?? defaultSelections(product));
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState(null); // { groupId, message }
  const refs = useRef({});

  useEffect(() => setError(null), [selections, variantId]);

  const priced = useMemo(() => priceItem({ product, variantId, selections, quantity }), [product, variantId, selections, quantity]);
  const editing = Boolean(initial);

  const confirm = () => {
    const invalid = firstInvalidGroup(product, selections);
    if (invalid) {
      setError({ groupId: invalid.group.id, message: invalid.message });
      refs.current[invalid.group.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onConfirm({ productId: product.id, variantId, quantity, notes: notes.trim(), selections: Object.fromEntries(Object.entries(selections).filter(([, o]) => Object.keys(o).length)) });
  };

  return (
    <Sheet
      open
      onClose={onClose}
      label={product.name}
      footer={(
        <div className="space-y-2">
          {error && <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"><Icon name="alert" className="size-4 shrink-0" />{error.message}</p>}
          <div className="flex items-center gap-3">
            <QuantityStepper value={quantity} min={1} max={99} onChange={setQuantity} label={product.name} />
            <button
              type="button"
              onClick={confirm}
              disabled={!canOrder}
              className="flex h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-full bg-brand px-5 font-bold text-on-brand transition enabled:active:scale-[.98] enabled:hover:brightness-95 disabled:bg-stone-300 disabled:text-stone-600"
            >
              <span className="truncate">{canOrder ? (editing ? 'Salvar' : 'Adicionar') : 'Loja fechada'}</span>
              {canOrder && <span className="tabular-nums">{formatBRL(priced.lineTotalCents)}</span>}
            </button>
          </div>
        </div>
      )}
    >
      <div className="relative">
        <Thumb product={product} className="aspect-[16/9] w-full" />
        <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/95 text-stone-700 shadow-md hover:bg-white">
          <Icon name="x" className="size-5" />
        </button>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <h2 className="text-2xl font-extrabold leading-tight">{product.name}</h2>
          {product.description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{product.description}</p>}
          {hasPriceRange(product) && product.variants.length === 1 && <p className="mt-2 text-sm font-semibold">a partir de {formatBRL(fromPrice(product))}</p>}
        </div>

        {product.variants.length > 1 && (
          <section aria-labelledby="variants" className="rounded-2xl border border-line">
            <header className="flex items-center justify-between rounded-t-2xl bg-stone-50 px-4 py-3">
              <h3 id="variants" className="font-bold">{product.variants.some((v) => SIZE_WORDS.test(v.name)) ? 'Tamanho' : 'Escolha uma opção'}</h3>
              <span className="rounded-md bg-brand px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-on-brand">Obrigatório</span>
            </header>
            <ul role="radiogroup" className="divide-y divide-line">
              {product.variants.map((v) => (
                <li key={v.id}>
                  <button type="button" role="radio" aria-checked={variantId === v.id} onClick={() => setVariantId(v.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{v.name}</p>
                      {v.description && <p className="text-xs text-muted">{v.description}</p>}
                      {v.priceCents > 0 && <p className="mt-0.5 text-sm font-semibold text-stone-700">{formatBRL(v.priceCents)}</p>}
                    </div>
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${variantId === v.id ? 'border-brand bg-brand text-on-brand' : 'border-stone-300'}`}>
                      {variantId === v.id && <Icon name="check" className="size-3.5" strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {product.optionGroups.map((group) => (
          <OptionGroup
            key={group.id}
            ref={(el) => { refs.current[group.id] = el; }}
            group={group}
            variantId={variantId}
            selections={selections}
            priced={priced}
            invalid={error?.groupId === group.id}
            onChange={(groupId, value) => setSelections((s) => ({ ...s, [groupId]: value }))}
          />
        ))}

        <label className="block">
          <span className="mb-1.5 block font-bold">Observações</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={255} rows={2} placeholder="Ex.: sem cebola, cortar em 12 pedaços…" className="w-full resize-none rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand" />
          <span className="mt-1 block text-right text-xs text-muted">{notes.length}/255</span>
        </label>
      </div>
    </Sheet>
  );
}
