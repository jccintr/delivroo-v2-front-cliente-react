// localStorage com try/catch (modo privado/bloqueado não pode quebrar o app)
export const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignora */ }
};

export const KEYS = {
  cart: (slug) => `delivroo:cart:${slug}`,
  customer: 'delivroo:customer',
  orders: 'delivroo:orders',
};

/** guarda o pedido no histórico do aparelho (para o cliente achar o acompanhamento depois) */
export function rememberOrder(entry) {
  const list = load(KEYS.orders, []).filter((o) => o.publicId !== entry.publicId);
  save(KEYS.orders, [entry, ...list].slice(0, 20));
}
