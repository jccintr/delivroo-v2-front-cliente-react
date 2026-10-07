import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { createOrder } from '../api/client.js';
import { toApiOptions } from '../lib/pricing.js';
import { formatBRL, parseBRLToCents } from '../lib/money.js';
import { isValidPhone, maskPhone, onlyDigits } from '../lib/phone.js';
import { KEYS, load, rememberOrder, save } from '../lib/storage.js';
import { describeLine } from '../lib/cart.js';
import Icon from '../components/Icon.jsx';

const Section = ({ title, children }) => (
  <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
    <h2 className="mb-4 text-lg font-extrabold">{title}</h2>
    {children}
  </section>
);

const Field = ({ label, error, children, hint }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold">{label}</span>
    {children}
    {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    {error && <span role="alert" className="mt-1 block text-sm font-medium text-red-600">{error}</span>}
  </label>
);

const inputClass = (error) => `h-12 w-full rounded-2xl border bg-white px-4 outline-none transition focus:border-brand ${error ? 'border-red-400' : 'border-line'}`;

function Choice({ checked, onClick, title, subtitle, right, disabled }) {
  return (
    <button type="button" role="radio" aria-checked={checked} disabled={disabled} onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition disabled:opacity-50 ${checked ? 'border-brand bg-stone-50' : 'border-line hover:border-stone-300'}`}>
      <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-brand' : 'border-stone-300'}`}>{checked && <span className="size-2.5 rounded-full bg-brand" />}</span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span>{subtitle && <span className="block text-sm text-muted">{subtitle}</span>}</span>
      {right}
    </button>
  );
}

export default function CheckoutPage() {
  const cart = useStore();
  const { menu, store, slug } = cart;
  const navigate = useNavigate();
  const saved = useMemo(() => load(KEYS.customer, {}), []);
  const hasDelivery = menu.deliveryZones.length > 0;

  const [fulfillment, setFulfillment] = useState(hasDelivery ? 'DELIVERY' : 'PICKUP');
  const [name, setName] = useState(saved.name ?? '');
  const [phone, setPhone] = useState(saved.phone ? maskPhone(saved.phone) : '');
  const [zoneId, setZoneId] = useState(() => menu.deliveryZones.find((z) => z.district === saved.district)?.id ?? '');
  const [address, setAddress] = useState(saved.address ?? '');
  const [paymentId, setPaymentId] = useState(null);
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState(null);

  const zone = menu.deliveryZones.find((z) => z.id === Number(zoneId));
  const payment = menu.paymentMethods.find((m) => m.id === paymentId);
  const feeCents = fulfillment === 'DELIVERY' ? (zone?.feeCents ?? 0) : 0;
  const totalCents = cart.subtotalCents + feeCents;
  const canOrder = store.isOpen && cart.lines.length > 0;

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const validate = () => {
    const e = {};
    if (name.trim().length < 2) e.name = 'Informe seu nome';
    if (!isValidPhone(phone)) e.phone = 'Informe um telefone com DDD';
    if (fulfillment === 'DELIVERY') {
      if (!zone) e.zone = 'Escolha o bairro';
      if (address.trim().length < 5) e.address = 'Informe rua, número e complemento';
    }
    if (!payment) e.payment = 'Escolha a forma de pagamento';
    if (payment?.type === 'CASH' && needsChange) {
      const cents = parseBRLToCents(changeFor);
      if (cents == null || cents < totalCents) e.change = `O valor precisa ser maior ou igual a ${formatBRL(totalCents)}`;
    }
    setErrors(e);
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setFailure(null);
    const e = validate();
    if (Object.keys(e).length) {
      document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder(slug, {
        fulfillment,
        name: name.trim(),
        phone: onlyDigits(phone),
        ...(fulfillment === 'DELIVERY' ? { deliveryZoneId: zone.id, address: address.trim() } : {}),
        paymentMethodId: payment.id,
        ...(payment.type === 'CASH' && needsChange ? { cashChangeForCents: parseBRLToCents(changeFor) } : {}),
        notes: notes.trim() || undefined,
        items: cart.items.map((i) => ({
          productId: i.productId, variantId: i.variantId, quantity: i.quantity,
          ...(i.notes ? { notes: i.notes } : {}),
          options: toApiOptions(i.selections),
        })),
      });
      save(KEYS.customer, { name: name.trim(), phone: onlyDigits(phone), address: address.trim(), district: zone?.district });
      rememberOrder({ publicId: order.publicId, slug, storeName: store.name, orderNumber: order.orderNumber, totalCents: order.totalCents, createdAt: order.createdAt });
      cart.clear();
      navigate(`/pedido/${order.publicId}`, { replace: true, state: { fresh: true } });
    } catch (err) {
      setFailure(err);
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (cart.lines.length === 0 && !submitting) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
        <div>
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-stone-100 text-stone-400"><Icon name="bag" className="size-8" /></div>
          <h1 className="mt-4 text-xl font-extrabold">Sua sacola está vazia</h1>
          <Link to={`/${slug}`} className="mt-6 inline-flex h-12 items-center rounded-full bg-brand px-8 font-bold text-on-brand">Ver cardápio</Link>
        </div>
      </div>
    );
  }

  const stale = failure && (failure.status === 422 || failure.status === 404);

  return (
    <div className="min-h-dvh pb-32 lg:pb-12">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link to={`/${slug}`} aria-label="Voltar ao cardápio" className="grid size-10 place-items-center rounded-full hover:bg-stone-100"><Icon name="back" /></Link>
          <div className="min-w-0"><h1 className="truncate font-extrabold leading-tight">Finalizar pedido</h1><p className="truncate text-xs text-muted">{store.name}</p></div>
        </div>
      </header>

      <form onSubmit={submit} noValidate className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-6 px-4 pt-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          {!store.isOpen && (
            <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">A loja fechou. Não é possível enviar o pedido agora.</p>
          )}
          {failure && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-bold">Não foi possível enviar o pedido</p>
              <p className="mt-0.5">{failure.message}</p>
              {failure.details?.length > 0 && <ul className="mt-1 list-disc pl-5">{failure.details.map((d) => <li key={`${d.field}${d.message}`}>{d.message}</li>)}</ul>}
              {stale && (
                <button type="button" onClick={() => { cart.reload(); setFailure(null); }} className="mt-2 font-bold underline">Atualizar cardápio</button>
              )}
              {failure.code === 'STORE_CLOSED' && <button type="button" onClick={() => cart.reload()} className="mt-2 font-bold underline">Atualizar</button>}
            </div>
          )}

          <Section title="Como você quer receber?">
            <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
              <Choice checked={fulfillment === 'DELIVERY'} disabled={!hasDelivery} onClick={() => setFulfillment('DELIVERY')} title="Entrega" subtitle={hasDelivery ? (menu.store.waitMinMinutes ? `${menu.store.waitMinMinutes}–${menu.store.waitMaxMinutes} min` : 'Receba em casa') : 'Indisponível nesta loja'} right={<Icon name="bike" className="size-6 text-stone-400" />} />
              <Choice checked={fulfillment === 'PICKUP'} onClick={() => setFulfillment('PICKUP')} title="Retirada na loja" subtitle="Sem taxa de entrega" right={<Icon name="store" className="size-6 text-stone-400" />} />
            </div>
            {fulfillment === 'PICKUP' && (menu.store.address?.street) && (
              <p className="mt-3 flex gap-2 text-sm text-muted"><Icon name="pin" className="mt-0.5 size-4 shrink-0" />{menu.store.address.street}{menu.store.address.number ? `, ${menu.store.address.number}` : ''}{menu.store.address.district ? ` · ${menu.store.address.district}` : ''}{menu.store.city ? ` · ${menu.store.city}` : ''}</p>
            )}
          </Section>

          <Section title="Seus dados">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" error={errors.name}>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} className={inputClass(errors.name)} />
              </Field>
              <Field label="Telefone / WhatsApp" error={errors.phone}>
                <input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} inputMode="tel" autoComplete="tel-national" placeholder="(00) 00000-0000" className={inputClass(errors.phone)} />
              </Field>
            </div>
          </Section>

          {fulfillment === 'DELIVERY' && (
            <Section title="Endereço de entrega">
              <div className="space-y-4">
                <Field label="Bairro" error={errors.zone}>
                  <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={`${inputClass(errors.zone)} appearance-none`}>
                    <option value="">Escolha o bairro…</option>
                    {menu.deliveryZones.map((z) => <option key={z.id} value={z.id}>{z.district} — {z.feeCents === 0 ? 'grátis' : formatBRL(z.feeCents)}</option>)}
                  </select>
                </Field>
                <Field label="Endereço" error={errors.address} hint="Rua, número, complemento e ponto de referência">
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} maxLength={255} autoComplete="street-address" className={`${inputClass(errors.address)} h-auto resize-none py-3`} />
                </Field>
              </div>
            </Section>
          )}

          <Section title="Pagamento na entrega">
            <div role="radiogroup" className="space-y-2">
              {menu.paymentMethods.map((m) => (
                <Choice key={m.id} checked={paymentId === m.id} onClick={() => { setPaymentId(m.id); setErrors((e) => ({ ...e, payment: undefined })); }} title={m.name} subtitle={m.type === 'PIX' ? 'Você recebe a chave Pix depois de enviar o pedido' : undefined} />
              ))}
            </div>
            {errors.payment && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{errors.payment}</p>}
            {payment?.type === 'CASH' && (
              <div className="mt-4 space-y-3 rounded-2xl bg-stone-50 p-4">
                <label className="flex items-center gap-3 font-semibold">
                  <input type="checkbox" checked={needsChange} onChange={(e) => setNeedsChange(e.target.checked)} className="size-5 accent-[var(--brand,#b91c1c)]" />
                  Preciso de troco
                </label>
                {needsChange && (
                  <Field label="Troco para quanto?" error={errors.change}>
                    <input value={changeFor} onChange={(e) => setChangeFor(e.target.value)} inputMode="decimal" placeholder="Ex.: 100,00" className={inputClass(errors.change)} />
                  </Field>
                )}
              </div>
            )}
          </Section>

          <Section title="Observações do pedido">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} placeholder="Ex.: tocar a campainha, sem talheres…" className="w-full resize-none rounded-2xl border border-line px-4 py-3 outline-none focus:border-brand" />
          </Section>
        </div>

        <aside>
          <div className="space-y-4 rounded-3xl border border-line bg-white p-5 shadow-sm lg:sticky lg:top-20">
            <h2 className="flex items-center justify-between text-lg font-extrabold">
              Resumo
              <Link to={`/${slug}`} className="text-sm font-bold text-brand">Adicionar itens</Link>
            </h2>
            <ul className="divide-y divide-line">
              {cart.lines.map((line) => {
                const d = describeLine(line);
                return (
                  <li key={line.item.id} className="flex justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold">{line.item.quantity}× {line.product.name}</p>
                      <p className="text-muted">
                        {line.product.variants.length > 1 && d.variant}
                        {d.groups.map((g) => <span key={g.name} className="block">{g.name}: {g.list.join(', ')}</span>)}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">{formatBRL(line.priced.lineTotalCents)}</span>
                  </li>
                );
              })}
            </ul>
            <dl className="space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatBRL(cart.subtotalCents)}</dd></div>
              {fulfillment === 'DELIVERY' && (
                <div className="flex justify-between"><dt className="text-muted">Entrega</dt><dd className="tabular-nums">{zone ? (feeCents === 0 ? 'Grátis' : formatBRL(feeCents)) : 'escolha o bairro'}</dd></div>
              )}
              <div className="flex justify-between pt-2 text-lg font-extrabold"><dt>Total</dt><dd className="tabular-nums">{formatBRL(totalCents)}</dd></div>
            </dl>
            <button type="submit" disabled={submitting || !canOrder} className="hidden h-14 w-full items-center justify-center rounded-full bg-brand text-lg font-bold text-on-brand transition enabled:hover:brightness-95 disabled:bg-stone-300 disabled:text-stone-600 lg:flex">
              {submitting ? 'Enviando…' : 'Fazer pedido'}
            </button>
            <p className="hidden text-center text-xs text-muted lg:block">O valor final é confirmado pela loja ao receber o pedido.</p>
          </div>
        </aside>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:hidden">
          <button type="submit" disabled={submitting || !canOrder} className="flex h-14 w-full items-center justify-between rounded-full bg-brand px-6 font-bold text-on-brand disabled:bg-stone-300 disabled:text-stone-600">
            <span>{submitting ? 'Enviando…' : 'Fazer pedido'}</span>
            <span className="tabular-nums">{formatBRL(totalCents)}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
