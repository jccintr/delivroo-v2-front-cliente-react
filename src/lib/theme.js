import { brandColors, DEFAULT_BRAND } from './color.js';

/**
 * Aplica as cores da loja (variáveis CSS --brand / --on-brand e a barra do navegador).
 * `applyBrand(null)` volta para o tema padrão. `root` e `meta` existem para teste.
 */
export function applyBrand(
  store,
  root = document.documentElement,
  meta = document.querySelector('meta[name="theme-color"]'),
) {
  if (!store) {
    root.style.removeProperty('--brand');
    root.style.removeProperty('--on-brand');
    meta?.setAttribute('content', DEFAULT_BRAND);
    return;
  }
  const { brand, onBrand } = brandColors(store);
  root.style.setProperty('--brand', brand);
  root.style.setProperty('--on-brand', onBrand);
  meta?.setAttribute('content', brand);
}
