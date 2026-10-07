export const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '');

/** máscara brasileira: (35) 99999-1234 / (35) 3421-1234 */
export function maskPhone(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const isValidPhone = (v) => {
  const n = onlyDigits(v).length;
  return n === 10 || n === 11;
};

/** link do WhatsApp (assume Brasil quando não vem DDI) */
export function whatsappLink(phone, text) {
  let d = onlyDigits(phone);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
