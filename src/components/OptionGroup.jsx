import { forwardRef } from 'react';
import Icon from './Icon.jsx';
import QuantityStepper from './QuantityStepper.jsx';
import { formatBRL } from '../lib/money.js';
import { groupTotal, optionPrice } from '../lib/pricing.js';

function rule(group) {
  if (group.maxSelect === 1) return group.minSelect === 1 ? 'Escolha 1' : 'Escolha até 1';
  if (group.minSelect === 0) return `Escolha até ${group.maxSelect}`;
  if (group.minSelect === group.maxSelect) return `Escolha ${group.maxSelect}`;
  return `Escolha de ${group.minSelect} a ${group.maxSelect}`;
}

const OptionGroup = forwardRef(function OptionGroup({ group, variantId, selections, onChange, priced, invalid }, ref) {
  const chosen = selections[group.id] ?? {};
  const total = groupTotal(selections, group.id);
  const single = group.maxSelect === 1;
  const stepper = !single && group.maxPerOption > 1;
  const full = total >= group.maxSelect;
  const required = group.minSelect >= 1;
  const highest = group.pricingMode === 'HIGHEST';
  const chargedByOption = new Map((priced?.options ?? []).filter((o) => o.groupId === group.id).map((o) => [o.optionId, o.chargedCents]));

  const setQty = (optionId, qty) => {
    const next = { ...chosen };
    if (qty <= 0) delete next[optionId]; else next[optionId] = qty;
    onChange(group.id, next);
  };

  const toggle = (optionId) => {
    if (single) {
      if (chosen[optionId]) { if (!required) onChange(group.id, {}); } else onChange(group.id, { [optionId]: 1 });
    } else if (chosen[optionId]) setQty(optionId, 0);
    else if (!full) setQty(optionId, 1);
  };

  const priceLabel = (option) => {
    const price = optionPrice(option, variantId);
    if (highest) {
      if (chosen[option.id] && total > 1 && chargedByOption.get(option.id) === 0 && price > 0) return <span className="text-emerald-700">incluso</span>;
      return price > 0 ? formatBRL(price) : null;
    }
    return price > 0 ? `+ ${formatBRL(price)}` : null;
  };

  return (
    <section ref={ref} aria-labelledby={`g-${group.id}`} className={`scroll-mt-24 rounded-2xl border bg-white ${invalid ? 'border-red-400 ring-2 ring-red-100' : 'border-line'}`}>
      <header className="flex items-start justify-between gap-3 rounded-t-2xl bg-stone-50 px-4 py-3">
        <div>
          <h3 id={`g-${group.id}`} className="font-bold leading-tight">{group.name}</h3>
          <p className="mt-0.5 text-xs text-muted">
            {rule(group)}
            {highest && group.maxSelect > 1 && ' · cobramos o sabor mais caro'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {group.maxSelect > 1 && <span className="text-xs font-semibold tabular-nums text-muted">{total}/{group.maxSelect}</span>}
          <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${required ? 'bg-brand text-on-brand' : 'bg-stone-200 text-stone-600'}`}>{required ? 'Obrigatório' : 'Opcional'}</span>
        </div>
      </header>
      <ul className="divide-y divide-line">
        {group.options.map((option) => {
          const qty = chosen[option.id] ?? 0;
          const disabled = !single && !stepper && !qty && full;
          const label = priceLabel(option);
          const text = (
            <div className="min-w-0 flex-1 text-left">
              <p className="font-medium leading-snug">{option.name}</p>
              {option.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{option.description}</p>}
              {label && <p className="mt-0.5 text-sm font-semibold text-stone-700">{label}</p>}
            </div>
          );
          if (stepper) {
            return (
              <li key={option.id} className="flex items-center gap-3 px-4 py-3">
                {text}
                <QuantityStepper size="sm" value={qty} min={0} max={Math.min(group.maxPerOption, qty + (group.maxSelect - total))} onChange={(q) => setQty(option.id, q)} label={option.name} />
              </li>
            );
          }
          return (
            <li key={option.id}>
              <button
                type="button"
                role={single ? 'radio' : 'checkbox'}
                aria-checked={qty > 0}
                disabled={disabled}
                onClick={() => toggle(option.id)}
                className="flex w-full items-center gap-3 px-4 py-3 transition enabled:hover:bg-stone-50 disabled:opacity-40"
              >
                {text}
                <span className={`grid size-6 shrink-0 place-items-center border-2 transition ${single ? 'rounded-full' : 'rounded-md'} ${qty ? 'border-brand bg-brand text-on-brand' : 'border-stone-300 bg-white'}`}>
                  {qty > 0 && <Icon name="check" className="size-3.5" strokeWidth={3} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

export default OptionGroup;
