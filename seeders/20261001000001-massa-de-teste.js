'use strict';
// Massa de dados: 6 atletas (G, Z, Z, M, M, A), 1 limite semanal e 24 treinos (F, T e E)
// distribuídos em duas semanas: 05–11/10/2026 e 12–18/10/2026.
const { calcularCarga } = require('../src/services/cargaService');

const agora = new Date();

const jogadores = [
  { id: 1, nome: 'Marcos Almeida', posicao: 'G' },
  { id: 2, nome: 'Rafael Costa', posicao: 'Z' },
  { id: 3, nome: 'Bruno Santos', posicao: 'Z' },
  { id: 4, nome: 'Lucas Ferreira', posicao: 'M' },
  { id: 5, nome: 'Diego Ramos', posicao: 'M' },
  { id: 6, nome: 'Thiago Nunes', posicao: 'A' },
];

// [codigo, jogadorId, data (UTC), tipo, duracaoMin, intensidade]
const treinosBase = [
  // ----- Semana 1 (05 a 11/10) -----
  ['TR-001', 1, '2026-10-05T09:00:00Z', 'F', 60, 8], // 72
  ['TR-002', 1, '2026-10-07T09:00:00Z', 'T', 90, 6], // 64,8
  ['TR-003', 2, '2026-10-05T09:00:00Z', 'F', 90, 9], // 121,5
  ['TR-004', 2, '2026-10-06T15:00:00Z', 'T', 60, 7], // 50,4
  ['TR-005', 2, '2026-10-08T09:00:00Z', 'E', 60, 5], // 30
  ['TR-006', 3, '2026-10-06T09:00:00Z', 'T', 60, 6], // 43,2
  ['TR-007', 3, '2026-10-09T09:00:00Z', 'E', 45, 4], // 18
  ['TR-008', 4, '2026-10-05T15:00:00Z', 'F', 90, 10], // 135
  ['TR-009', 4, '2026-10-07T15:00:00Z', 'F', 60, 9], // 81
  ['TR-010', 4, '2026-10-09T15:00:00Z', 'T', 60, 8], // 57,6
  ['TR-011', 5, '2026-10-06T09:00:00Z', 'E', 60, 6], // 36
  ['TR-012', 5, '2026-10-11T10:00:00Z', 'F', 30, 5], // 22,5 (domingo)
  ['TR-013', 6, '2026-10-05T18:00:00Z', 'F', 120, 8], // 144
  ['TR-014', 6, '2026-10-08T18:00:00Z', 'T', 90, 7], // 75,6
  // ----- Semana 2 (12 a 18/10) -----
  ['TR-015', 1, '2026-10-12T09:00:00Z', 'E', 60, 5], // 30
  ['TR-016', 2, '2026-10-13T09:00:00Z', 'F', 60, 6], // 54
  ['TR-017', 3, '2026-10-14T09:00:00Z', 'T', 60, 5], // 36
  ['TR-018', 4, '2026-10-12T15:00:00Z', 'F', 60, 7], // 63
  ['TR-019', 4, '2026-10-15T15:00:00Z', 'E', 60, 6], // 36
  ['TR-020', 5, '2026-10-13T09:00:00Z', 'T', 90, 8], // 86,4
  ['TR-021', 6, '2026-10-12T18:00:00Z', 'F', 60, 9], // 81
  ['TR-022', 6, '2026-10-14T18:00:00Z', 'E', 60, 7], // 42
  ['TR-023', 6, '2026-10-16T18:00:00Z', 'T', 60, 6], // 43,2
  ['TR-024', 5, '2026-10-18T10:00:00Z', 'F', 60, 8], // 72 (domingo)
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'jogadores',
      jogadores.map((j) => ({ ...j, ativo: true, createdAt: agora, updatedAt: agora }))
    );
    await queryInterface.bulkInsert('configuracoes', [
      { cargaMaximaSemanal: 200, dataVigencia: '2026-10-01', createdAt: agora, updatedAt: agora },
    ]);
    await queryInterface.bulkInsert(
      'treinos',
      treinosBase.map(([codigo, jogadorId, data, tipo, duracaoMin, intensidade]) => ({
        codigo,
        jogadorId,
        dataTreino: new Date(data),
        tipo,
        duracaoMin,
        intensidade,
        carga: calcularCarga(duracaoMin, intensidade, tipo),
        createdAt: agora,
        updatedAt: agora,
      }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('treinos', null, {});
    await queryInterface.bulkDelete('configuracoes', null, {});
    await queryInterface.bulkDelete('jogadores', null, {});
  },
};
