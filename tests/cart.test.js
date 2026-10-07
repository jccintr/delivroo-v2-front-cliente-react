import { describe, expect, it } from 'vitest';
import { cartCount, cartSubtotal, describeLine, isItemValid, priceCart, reconcileCart } from '../src/lib/cart.js';
import { menu, pizza } from './fixtures.js';

const pizzaItem = { id: 'a', productId: 1, variantId: 2, quantity: 2, notes: '', selections: { 1: { 2: 1, 3: 1 }, 2: { 4: 1 } } };
const burgerItem = { id: 'b', productId: 2, variantId: 3, quantity: 1, notes: '', selections: { 3: { 5: 1 } } };

describe('carrinho', () => {
  it('calcula linhas, subtotal e contagem', () => {
    const lines = priceCart(menu, [pizzaItem, burgerItem]);
    expect(lines).toHaveLength(2);
    expect(cartSubtotal(lines)).toBe(7800 * 2 + 3200);
    expect(cartCount([pizzaItem, burgerItem])).toBe(3);
  });

  it('descreve a linha por grupo', () => {
    const [line] = priceCart(menu, [pizzaItem]);
    expect(describeLine(line)).toEqual({ variant: 'Grande', groups: [{ name: 'Sabores', list: ['Calabresa', 'Portuguesa'] }, { name: 'Borda', list: ['Catupiry'] }] });
  });

  it('item válido / inválido', () => {
    expect(isItemValid(pizza, pizzaItem)).toBe(true);
    expect(isItemValid(pizza, { ...pizzaItem, selections: {} })).toBe(false); // sabor obrigatório
    expect(isItemValid(pizza, { ...pizzaItem, variantId: 99 })).toBe(false);
    expect(isItemValid(pizza, { ...pizzaItem, selections: { 1: { 999: 1 } } })).toBe(false);
    expect(isItemValid(undefined, pizzaItem)).toBe(false);
  });

  it('reconcile tira o que saiu do cardápio', () => {
    const gone = { ...burgerItem, id: 'c', productId: 404 };
    const { items, removed } = reconcileCart(menu, [pizzaItem, gone, burgerItem]);
    expect(removed).toBe(1);
    expect(items.map((i) => i.id)).toEqual(['a', 'b']);
  });
});
