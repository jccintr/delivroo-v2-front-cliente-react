import Icon from './Icon.jsx';
import QuantityStepper from './QuantityStepper.jsx';
import { formatBRL } from '../lib/money.js';
import { describeLine } from '../lib/cart.js';

/** Lista dos itens da sacola (usada na gaveta do celular e na lateral do desktop). */
export default function CartPanel({ lines, onQuantity, onRemove, onEdit, compact = false }) {
  if (lines.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-stone-100 text-stone-400"><Icon name="bag" className="size-8" /></div>
        <p className="mt-4 font-bold">Sua sacola está vazia</p>
        <p className="mt-1 text-sm text-muted">Escolha algo gostoso no cardápio.</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {lines.map(({ item, product, priced }) => {
        const d = describeLine({ priced });
        return (
          <li key={item.id} className={compact ? 'py-3' : 'px-5 py-4'}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold leading-snug">{product.name}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {product.variants.length > 1 && <span className="block font-medium text-stone-700">{d.variant}</span>}
                  {d.groups.map((g) => (
                    <span key={g.name} className="block"><span className="font-medium text-stone-600">{g.name}:</span> {g.list.join(', ')}</span>
                  ))}
                </p>
                {item.notes && <p className="mt-1 text-sm italic text-muted">“{item.notes}”</p>}
              </div>
              <p className="shrink-0 font-bold tabular-nums">{formatBRL(priced.lineTotalCents)}</p>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm">
                {onEdit && (
                  <button type="button" onClick={() => onEdit(item)} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 font-semibold text-brand hover:bg-stone-100">
                    <Icon name="edit" className="size-4" />Editar
                  </button>
                )}
                <button type="button" onClick={() => onRemove(item.id)} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 font-semibold text-stone-500 hover:bg-stone-100 hover:text-red-600">
                  <Icon name="trash" className="size-4" />Remover
                </button>
              </div>
              <QuantityStepper size="sm" value={item.quantity} min={1} max={99} onChange={(q) => onQuantity(item.id, q)} label={product.name} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
