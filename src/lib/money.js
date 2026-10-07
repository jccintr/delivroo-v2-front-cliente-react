const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 4590 -> "R$ 45,90" */
export const formatBRL = (cents) => brl.format((cents ?? 0) / 100);

/** "45,90" | "45.90" | "R$ 1.045,90" -> 4590 (null se não for número válido) */
export function parseBRLToCents(text) {
  if (text == null) return null;
  const cleaned = String(text).replace(/[^\d,.-]/g, '');
  if (!cleaned) return null;
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
}
