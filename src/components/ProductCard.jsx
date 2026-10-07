import { formatBRL } from '../lib/money.js';
import { fromPrice, hasPriceRange } from '../lib/pricing.js';
import { Thumb } from './ProductSheet.jsx';

export default function ProductCard({ product, inCart, onOpen }) {
  const price = fromPrice(product);
  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="group relative flex w-full items-stretch gap-3 rounded-2xl border border-line bg-white p-3 text-left shadow-sm transition hover:border-stone-300 hover:shadow-md active:scale-[.99]"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="font-bold leading-snug">{product.name}</h3>
          {product.description && <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted">{product.description}</p>}
        </div>
        <p className="mt-2 text-sm font-bold text-stone-800">
          {hasPriceRange(product) && <span className="mr-1 text-xs font-medium text-muted">a partir de</span>}
          {formatBRL(price)}
        </p>
      </div>
      <div className="relative shrink-0">
        <Thumb product={product} className="size-24 rounded-xl sm:size-28" />
        {inCart > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-brand text-xs font-extrabold text-on-brand shadow ring-2 ring-white">{inCart}</span>}
      </div>
    </button>
  );
}
