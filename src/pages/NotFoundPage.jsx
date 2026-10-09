import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function SlugForm({ initial = '' }) {
  const [value, setValue] = useState(initial);
  const navigate = useNavigate();
  const go = (e) => { e.preventDefault(); const slug = slugify(value); if (slug) navigate(`/${slug}`); };
  return (
    <form onSubmit={go} className="flex gap-2">
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="nome-da-loja" aria-label="Endereço da loja" className="h-12 min-w-0 flex-1 rounded-full border border-line bg-white px-5 outline-none focus:border-brand" />
      <button type="submit" className="h-12 rounded-full bg-brand px-6 font-bold text-on-brand">Abrir</button>
    </form>
  );
}

export function StoreNotFound({ slug }) {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div className="w-full">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-stone-100 text-stone-500"><Icon name="store" className="size-8" /></div>
        <h1 className="mt-4 text-2xl font-extrabold">Loja não encontrada</h1>
        <p className="mt-1 text-muted">Não existe uma loja em <span className="font-semibold text-ink">/{slug}</span>. Confira o endereço com a loja.</p>
        <div className="mt-6"><SlugForm /></div>
      </div>
    </div>
  );
}

// Loja bloqueada ou com assinatura suspensa: mensagem neutra, sem dizer o motivo ao cliente.
export function StoreUnavailable({ onRetry }) {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div>
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-stone-100 text-stone-500"><Icon name="store" className="size-8" /></div>
        <h1 className="mt-4 text-2xl font-extrabold">Cardápio indisponível</h1>
        <p className="mt-1 text-muted">Este cardápio não está disponível no momento. Tente novamente mais tarde ou fale diretamente com a loja.</p>
        {onRetry && <button type="button" onClick={onRetry} className="mt-6 h-12 rounded-full border border-line bg-white px-8 font-bold">Tentar novamente</button>}
        <p className="mt-4"><Link to="/" className="text-sm font-semibold text-muted underline">Ir para o início</Link></p>
      </div>
    </div>
  );
}

export default function NotFoundPage() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-extrabold">Página não encontrada</h1>
        <Link to="/" className="mt-4 inline-block font-semibold text-brand underline">Voltar ao início</Link>
      </div>
    </div>
  );
}
