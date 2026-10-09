import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { ApiError, getMenu, isMenuUnavailable } from '../api/client.js';
import { StoreProvider } from '../context/StoreContext.jsx';
import { brandColors, DEFAULT_BRAND } from '../lib/color.js';
import Toast from '../components/Toast.jsx';
import Icon from '../components/Icon.jsx';
import { StoreNotFound, StoreUnavailable } from './NotFoundPage.jsx';

function applyTheme(store) {
  const root = document.documentElement;
  if (!store) {
    root.style.removeProperty('--brand');
    root.style.removeProperty('--on-brand');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', DEFAULT_BRAND);
    document.title = 'Delivroo — Cardápio digital';
    return;
  }
  const { brand, onBrand } = brandColors(store);
  root.style.setProperty('--brand', brand);
  root.style.setProperty('--on-brand', onBrand);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', brand);
  document.title = `${store.name} — Cardápio`;
}

function Skeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando cardápio">
      <div className="h-36 bg-stone-300" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="-mt-12 size-28 rounded-full border-4 border-white bg-stone-200" />
        <div className="mt-4 h-7 w-56 rounded bg-stone-200" />
        <div className="mt-3 h-4 w-72 max-w-full rounded bg-stone-200" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-32 rounded-2xl bg-stone-200" />)}
        </div>
      </div>
    </div>
  );
}

export default function StoreLayout() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: 'loading' });

  const load = useCallback((signal) => {
    return getMenu(slug, signal)
      .then((menu) => setState({ status: 'ready', menu }))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (isMenuUnavailable(err)) return setState({ status: 'unavailable' });
        setState({ status: err instanceof ApiError && err.status === 404 ? 'notfound' : 'error', message: err.message });
      });
  }, [slug]);

  useEffect(() => {
    setState({ status: 'loading' });
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    applyTheme(state.status === 'ready' ? state.menu.store : null);
    return () => applyTheme(null);
  }, [state]);

  const reload = useCallback(() => load(), [load]);

  if (state.status === 'loading') return <Skeleton />;
  if (state.status === 'notfound') return <StoreNotFound slug={slug} />;
  if (state.status === 'unavailable') return <StoreUnavailable onRetry={() => { setState({ status: 'loading' }); load(); }} />;
  if (state.status === 'error') {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
        <div>
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-600"><Icon name="alert" className="size-8" /></div>
          <h1 className="mt-4 text-xl font-extrabold">Não conseguimos abrir o cardápio</h1>
          <p className="mt-1 text-muted">{state.message}</p>
          <button type="button" onClick={() => { setState({ status: 'loading' }); load(); }} className="mt-6 h-12 rounded-full bg-brand px-8 font-bold text-on-brand">Tentar novamente</button>
          <p className="mt-4"><Link to="/" className="text-sm font-semibold text-muted underline">Ir para o início</Link></p>
        </div>
      </div>
    );
  }

  return (
    <StoreProvider slug={slug} menu={state.menu} reload={reload}>
      <Outlet />
      <Toast />
    </StoreProvider>
  );
}
