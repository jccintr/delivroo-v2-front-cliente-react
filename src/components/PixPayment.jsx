import { useEffect, useState } from 'react';
import { reportPayment } from '../api/client.js';
import { formatBRL } from '../lib/money.js';
import { NOTE_MAX, RECEIPT_ACCEPT, RECEIPT_MAX_MB, pixState, receiptError } from '../lib/receipt.js';
import Icon from './Icon.jsx';
import Sheet from './Sheet.jsx';

/** Gera a imagem do QR a partir do "copia e cola". A biblioteca só é baixada quando a tela precisa dela. */
function PixQr({ payload }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(payload, { margin: 1, width: 240, errorCorrectionLevel: 'M' }))
      .then((url) => { if (alive) setSrc(url); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [payload]);
  if (failed) return null;
  return (
    <div className="mx-auto grid size-[200px] place-items-center rounded-2xl bg-white p-2 shadow-sm" aria-busy={!src}>
      {src ? <img src={src} alt="QR code do Pix" width={184} height={184} className="size-[184px]" /> : <span className="text-xs text-muted">Gerando QR…</span>}
    </div>
  );
}

function CopyRow({ label, value, buttonLabel }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sem permissão */ }
  };
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-emerald-900/70">{label}</p>
      <div className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-4">
        <code className="min-w-0 flex-1 truncate text-sm font-semibold">{value}</code>
        <button type="button" onClick={copy} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700">
          <Icon name="copy" className="size-4" />{copied ? 'Copiado!' : buttonLabel}
        </button>
      </div>
    </div>
  );
}

function ReportSheet({ open, onClose, publicId, onReported }) {
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const pick = (e) => {
    const f = e.target.files?.[0] ?? null;
    const msg = receiptError(f);
    setFileErr(msg);
    setFile(msg ? null : f);
    if (msg) e.target.value = '';
  };

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const order = await reportPayment(publicId, { note, file });
      onReported(order);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Já paguei"
      footer={(
        <button type="button" onClick={submit} disabled={busy} className="h-12 w-full rounded-full bg-brand font-bold text-on-brand disabled:opacity-60">
          {busy ? 'Enviando…' : 'Avisar a loja'}
        </button>
      )}
    >
      <div className="space-y-4 p-5">
        <p className="text-sm text-muted">Isso apenas avisa a loja que você pagou. Ela confere o Pix e confirma o recebimento. O comprovante é opcional, mas ajuda a loja a localizar o pagamento.</p>
        <label className="block">
          <span className="text-sm font-bold">Comprovante <span className="font-normal text-muted">(opcional)</span></span>
          <input type="file" accept={RECEIPT_ACCEPT} onChange={pick} className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:font-semibold hover:file:bg-stone-200" />
          <span className="mt-1 block text-xs text-muted">Imagem (JPG, PNG, WEBP) ou PDF, até {RECEIPT_MAX_MB} MB.</span>
          {file && <span className="mt-1 block truncate text-xs font-semibold text-emerald-700">Selecionado: {file.name}</span>}
          {fileErr && <span role="alert" className="mt-1 block text-sm font-medium text-red-600">{fileErr}</span>}
        </label>
        <label className="block">
          <span className="text-sm font-bold">Observação <span className="font-normal text-muted">(opcional)</span></span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={NOTE_MAX} rows={2} placeholder="Ex.: paguei pelo banco do meu irmão, em nome de João"
            className="mt-1 w-full rounded-2xl border border-line p-3 text-sm outline-none focus:border-brand" />
        </label>
        {err && <p role="alert" className="text-sm font-medium text-red-600">{err}</p>}
      </div>
    </Sheet>
  );
}

/**
 * Pagamento por Pix na tela de acompanhamento. `order.payment.pix` vem da API:
 * { key, beneficiary, amountCents, payload (copia e cola, ou null se a chave da loja não gera QR) }.
 */
export default function PixPayment({ order, onOrderChange }) {
  const [open, setOpen] = useState(false);
  const state = pixState(order.payment);
  if (state === 'none') return null;
  const { pix } = order.payment;

  if (state === 'confirmed') {
    return (
      <section className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><Icon name="check" className="size-4" strokeWidth={3} /></span>
        <div>
          <h2 className="font-extrabold text-emerald-900">Pagamento confirmado</h2>
          <p className="text-sm text-emerald-900/80">A loja confirmou o recebimento do seu Pix. Obrigado!</p>
        </div>
      </section>
    );
  }

  if (state === 'reported') {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="font-extrabold text-emerald-900">Pagamento informado</h2>
        <p className="mt-1 text-sm text-emerald-900/80">
          Avisamos a loja que você pagou{order.payment.hasReceipt ? ' e enviamos o comprovante' : ''}. Ela vai conferir e confirmar o recebimento.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
      <h2 className="font-extrabold text-emerald-900">Pagamento via Pix</h2>
      <p className="mt-1 text-sm text-emerald-900/80">
        Você pode pagar agora ou na entrega. Valor: <strong>{formatBRL(pix.amountCents)}</strong>{pix.beneficiary ? ` · para ${pix.beneficiary}` : ''}.
      </p>
      <div className="mt-4 space-y-3">
        {pix.payload && (
          <>
            <PixQr payload={pix.payload} />
            <p className="text-center text-xs text-emerald-900/70">Abra o app do seu banco e escolha pagar com QR code.</p>
            <CopyRow label="Pix copia e cola" value={pix.payload} buttonLabel="Copiar" />
          </>
        )}
        <CopyRow label={pix.payload ? 'Ou use a chave Pix' : 'Chave Pix'} value={pix.key} buttonLabel="Copiar" />
        {!pix.payload && <p className="text-xs text-emerald-900/70">Digite o valor de {formatBRL(pix.amountCents)} ao pagar.</p>}
      </div>
      <button type="button" onClick={() => setOpen(true)} className="mt-4 h-12 w-full rounded-full bg-emerald-600 font-bold text-white hover:bg-emerald-700">Já paguei</button>
      <ReportSheet open={open} onClose={() => setOpen(false)} publicId={order.publicId} onReported={onOrderChange} />
    </section>
  );
}
