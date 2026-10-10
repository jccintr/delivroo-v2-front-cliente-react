import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError, getMenu, getOrder, orderEventsUrl } from '../api/client.js';
import { connectEvents } from '../api/sse.js';
import { formatBRL } from '../lib/money.js';
import { maskPhone, whatsappLink } from '../lib/phone.js';
import { useBrand } from '../lib/useBrand.js';
import { NEGATIVE, STEP_HINT, STEP_LABEL, TERMINAL, stepsFor } from '../lib/orderStatus.js';
import Icon from '../components/Icon.jsx';

const time = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

function Timeline({ order }) {
  const steps = stepsFor(order.fulfillment);
  const reached = new Map(order.history.map((h) => [h.status, h.createdAt]));
  // posição atual: último passo "normal" já alcançado
  const current = Math.max(...steps.map((s, i) => (reached.has(s) || order.status === s ? i : -1)));
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => {
        const done = i <= current;
        const active = i === current && !TERMINAL.has(order.status);
        return (
          <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${i < current ? 'bg-brand' : 'bg-stone-200'}`} />}
            <span className={`relative grid size-8 shrink-0 place-items-center rounded-full border-2 ${done ? 'border-brand bg-brand text-on-brand' : 'border-stone-300 bg-white text-stone-300'} ${active ? 'ring-4 ring-stone-200' : ''}`}>
              {done ? <Icon name="check" className="size-4" strokeWidth={3} /> : <span className="size-2 rounded-full bg-stone-300" />}
            </span>
            <div className="pt-1">
              <p className={`font-bold leading-tight ${done ? '' : 'text-stone-400'}`}>{STEP_LABEL[s]}</p>
              {reached.get(s) && <p className="text-sm text-muted">{time(reached.get(s))}</p>}
              {active && <p className="mt-0.5 text-sm text-muted">{STEP_HINT[s]}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function PixBox({ pix }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(pix.key); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sem permissão */ }
  };
  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
      <h2 className="font-extrabold text-emerald-900">Pagamento via Pix</h2>
      <p className="mt-1 text-sm text-emerald-900/80">Pague na entrega ou antecipe com a chave abaixo{pix.beneficiary ? ` (${pix.beneficiary})` : ''}.</p>
      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white p-2 pl-4">
        <code className="min-w-0 flex-1 truncate text-sm font-semibold">{pix.key}</code>
        <button type="button" onClick={copy} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700">
          <Icon name="copy" className="size-4" />{copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </section>
  );
}

export default function OrderPage() {
  const { publicId } = useParams();
  const { state } = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [pix, setPix] = useState(null);
  const pixLoaded = useRef(false);
  const [conn, setConn] = useState('connecting'); // connecting | live | offline

  useBrand(order?.store); // acompanhamento usa o tema da loja, como o cardápio

  const fetchOrder = useCallback(async (signal) => {
    try {
      const data = await getOrder(publicId, signal);
      setOrder(data);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') return;
      // erro de rede durante o acompanhamento não apaga o que já está na tela
      setError(err instanceof ApiError && err.status === 404 ? { notFound: true } : { message: err.message });
    }
  }, [publicId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrder(controller.signal);
    return () => controller.abort();
  }, [fetchOrder]);

  const loaded = !!order;
  const finishedOrder = !!order && TERMINAL.has(order.status);

  // tempo real: a loja muda o status e a tela atualiza na hora (SSE). Conecta só com o pedido já carregado
  // (pedido inexistente não fica tentando reconectar) e desconecta quando o pedido termina.
  useEffect(() => {
    if (!loaded || finishedOrder) return undefined;
    return connectEvents(
      () => Promise.resolve(orderEventsUrl(publicId)),
      {
        'order.updated': (data) => {
          setOrder((prev) => {
            if (prev && prev.status !== data.status) navigator.vibrate?.(200);
            return data;
          });
          setError(null);
        },
      },
      { onStatus: setConn },
    );
  }, [publicId, loaded, finishedOrder]);

  // rede de segurança: busca de tempos em tempos (devagar com o SSE ao vivo; pausa com a aba escondida)
  useEffect(() => {
    if (!order || TERMINAL.has(order.status)) return undefined;
    const tick = () => { if (!document.hidden) fetchOrder(); };
    const id = setInterval(tick, conn === 'live' ? 60000 : 15000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [order, conn, fetchOrder]);

  useEffect(() => {
    if (order) document.title = `${STEP_LABEL[order.status] ?? ''} · Pedido #${order.orderNumber} — ${order.store.name}`;
  }, [order]);

  // chave Pix vem do cardápio da loja
  useEffect(() => {
    if (!order || order.payment.type !== 'PIX' || pixLoaded.current) return;
    pixLoaded.current = true;
    getMenu(order.store.slug).then((m) => { if (m.store.pixKey) setPix({ key: m.store.pixKey, beneficiary: m.store.pixBeneficiary }); }).catch(() => {});
  }, [order]);

  if (error?.notFound) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-extrabold">Pedido não encontrado</h1>
          <p className="mt-1 text-muted">Confira o link do acompanhamento.</p>
          <Link to="/" className="mt-6 inline-flex h-12 items-center rounded-full bg-brand px-8 font-bold text-on-brand">Início</Link>
        </div>
      </div>
    );
  }
  if (!order) {
    return error ? (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
        <div>
          <p className="font-bold">{error.message}</p>
          <button type="button" onClick={() => fetchOrder()} className="mt-4 h-12 rounded-full bg-brand px-8 font-bold text-on-brand">Tentar novamente</button>
        </div>
      </div>
    ) : <div className="grid min-h-dvh place-items-center text-muted" aria-busy="true">Carregando pedido…</div>;
  }

  const negative = NEGATIVE.has(order.status);
  const finished = TERMINAL.has(order.status) && !negative;
  const reason = order.history.findLast?.((h) => h.status === order.status)?.reason;
  const waText = `Olá! Estou falando sobre o pedido #${order.orderNumber} (${order.customer.name}).`;

  return (
    <div className="min-h-dvh pb-12">
      <header className="bg-brand text-on-brand">
        <div className="mx-auto max-w-2xl px-4 pb-8 pt-6">
          <Link to={`/${order.store.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold opacity-90 hover:opacity-100"><Icon name="back" className="size-4" />{order.store.name}</Link>
          {state?.fresh && (
            <div className="mt-5 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-white/20"><Icon name="check" className="size-7" strokeWidth={3} /></span>
              <p className="text-xl font-extrabold leading-tight">Pedido enviado!</p>
            </div>
          )}
          <p className="mt-4 text-sm opacity-90">Pedido</p>
          <h1 className="text-4xl font-extrabold">#{order.orderNumber}</h1>
          <p className="mt-1 opacity-90">Olá, {order.customer.name.split(' ')[0]}!</p>
        </div>
      </header>

      <div className="mx-auto -mt-4 max-w-2xl space-y-4 px-4">
        {negative ? (
          <section role="status" className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-900">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><Icon name="alert" className="size-5" />{STEP_LABEL[order.status]}</h2>
            <p className="mt-1">{STEP_HINT[order.status]}</p>
            {reason && <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-sm"><span className="font-bold">Motivo:</span> {reason}</p>}
          </section>
        ) : (
          <section aria-live="polite" className="rounded-3xl border border-line bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold">{finished ? STEP_LABEL[order.status] : 'Acompanhe seu pedido'}</h2>
              {!finished && (
                <span data-testid="live-status" data-conn={conn} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <span className={`size-2 rounded-full ${conn === 'live' ? 'animate-pulse bg-emerald-500' : 'bg-amber-400'}`} />{conn === 'live' ? 'ao vivo' : 'atualizando…'}
                </span>
              )}
            </div>
            <Timeline order={order} />
          </section>
        )}

        {order.payment.type === 'PIX' && pix && !TERMINAL.has(order.status) && <PixBox pix={pix} />}

        <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-extrabold">Itens do pedido</h2>
          <ul className="divide-y divide-line">
            {order.items.map((item) => {
              const groups = new Map();
              for (const o of item.options) groups.set(o.groupName, [...(groups.get(o.groupName) ?? []), o.quantity > 1 ? `${o.quantity}x ${o.optionName}` : o.optionName]);
              return (
                <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.quantity}× {item.productName}{item.variantName && item.variantName !== 'Único' ? ` · ${item.variantName}` : ''}</p>
                    {[...groups.entries()].map(([g, list]) => <p key={g} className="text-muted">{g}: {list.join(', ')}</p>)}
                    {item.notes && <p className="italic text-muted">“{item.notes}”</p>}
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">{formatBRL(item.lineTotalCents)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatBRL(order.subtotalCents)}</dd></div>
            {order.fulfillment === 'DELIVERY' && <div className="flex justify-between"><dt className="text-muted">Entrega</dt><dd className="tabular-nums">{order.deliveryFeeCents === 0 ? 'Grátis' : formatBRL(order.deliveryFeeCents)}</dd></div>}
            {order.discountCents > 0 && <div className="flex justify-between"><dt className="text-muted">Desconto</dt><dd className="tabular-nums">− {formatBRL(order.discountCents)}</dd></div>}
            <div className="flex justify-between pt-2 text-lg font-extrabold"><dt>Total</dt><dd className="tabular-nums">{formatBRL(order.totalCents)}</dd></div>
          </dl>
        </section>

        <section className="space-y-3 rounded-3xl border border-line bg-white p-5 text-sm shadow-sm">
          <div className="flex gap-3"><Icon name={order.fulfillment === 'DELIVERY' ? 'bike' : 'store'} className="mt-0.5 size-5 shrink-0 text-muted" />
            <div><p className="font-bold">{order.fulfillment === 'DELIVERY' ? 'Entrega' : 'Retirada na loja'}</p>
              {order.delivery && <p className="text-muted">{order.delivery.address}{order.delivery.district ? ` · ${order.delivery.district}` : ''}</p>}</div></div>
          <div className="flex gap-3"><Icon name="receipt" className="mt-0.5 size-5 shrink-0 text-muted" />
            <div><p className="font-bold">{order.payment.name}</p>
              {order.payment.cashChangeForCents && <p className="text-muted">Troco para {formatBRL(order.payment.cashChangeForCents)}</p>}</div></div>
          {order.notes && <div className="flex gap-3"><Icon name="chat" className="mt-0.5 size-5 shrink-0 text-muted" /><p className="text-muted">{order.notes}</p></div>}
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          {order.store.phone && (
            <a href={whatsappLink(order.store.phone, waText)} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 font-bold text-white hover:bg-emerald-700">
              <Icon name="chat" className="size-5" />Falar com a loja
            </a>
          )}
          <Link to={`/${order.store.slug}`} className="flex h-12 items-center justify-center rounded-full border border-line bg-white font-bold hover:bg-stone-50">Voltar ao cardápio</Link>
        </div>
        {order.store.phone && <p className="text-center text-xs text-muted">{order.store.name} · {maskPhone(order.store.phone)}</p>}
        {error?.message && <p role="status" className="text-center text-xs text-amber-700">Sem conexão para atualizar. Tentaremos de novo.</p>}
      </div>
    </div>
  );
}
