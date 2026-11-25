// Utilidades de semana (segunda-feira a domingo), sempre em UTC.
const AppError = require('./AppError');

const DIA_MS = 24 * 60 * 60 * 1000;

/** Converte "YYYY-MM-DD" em Date UTC (00:00). Lança AppError(400) se inválida. */
function parseDataISO(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw new AppError('Data inválida. Use o formato YYYY-MM-DD (ex.: 2026-10-05).', 400);
  }
  const d = new Date(`${texto}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== texto) {
    throw new AppError('Data inválida. Use uma data real no formato YYYY-MM-DD.', 400);
  }
  return d;
}

/**
 * Retorna início (segunda 00:00:00.000) e fim (domingo 23:59:59.999) da
 * semana que contém a data informada.
 */
function intervaloDaSemana(data) {
  const d = data instanceof Date ? data : parseDataISO(data);
  const diaSemana = d.getUTCDay(); // 0 = domingo ... 6 = sábado
  const voltarAteSegunda = (diaSemana + 6) % 7;
  const inicio = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - voltarAteSegunda * DIA_MS);
  const fim = new Date(inicio.getTime() + 7 * DIA_MS - 1);
  return { inicio, fim };
}

const dataCurta = (d) => d.toISOString().slice(0, 10);

module.exports = { parseDataISO, intervaloDaSemana, dataCurta };
