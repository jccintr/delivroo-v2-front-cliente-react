import { Link } from 'react-router-dom';
import { KEYS, load } from '../lib/storage.js';
import { formatBRL } from '../lib/money.js';
import { SlugForm } from './NotFoundPage.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';

export default function HomePage() {
  const orders = load(KEYS.orders, []);
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-6 py-14">
      <div className="text-center">
        <h1 className="flex justify-center"><Logo markClassName="size-14" textClassName="text-4xl" className="gap-3" /></h1>
        <p className="mt-4 text-muted">Cardápio digital: peça direto da sua loja favorita, sem complicação.</p>
      </div>
      <div className="mt-8">
        <p className="mb-2 text-sm font-semibold">Digite o endereço da loja</p>
        <SlugForm />
        <p className="mt-2 text-xs text-muted">Normalmente você chega aqui pelo link que a loja divulga, como <span className="font-medium">/nome-da-loja</span>.</p>
      </div>
      {orders.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-bold">Seus pedidos neste aparelho</h2>
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o.publicId}>
                <Link to={`/pedido/${o.publicId}`} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 hover:border-stone-300">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{o.storeName} · Pedido #{o.orderNumber}</span>
                    <span className="block text-sm text-muted">{new Date(o.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · {formatBRL(o.totalCents)}</span>
                  </span>
                  <Icon name="chevron" className="size-5 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
