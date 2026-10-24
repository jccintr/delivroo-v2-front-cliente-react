// Comprovante do "Já paguei": mesmas regras da API (imagem JPG/PNG/WEBP ou PDF, até 5 MB).
// A API confere de novo; aqui é só para avisar logo, sem esperar o envio.
export const RECEIPT_MAX_MB = 5;
export const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const RECEIPT_ACCEPT = RECEIPT_TYPES.join(',');
export const NOTE_MAX = 200;

/** Retorna a mensagem de erro, ou null se o arquivo serve. */
export function receiptError(file) {
  if (!file) return null;
  if (!RECEIPT_TYPES.includes(file.type)) return 'Envie uma imagem (JPG, PNG ou WEBP) ou um PDF.';
  if (file.size > RECEIPT_MAX_MB * 1024 * 1024) return `Arquivo muito grande. Máximo ${RECEIPT_MAX_MB} MB.`;
  return null;
}

/** Estado do pagamento Pix na tela do cliente */
export function pixState(payment) {
  if (payment?.type !== 'PIX' || !payment.pix) return 'none';
  if (payment.confirmedAt) return 'confirmed';
  if (payment.reportedAt) return 'reported';
  return 'pending';
}
