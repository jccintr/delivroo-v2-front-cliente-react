import Icon from './Icon.jsx';

export default function QuantityStepper({ value, onChange, min = 0, max = 99, size = 'md', label = '' }) {
  const box = size === 'sm' ? 'size-8' : 'size-10';
  const btn = `grid ${box} place-items-center rounded-full border border-line bg-white text-ink transition active:scale-95 enabled:hover:bg-stone-50 disabled:opacity-35`;
  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label={label || 'Quantidade'}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Diminuir ${label}`.trim()}>
        <Icon name="minus" className="size-4" />
      </button>
      <span className="min-w-6 text-center text-base font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Aumentar ${label}`.trim()}>
        <Icon name="plus" className="size-4" />
      </button>
    </div>
  );
}
