import { describe, expect, it } from 'vitest';
import { ApiError, isMenuUnavailable } from '../src/api/client.js';

describe('cardápio indisponível', () => {
  it('reconhece 403 + MENU_UNAVAILABLE (loja bloqueada ou suspensa)', () => {
    expect(isMenuUnavailable(new ApiError(403, 'Cardápio indisponível.', { code: 'MENU_UNAVAILABLE' }))).toBe(true);
  });
  it('não confunde com loja inexistente, outros 403 ou erros comuns', () => {
    expect(isMenuUnavailable(new ApiError(404, 'Loja não encontrada(a).'))).toBe(false);
    expect(isMenuUnavailable(new ApiError(403, 'Proibido', { code: 'OUTRO' }))).toBe(false);
    expect(isMenuUnavailable(new ApiError(0, 'Sem conexão'))).toBe(false);
    expect(isMenuUnavailable(new Error('x'))).toBe(false);
    expect(isMenuUnavailable(null)).toBe(false);
  });
});
