// Em dev, VITE_API_URL fica vazio e o Vite faz proxy de /api. Em produção aponte para a API (ex.: https://api.delivroo.app.br).
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = extra.code;
    this.details = extra.details;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, 'Sem conexão. Verifique sua internet e tente novamente.');
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error ?? 'Não foi possível concluir. Tente novamente.', body ?? {});
  return body;
}

export const getMenu = (slug, signal) => request(`/api/public/stores/${encodeURIComponent(slug)}/menu`, { signal });

export const createOrder = (slug, payload) =>
  request(`/api/public/stores/${encodeURIComponent(slug)}/orders`, { method: 'POST', body: JSON.stringify(payload) });

export const getOrder = (publicId, signal) => request(`/api/public/orders/${encodeURIComponent(publicId)}`, { signal });
