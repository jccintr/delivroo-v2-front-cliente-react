export const TERMINAL = new Set(['DELIVERED', 'PICKED_UP', 'REJECTED', 'CANCELED', 'RETURNED']);
export const NEGATIVE = new Set(['REJECTED', 'CANCELED', 'RETURNED']);

export const STEP_LABEL = {
  RECEIVED: 'Pedido recebido',
  PREPARING: 'Em preparo',
  READY: 'Pronto para retirada',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  PICKED_UP: 'Retirado',
  REJECTED: 'Pedido recusado',
  CANCELED: 'Pedido cancelado',
  RETURNED: 'Pedido devolvido',
};

export const STEP_HINT = {
  RECEIVED: 'Aguardando a loja confirmar o seu pedido.',
  PREPARING: 'A loja está preparando o seu pedido.',
  READY: 'Já pode vir buscar!',
  OUT_FOR_DELIVERY: 'O entregador está a caminho.',
  DELIVERED: 'Bom apetite!',
  PICKED_UP: 'Bom apetite!',
  REJECTED: 'A loja não pôde aceitar o pedido.',
  CANCELED: 'Este pedido foi cancelado.',
  RETURNED: 'Não foi possível entregar o pedido.',
};

/** Etapas do acompanhamento conforme entrega ou retirada. */
export const stepsFor = (fulfillment) =>
  (fulfillment === 'DELIVERY'
    ? ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']
    : ['RECEIVED', 'PREPARING', 'READY', 'PICKED_UP']);
