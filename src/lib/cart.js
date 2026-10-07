import { priceItem, groupTotal } from './pricing.js';

export const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** Map productId -> produto (com o nome da categoria). */
export function indexProducts(menu) {
  const map = new Map();
  for (const category of menu?.categories ?? []) {
    for (const product of category.products) map.set(product.id, { ...product, categoryName: category.name });
  }
  return map;
}

/** O item do carrinho ainda é válido no cardápio atual? (produto, variação, opções e regras dos grupos) */
export function isItemValid(product, item) {
  if (!product || !product.variants.some((v) => v.id === item.variantId)) return false;
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return false;
  for (const [groupId, byOption] of Object.entries(item.selections ?? {})) {
    const group = product.optionGroups.find((g) => g.id === Number(groupId));
    if (!group) return false;
    for (const optionId of Object.keys(byOption)) if (!group.options.some((o) => o.id === Number(optionId))) return false;
  }
  return product.optionGroups.every((g) => {
    const total = groupTotal(item.selections, g.id);
    return total >= g.minSelect && total <= g.maxSelect;
  });
}

/** Remove do carrinho o que saiu do cardápio (ex.: produto desativado). */
export function reconcileCart(menu, items) {
  const products = indexProducts(menu);
  const valid = items.filter((item) => isItemValid(products.get(item.productId), item));
  return { items: valid, removed: items.length - valid.length };
}

/** Itens do carrinho com preço calculado a partir do cardápio atual. */
export function priceCart(menu, items) {
  const products = indexProducts(menu);
  return items.flatMap((item) => {
    const product = products.get(item.productId);
    if (!product) return [];
    const priced = priceItem({ product, variantId: item.variantId, selections: item.selections, quantity: item.quantity });
    return priced ? [{ item, product, priced }] : [];
  });
}

export const cartSubtotal = (lines) => lines.reduce((sum, l) => sum + l.priced.lineTotalCents, 0);
export const cartCount = (items) => items.reduce((sum, i) => sum + i.quantity, 0);

/** "Grande · Calabresa, Portuguesa · Borda: Cheddar" */
export function describeLine({ priced }) {
  const byGroup = new Map();
  for (const o of priced.options) {
    const label = o.quantity > 1 ? `${o.quantity}x ${o.optionName}` : o.optionName;
    byGroup.set(o.groupName, [...(byGroup.get(o.groupName) ?? []), label]);
  }
  return { variant: priced.variant.name, groups: [...byGroup.entries()].map(([name, list]) => ({ name, list })) };
}
