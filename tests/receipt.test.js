import { describe, expect, it } from 'vitest';
import { RECEIPT_MAX_MB, pixState, receiptError } from '../src/lib/receipt.js';

const file = (type, size = 1000) => ({ type, size });

describe('comprovante', () => {
  it('sem arquivo não há erro (é opcional)', () => expect(receiptError(null)).toBeNull());
  it('aceita imagens e PDF', () => {
    for (const t of ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']) expect(receiptError(file(t))).toBeNull();
  });
  it('recusa outros tipos', () => expect(receiptError(file('text/plain'))).toMatch(/imagem/));
  it('recusa arquivo grande demais e aceita o limite exato', () => {
    expect(receiptError(file('image/png', RECEIPT_MAX_MB * 1024 * 1024 + 1))).toMatch(/muito grande/);
    expect(receiptError(file('image/png', RECEIPT_MAX_MB * 1024 * 1024))).toBeNull();
  });
});

describe('estado do Pix na tela', () => {
  const pix = { key: 'k', payload: 'p' };
  it('none: sem Pix, dinheiro ou loja sem chave', () => {
    expect(pixState(undefined)).toBe('none');
    expect(pixState({ type: 'CASH' })).toBe('none');
    expect(pixState({ type: 'PIX', pix: null })).toBe('none');
  });
  it('pending, reported e confirmed (confirmado vence)', () => {
    expect(pixState({ type: 'PIX', pix, reportedAt: null, confirmedAt: null })).toBe('pending');
    expect(pixState({ type: 'PIX', pix, reportedAt: 'x', confirmedAt: null })).toBe('reported');
    expect(pixState({ type: 'PIX', pix, reportedAt: 'x', confirmedAt: 'y' })).toBe('confirmed');
    expect(pixState({ type: 'PIX', pix, reportedAt: null, confirmedAt: 'y' })).toBe('confirmed');
  });
});
