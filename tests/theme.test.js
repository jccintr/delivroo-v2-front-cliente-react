import { describe, expect, it } from 'vitest';
import { applyBrand } from '../src/lib/theme.js';
import { DEFAULT_BRAND } from '../src/lib/color.js';

const fakeDom = () => {
  const vars = {};
  const meta = { content: null, setAttribute(k, v) { if (k === 'content') this.content = v; } };
  const root = { style: { setProperty: (k, v) => { vars[k] = v; }, removeProperty: (k) => { delete vars[k]; } } };
  return { vars, root, meta };
};

describe('tema da loja', () => {
  it('aplica a cor da loja e o texto com contraste', () => {
    const { vars, root, meta } = fakeDom();
    applyBrand({ bgColor: '#FF6B35', textColor: '#FFFFFF' }, root, meta);
    expect(vars['--brand']).toBe('#FF6B35');
    expect(vars['--on-brand']).toBeTruthy();
    expect(meta.content).toBe('#FF6B35');
  });

  it('texto sem contraste cai para branco/preto legível', () => {
    const { vars, root, meta } = fakeDom();
    applyBrand({ bgColor: '#FFFF00', textColor: '#FFFFAA' }, root, meta);
    expect(vars['--on-brand']).toBe('#1c1917');
  });

  it('applyBrand(null) volta ao padrão', () => {
    const { vars, root, meta } = fakeDom();
    applyBrand({ bgColor: '#FF6B35' }, root, meta);
    applyBrand(null, root, meta);
    expect(vars['--brand']).toBeUndefined();
    expect(vars['--on-brand']).toBeUndefined();
    expect(meta.content).toBe(DEFAULT_BRAND);
  });
});
