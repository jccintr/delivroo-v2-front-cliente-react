import { describe, expect, it } from 'vitest';
import { firstInvalidGroup, fromPrice, groupTotal, hasPriceRange, priceItem, toApiOptions } from '../src/lib/pricing.js';
import { burger, pizza, soda } from './fixtures.js';

describe('priceItem (espelha o servidor)', () => {
  it('pizza meio a meio cobra só o sabor mais caro + borda, pelo preço do tamanho', () => {
    const r = priceItem({ product: pizza, variantId: 2, selections: { 1: { 2: 1, 3: 1 }, 2: { 4: 1 } } });
    expect(r.optionsTotalCents).toBe(6600 + 1200);
    expect(r.lineTotalCents).toBe(7800);
    expect(r.options.find((o) => o.optionName === 'Calabresa').chargedCents).toBe(0);
    expect(r.options.find((o) => o.optionName === 'Portuguesa').chargedCents).toBe(6600);
  });

  it('o mesmo sabor custa menos no Broto', () => {
    expect(priceItem({ product: pizza, variantId: 1, selections: { 1: { 3: 1 } } }).lineTotalCents).toBe(4400);
  });

  it('multiplica pela quantidade do item', () => {
    expect(priceItem({ product: pizza, variantId: 2, selections: { 1: { 1: 1 } }, quantity: 3 }).lineTotalCents).toBe(5800 * 3);
  });

  it('adicionais repetidos somam (2x bacon extra)', () => {
    const r = priceItem({ product: burger, variantId: 3, selections: { 3: { 5: 1 }, 4: { 7: 2, 8: 1 } } });
    expect(r.lineTotalCents).toBe(3200 + 1000 + 400);
  });

  it('produto simples sem grupos usa o preço da variação', () => {
    expect(priceItem({ product: soda, variantId: 5 }).lineTotalCents).toBe(1400);
  });

  it('variação inexistente devolve null', () => {
    expect(priceItem({ product: soda, variantId: 99 })).toBeNull();
  });
});

describe('validação dos grupos', () => {
  it('exige o mínimo', () => {
    expect(firstInvalidGroup(pizza, {}).group.name).toBe('Sabores');
    expect(firstInvalidGroup(burger, {}).message).toBe('Escolha uma opção em "Ponto da carne"');
  });
  it('aceita seleção válida e rejeita acima do máximo', () => {
    expect(firstInvalidGroup(pizza, { 1: { 1: 1 } })).toBeNull();
    expect(firstInvalidGroup(pizza, { 1: { 1: 1, 2: 1, 3: 1 } }).message).toMatch(/no máximo 2/);
  });
  it('groupTotal soma as quantidades', () => {
    expect(groupTotal({ 4: { 7: 2, 8: 1 } }, 4)).toBe(3);
    expect(groupTotal({}, 4)).toBe(0);
  });
});

describe('"a partir de"', () => {
  it('pizza: sabor mais barato do menor tamanho', () => expect(fromPrice(pizza)).toBe(3800));
  it('hambúrguer: preço base (ponto custa 0)', () => expect(fromPrice(burger)).toBe(3200));
  it('refrigerante: menor variação', () => expect(fromPrice(soda)).toBe(600));
  it('mostra faixa de preço só quando faz sentido', () => {
    expect(hasPriceRange(pizza)).toBe(true);
    expect(hasPriceRange(soda)).toBe(true);
    expect(hasPriceRange({ ...soda, variants: [soda.variants[0]] })).toBe(false);
  });
});

describe('toApiOptions', () => {
  it('converte para a lista da API ignorando quantidades zeradas', () => {
    expect(toApiOptions({ 1: { 2: 1, 3: 1 }, 4: { 7: 2, 8: 0 } })).toEqual([
      { groupId: 1, optionId: 2, quantity: 1 }, { groupId: 1, optionId: 3, quantity: 1 }, { groupId: 4, optionId: 7, quantity: 2 },
    ]);
  });
});
