const hex = (c) => (/^#[0-9a-f]{6}$/i.test(c ?? '') ? c : null);

function luminance(color) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export const DEFAULT_BRAND = '#b91c1c';

/** Cores da loja com garantia de leitura: se o texto escolhido não contrasta, usa branco/preto. */
export function brandColors(store) {
  const brand = hex(store?.bgColor) ?? DEFAULT_BRAND;
  const wanted = hex(store?.textColor);
  if (wanted && contrast(brand, wanted) >= 3) return { brand, onBrand: wanted };
  return { brand, onBrand: contrast(brand, '#ffffff') >= contrast(brand, '#1c1917') ? '#ffffff' : '#1c1917' };
}
