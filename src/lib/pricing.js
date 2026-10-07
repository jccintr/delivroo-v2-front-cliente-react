// Mesmo cálculo do servidor (services/pricing.js da API). Aqui serve só para MOSTRAR o preço enquanto o
// cliente escolhe; o valor que vale é sempre o que a API recalcula ao criar o pedido.
//
// Formato do cardápio (GET /api/public/stores/:slug/menu):
//   product = { id, variants:[{id,name,priceCents}], optionGroups:[{ id, name, minSelect, maxSelect, maxPerOption,
//               pricingMode, options:[{ id, name, prices:{[variantId]:cents} }] }] }
// selections = { [groupId]: { [optionId]: quantidade } }

export const optionPrice = (option, variantId) => option.prices?.[variantId] ?? 0;

export const groupTotal = (selections, groupId) =>
  Object.values(selections?.[groupId] ?? {}).reduce((a, b) => a + b, 0);

/** Preço de uma linha (1 unidade e total) + as opções cobradas. */
export function priceItem({ product, variantId, selections = {}, quantity = 1 }) {
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return null;

  let optionsTotal = 0;
  const lines = [];
  for (const group of product.optionGroups) {
    const chosen = group.options
      .map((o) => ({ option: o, qty: selections[group.id]?.[o.id] ?? 0 }))
      .filter((e) => e.qty > 0)
      .map((e) => ({ ...e, list: optionPrice(e.option, variant.id) }));

    let highestIndex = -1;
    if (group.pricingMode === 'HIGHEST') {
      let best = -1;
      chosen.forEach((e, i) => { if (e.list > best) { best = e.list; highestIndex = i; } });
    }
    chosen.forEach((e, i) => {
      const charged = group.pricingMode === 'HIGHEST' ? (i === highestIndex ? e.list : 0) : e.list * e.qty;
      optionsTotal += charged;
      lines.push({ groupId: group.id, groupName: group.name, optionId: e.option.id, optionName: e.option.name, quantity: e.qty, listPriceCents: e.list, chargedCents: charged });
    });
  }

  return {
    variant,
    unitPriceCents: variant.priceCents,
    optionsTotalCents: optionsTotal,
    unitTotalCents: variant.priceCents + optionsTotal,
    lineTotalCents: (variant.priceCents + optionsTotal) * quantity,
    options: lines,
  };
}

/** Primeiro grupo que ainda não cumpre mínimo/máximo (ou null se está tudo certo). */
export function firstInvalidGroup(product, selections) {
  for (const group of product.optionGroups) {
    const total = groupTotal(selections, group.id);
    if (total < group.minSelect) {
      return { group, message: group.minSelect === 1 && group.maxSelect === 1 ? `Escolha uma opção em "${group.name}"` : `Escolha pelo menos ${group.minSelect} em "${group.name}"` };
    }
    if (total > group.maxSelect) return { group, message: `Escolha no máximo ${group.maxSelect} em "${group.name}"` };
  }
  return null;
}

/** "A partir de": menor preço possível considerando só o que é obrigatório. */
export function fromPrice(product) {
  let best = Infinity;
  for (const variant of product.variants) {
    let total = variant.priceCents;
    for (const group of product.optionGroups) {
      if (group.minSelect < 1 || !group.options.length) continue;
      const prices = group.options.map((o) => optionPrice(o, variant.id)).sort((a, b) => a - b);
      if (group.pricingMode === 'HIGHEST') {
        total += prices[0]; // 1 sabor mais barato
      } else {
        // soma as `minSelect` opções mais baratas (pode repetir a mesma até maxPerOption)
        let need = group.minSelect;
        for (const p of prices) {
          const take = Math.min(group.maxPerOption, need);
          total += p * take;
          need -= take;
          if (need <= 0) break;
        }
      }
    }
    best = Math.min(best, total);
  }
  return Number.isFinite(best) ? best : 0;
}

/** true quando o preço depende de escolhas ou de mais de uma variação (mostra "a partir de"). */
export const hasPriceRange = (product) => product.variants.length > 1 || product.optionGroups.some((g) => g.minSelect >= 1);

/** seleções -> formato da API: options:[{groupId, optionId, quantity}] */
export const toApiOptions = (selections) =>
  Object.entries(selections).flatMap(([groupId, byOption]) =>
    Object.entries(byOption).filter(([, q]) => q > 0).map(([optionId, quantity]) => ({ groupId: Number(groupId), optionId: Number(optionId), quantity })));
