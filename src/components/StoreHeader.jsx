import { useState } from 'react';
import Icon from './Icon.jsx';
import Sheet from './Sheet.jsx';
import { formatBRL } from '../lib/money.js';
import { groupHours, nextOpeningText } from '../lib/hours.js';
import { maskPhone } from '../lib/phone.js';

export const Logo = ({ store, className = 'size-20 text-3xl' }) => (
  store.logoUrl
    ? <img src={store.logoUrl} alt={`Logo ${store.name}`} className={`${className} rounded-full border-4 border-white bg-white object-cover shadow-md`} />
    : <div className={`${className} grid place-items-center rounded-full border-4 border-white bg-white font-extrabold text-brand shadow-md`} aria-hidden="true">{store.name.trim().charAt(0).toUpperCase()}</div>
);

export function OpenBadge({ store, businessHours }) {
  if (store.isOpen) {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"><span className="size-1.5 rounded-full bg-emerald-600" />Aberto agora</span>;
  }
  const next = nextOpeningText(businessHours);
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-200 px-2.5 py-1 text-xs font-bold text-stone-700"><span className="size-1.5 rounded-full bg-stone-500" />Fechado{next ? ` · ${next}` : ''}</span>;
}

export default function StoreHeader({ menu }) {
  const { store, businessHours, deliveryZones, paymentMethods } = menu;
  const [infoOpen, setInfoOpen] = useState(false);
  const wait = store.waitMinMinutes && store.waitMaxMinutes ? `${store.waitMinMinutes}–${store.waitMaxMinutes} min` : null;
  const today = new Date().getDay();
  const address = [store.address?.street && `${store.address.street}${store.address.number ? `, ${store.address.number}` : ''}`, store.address?.district, store.city && `${store.city}${store.state ? ` - ${store.state}` : ''}`].filter(Boolean).join(' · ');

  return (
    <header className="bg-white">
      <div className="h-28 bg-brand sm:h-36" style={{ backgroundImage: 'radial-gradient(circle at 20% 120%, rgba(255,255,255,.18), transparent 55%), radial-gradient(circle at 90% -20%, rgba(255,255,255,.14), transparent 45%)' }} />
      <div className="mx-auto max-w-6xl px-4">
        <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
          <Logo store={store} className="size-24 text-4xl sm:size-28" />
          <div className="min-w-0 pb-1">
            <OpenBadge store={store} businessHours={businessHours} />
          </div>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{store.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
          {wait && <span className="inline-flex items-center gap-1.5"><Icon name="clock" className="size-4" />{wait}</span>}
          {address && <span className="inline-flex items-center gap-1.5"><Icon name="pin" className="size-4 shrink-0" /><span className="line-clamp-1">{address}</span></span>}
        </div>
        <button type="button" onClick={() => setInfoOpen(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-semibold text-ink hover:bg-stone-50">
          <Icon name="info" className="size-4" />Horários, taxas e pagamento
        </button>
        <div className="h-4" />
      </div>

      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} title="Sobre a loja">
        <div className="space-y-6 px-5 py-5 text-sm">
          <section>
            <h3 className="mb-2 font-bold">Horário de funcionamento</h3>
            {businessHours.length === 0 ? <p className="text-muted">Horários não informados.</p> : (
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {groupHours(businessHours).map((d) => (
                  <li key={d.weekday} className={`flex items-start justify-between gap-3 px-3.5 py-2.5 ${d.weekday === today ? 'bg-stone-50 font-semibold' : ''}`}>
                    <span>{d.label}{d.weekday === today && <span className="ml-2 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase text-on-brand">hoje</span>}</span>
                    <span className="text-right text-muted">{d.windows.length ? d.windows.map((w) => <span key={w} className="block">{w}</span>) : 'Fechado'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="mb-2 font-bold">Taxa de entrega por bairro</h3>
            {deliveryZones.length === 0 ? <p className="text-muted">Esta loja não faz entregas (apenas retirada).</p> : (
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {deliveryZones.map((z) => (
                  <li key={z.id} className="flex justify-between px-3.5 py-2.5"><span>{z.district}</span><span className="font-semibold">{z.feeCents === 0 ? 'Grátis' : formatBRL(z.feeCents)}</span></li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="mb-2 font-bold">Formas de pagamento</h3>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((m) => <span key={m.id} className="rounded-full bg-stone-100 px-3 py-1.5 font-medium">{m.name}</span>)}
            </div>
          </section>
          <section className="space-y-1 text-muted">
            {address && <p className="flex gap-2"><Icon name="pin" className="mt-0.5 size-4 shrink-0" />{address}</p>}
            {store.phone && <p className="flex gap-2"><Icon name="phone" className="mt-0.5 size-4 shrink-0" />{maskPhone(store.phone)}</p>}
          </section>
        </div>
      </Sheet>
    </header>
  );
}
