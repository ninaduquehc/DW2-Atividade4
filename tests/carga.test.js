const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularCarga, statusDaCarga } = require('../src/services/cargaService');

test('exemplo do enunciado: físico, 60 min, intensidade 8 = 72', () => {
  assert.equal(calcularCarga(60, 8, 'F'), 72);
});

test('multiplicadores por tipo', () => {
  assert.equal(calcularCarga(60, 5, 'T'), 36); // 6 × 5 × 1,2
  assert.equal(calcularCarga(60, 5, 'E'), 30); // 6 × 5 × 1,0
  assert.equal(calcularCarga(90, 6, 'T'), 64.8); // sem erro de ponto flutuante
});

test('intensidade fora de 1..10 é rejeitada com 400', () => {
  for (const i of [0, 11, -1, 5.5]) {
    assert.throws(() => calcularCarga(60, i, 'F'), (e) => e.status === 400);
  }
});

test('duração não positiva é rejeitada com 400', () => {
  for (const d of [0, -10, 12.5]) {
    assert.throws(() => calcularCarga(d, 5, 'F'), (e) => e.status === 400);
  }
});

test('tipo inválido é rejeitado com 400', () => {
  assert.throws(() => calcularCarga(60, 5, 'X'), (e) => e.status === 400);
});

test('risco somente quando estritamente maior que o limite (empate não sinaliza)', () => {
  assert.equal(statusDaCarga(200, 200), 'DENTRO DO LIMITE');
  assert.equal(statusDaCarga(200.01, 200), 'RISCO DE SOBRECARGA');
  assert.equal(statusDaCarga(199.99, 200), 'DENTRO DO LIMITE');
});
