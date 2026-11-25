const AppError = require('../utils/AppError');
const { arredondar } = require('../utils/numeros');

// Multiplicador por tipo de treino (regra de negócio, seção 4 do enunciado).
const MULTIPLICADORES = { F: 1.5, T: 1.2, E: 1.0 };

/**
 * Carga do treino = (duração em minutos / 10) × intensidade × multiplicador.
 * Ex.: físico, 60 min, intensidade 8 → (60 / 10) × 8 × 1,5 = 72.
 * Função pura e reutilizável (usada pelo service, pelo seeder e pelos testes).
 */
function calcularCarga(duracaoMin, intensidade, tipo) {
  if (!Number.isInteger(duracaoMin) || duracaoMin <= 0) {
    throw new AppError('A duração deve ser um número inteiro maior que zero.', 400);
  }
  if (!Number.isInteger(intensidade) || intensidade < 1 || intensidade > 10) {
    throw new AppError('A intensidade deve ser um número inteiro de 1 a 10.', 400);
  }
  const multiplicador = MULTIPLICADORES[tipo];
  if (multiplicador === undefined) {
    throw new AppError('Tipo de treino inválido. Use F, T ou E.', 400);
  }
  return arredondar((duracaoMin / 10) * intensidade * multiplicador, 2);
}

const ROTULO_RISCO = 'RISCO DE SOBRECARGA';
const ROTULO_OK = 'DENTRO DO LIMITE';

/** Risco somente quando a carga é ESTRITAMENTE maior que o limite (empate não sinaliza). */
function statusDaCarga(cargaSemanal, limite) {
  return arredondar(cargaSemanal) > arredondar(limite) ? ROTULO_RISCO : ROTULO_OK;
}

module.exports = { MULTIPLICADORES, ROTULO_RISCO, ROTULO_OK, calcularCarga, statusDaCarga };
