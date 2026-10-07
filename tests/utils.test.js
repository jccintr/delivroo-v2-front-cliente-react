import { describe, expect, it } from 'vitest';
import { formatBRL, parseBRLToCents } from '../src/lib/money.js';
import { isValidPhone, maskPhone, onlyDigits, whatsappLink } from '../src/lib/phone.js';
import { groupHours, nextOpeningText } from '../src/lib/hours.js';
import { brandColors, contrast } from '../src/lib/color.js';
import { stepsFor } from '../src/lib/orderStatus.js';

describe('dinheiro', () => {
  it('formata centavos', () => {
    expect(formatBRL(4590).replace(/\s/g, ' ')).toBe('R$ 45,90');
    expect(formatBRL(0).replace(/\s/g, ' ')).toBe('R$ 0,00');
  });
  it('lê valores digitados', () => {
    expect(parseBRLToCents('100')).toBe(10000);
    expect(parseBRLToCents('45,90')).toBe(4590);
    expect(parseBRLToCents('R$ 1.045,90')).toBe(104590);
    expect(parseBRLToCents('abc')).toBeNull();
    expect(parseBRLToCents('')).toBeNull();
  });
});

describe('telefone', () => {
  it('máscara de celular e fixo', () => {
    expect(maskPhone('35999991234')).toBe('(35) 99999-1234');
    expect(maskPhone('3534211234')).toBe('(35) 3421-1234');
    expect(maskPhone('359')).toBe('(35) 9');
    expect(maskPhone('')).toBe('');
  });
  it('valida e limpa', () => {
    expect(isValidPhone('(35) 99999-1234')).toBe(true);
    expect(isValidPhone('(35) 9999')).toBe(false);
    expect(onlyDigits('(35) 99999-1234')).toBe('35999991234');
  });
  it('link do WhatsApp com DDI do Brasil', () => {
    expect(whatsappLink('(35) 99999-1234')).toBe('https://wa.me/5535999991234');
    expect(whatsappLink('35999991234', 'Oi')).toBe('https://wa.me/5535999991234?text=Oi');
  });
});

describe('horários', () => {
  const hours = [
    { weekday: 2, opensAt: '18:00:00', closesAt: '23:30:00' },
    { weekday: 6, opensAt: '11:30:00', closesAt: '14:30:00' },
    { weekday: 6, opensAt: '18:00:00', closesAt: '23:59:00' },
  ];
  it('agrupa de segunda a domingo', () => {
    const g = groupHours(hours);
    expect(g.map((d) => d.label)[0]).toBe('Segunda-feira');
    expect(g.find((d) => d.weekday === 6).windows).toEqual(['11:30 às 14:30', '18:00 às 23:59']);
    expect(g.find((d) => d.weekday === 1).windows).toEqual([]);
  });
  it('próxima abertura', () => {
    // terça-feira 2026-10-06 às 10:00 (local)
    expect(nextOpeningText(hours, new Date(2026, 9, 6, 10, 0))).toBe('Abre hoje às 18:00');
    // terça às 20:00 -> próxima janela é sábado
    expect(nextOpeningText(hours, new Date(2026, 9, 6, 20, 0))).toBe('Abre sábado às 11:30');
    // segunda às 10:00 -> amanhã
    expect(nextOpeningText(hours, new Date(2026, 9, 5, 10, 0))).toBe('Abre amanhã às 18:00');
    expect(nextOpeningText([], new Date())).toBeNull();
  });
});

describe('cores da loja', () => {
  it('mantém o texto da loja quando contrasta', () => {
    expect(brandColors({ bgColor: '#B91C1C', textColor: '#FFFFFF' })).toEqual({ brand: '#B91C1C', onBrand: '#FFFFFF' });
  });
  it('corrige texto ilegível e usa padrão sem cores', () => {
    expect(brandColors({ bgColor: '#FFFF00', textColor: '#FFFFFF' }).onBrand).toBe('#1c1917');
    expect(brandColors({}).brand).toBe('#b91c1c');
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });
});

describe('etapas do pedido', () => {
  it('entrega x retirada', () => {
    expect(stepsFor('DELIVERY')).toEqual(['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']);
    expect(stepsFor('PICKUP')).toEqual(['RECEIVED', 'PREPARING', 'READY', 'PICKED_UP']);
  });
});
