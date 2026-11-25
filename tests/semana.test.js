const test = require('node:test');
const assert = require('node:assert/strict');
const { intervaloDaSemana, parseDataISO, dataCurta } = require('../src/utils/semana');

test('qualquer dia da semana resulta em segunda → domingo', () => {
  for (const dia of ['2026-10-05', '2026-10-07', '2026-10-11']) {
    const { inicio, fim } = intervaloDaSemana(dia);
    assert.equal(dataCurta(inicio), '2026-10-05'); // segunda
    assert.equal(dataCurta(fim), '2026-10-11'); // domingo
  }
});

test('domingo pertence à semana que termina nele; segunda inicia a próxima', () => {
  assert.equal(dataCurta(intervaloDaSemana('2026-10-11').inicio), '2026-10-05');
  assert.equal(dataCurta(intervaloDaSemana('2026-10-12').inicio), '2026-10-12');
});

test('fim da semana é domingo 23:59:59.999 UTC', () => {
  assert.equal(intervaloDaSemana('2026-10-05').fim.toISOString(), '2026-10-11T23:59:59.999Z');
});

test('datas inválidas lançam 400', () => {
  for (const d of ['2026-13-01', '2026-02-30', 'abc', '05/10/2026', undefined]) {
    assert.throws(() => parseDataISO(d), (e) => e.status === 400);
  }
});
