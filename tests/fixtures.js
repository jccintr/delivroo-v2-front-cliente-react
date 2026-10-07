// Cardápio no formato da API (mesmos dados da loja de exemplo, resumido)
export const pizza = {
  id: 1, categoryId: 1, name: 'Pizza Tradicional', description: '', imageUrl: null,
  variants: [{ id: 1, name: 'Broto', priceCents: 0 }, { id: 2, name: 'Grande', priceCents: 0 }],
  optionGroups: [
    { id: 1, name: 'Sabores', minSelect: 1, maxSelect: 2, maxPerOption: 1, pricingMode: 'HIGHEST', options: [
      { id: 1, name: 'Mussarela', isDefault: false, prices: { 1: 3800, 2: 5800 } },
      { id: 2, name: 'Calabresa', isDefault: false, prices: { 1: 4000, 2: 6000 } },
      { id: 3, name: 'Portuguesa', isDefault: false, prices: { 1: 4400, 2: 6600 } },
    ] },
    { id: 2, name: 'Borda', minSelect: 0, maxSelect: 1, maxPerOption: 1, pricingMode: 'ADDITIVE', options: [
      { id: 4, name: 'Catupiry', isDefault: false, prices: { 1: 800, 2: 1200 } },
    ] },
  ],
};

export const burger = {
  id: 2, categoryId: 2, name: 'X-Bacon', description: '', imageUrl: null,
  variants: [{ id: 3, name: 'Único', priceCents: 3200 }],
  optionGroups: [
    { id: 3, name: 'Ponto da carne', minSelect: 1, maxSelect: 1, maxPerOption: 1, pricingMode: 'ADDITIVE', options: [
      { id: 5, name: 'Ao ponto', isDefault: true, prices: { 3: 0 } },
      { id: 6, name: 'Bem passado', isDefault: false, prices: { 3: 0 } },
    ] },
    { id: 4, name: 'Adicionais', minSelect: 0, maxSelect: 4, maxPerOption: 2, pricingMode: 'ADDITIVE', options: [
      { id: 7, name: 'Bacon extra', isDefault: false, prices: { 3: 500 } },
      { id: 8, name: 'Cheddar extra', isDefault: false, prices: { 3: 400 } },
    ] },
  ],
};

export const soda = {
  id: 3, categoryId: 3, name: 'Refrigerante', description: '', imageUrl: null,
  variants: [{ id: 4, name: 'Lata 350 ml', priceCents: 600 }, { id: 5, name: '2 L', priceCents: 1400 }],
  optionGroups: [],
};

export const menu = {
  store: { slug: 'x', name: 'Loja X', isOpen: true },
  businessHours: [], deliveryZones: [], paymentMethods: [],
  categories: [
    { id: 1, name: 'Pizzas', products: [pizza] },
    { id: 2, name: 'Hambúrgueres', products: [burger] },
    { id: 3, name: 'Bebidas', products: [soda] },
  ],
};
