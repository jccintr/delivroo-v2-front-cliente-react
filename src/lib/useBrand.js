import { useEffect } from 'react';
import { applyBrand } from './theme.js';

/**
 * Aplica o tema da loja enquanto o componente está na tela (ex.: acompanhamento do pedido,
 * que fica fora do StoreLayout). Sem cores na loja (API antiga), mantém o tema padrão.
 */
export function useBrand(store) {
  const bgColor = store?.bgColor;
  const textColor = store?.textColor;
  useEffect(() => {
    if (!bgColor && !textColor) return undefined;
    applyBrand({ bgColor, textColor });
    return () => applyBrand(null);
  }, [bgColor, textColor]);
}
