const { Op } = require('sequelize');
const { Treino, Jogador } = require('../models');
const AppError = require('../utils/AppError');
const { intervaloDaSemana, parseDataISO, dataCurta } = require('../utils/semana');
const { paraNumero } = require('../utils/numeros');
const { calcularCarga, statusDaCarga } = require('./cargaService');
const { obterLimite } = require('./configuracaoService');
const { buscarJogador } = require('./jogadorService');

// ---------- helpers de validação ----------

function paraInteiro(valor, campo) {
  const n = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor;
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    throw new AppError(`O campo "${campo}" deve ser um número inteiro.`, 400);
  }
  return n;
}

function paraData(valor) {
  if (typeof valor !== 'string' || valor.trim() === '') throw new AppError('Informe "dataTreino" (ex.: 2026-10-05 ou 2026-10-05T18:00:00Z).', 400);
  // Datas/horas sem fuso são interpretadas em UTC, para o resultado não depender do servidor.
  const texto = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(valor) ? `${valor}Z` : valor;
  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) throw new AppError('"dataTreino" inválida. Use o formato ISO 8601.', 400);
  return data;
}

// ---------- carga semanal (agregação sum/count) ----------

/** Carga semanal de um jogador na semana (segunda a domingo) que contém a data de referência. */
async function calcularCargaSemanalJogador(jogadorId, dataReferencia) {
  const { inicio, fim } = intervaloDaSemana(dataReferencia);
  const where = { jogadorId, dataTreino: { [Op.between]: [inicio, fim] } };
  const [soma, quantidade, limite] = await Promise.all([
    Treino.sum('carga', { where }),
    Treino.count({ where }),
    obterLimite(),
  ]);
  const cargaSemanal = Number.isFinite(Number(soma)) ? paraNumero(soma) : 0; // semana sem treinos → 0
  return {
    semana: { inicio: dataCurta(inicio), fim: dataCurta(fim) },
    quantidadeTreinos: quantidade,
    cargaSemanal,
    cargaMaximaSemanal: limite,
    status: statusDaCarga(cargaSemanal, limite),
  };
}

// ---------- funções principais ----------

async function registrarTreino(dados = {}) {
  const { codigo, jogadorId, tipo } = dados;

  // 1) validação de entrada (400)
  if (typeof codigo !== 'string' || codigo.trim() === '') throw new AppError('O código do treino é obrigatório.', 400);
  if (jogadorId === undefined || jogadorId === null) throw new AppError('Informe "jogadorId".', 400);
  const idJogador = paraInteiro(jogadorId, 'jogadorId');
  if (!Treino.TIPOS.includes(tipo)) throw new AppError('Tipo inválido. Use F, T ou E.', 400);
  const duracaoMin = paraInteiro(dados.duracaoMin, 'duracaoMin');
  const intensidade = paraInteiro(dados.intensidade, 'intensidade');
  const dataTreino = paraData(dados.dataTreino);

  // 2) regra de negócio: cálculo (valida duração > 0 e intensidade 1..10)
  const carga = calcularCarga(duracaoMin, intensidade, tipo);

  // 3) jogador deve existir (404) e estar ativo (409)
  const jogador = await buscarJogador(idJogador);
  if (!jogador.ativo) throw new AppError('Não é possível registrar treino para jogador inativo.', 409);

  // 4) código único (409)
  const codigoLimpo = codigo.trim();
  if (await Treino.findOne({ where: { codigo: codigoLimpo } })) {
    throw new AppError('Já existe um treino com este código.', 409);
  }

  const treino = await Treino.create({ codigo: codigoLimpo, jogadorId: idJogador, dataTreino, tipo, duracaoMin, intensidade, carga });

  // 5) devolve o treino já com o acompanhamento da semana do treino
  const cargaSemanal = await calcularCargaSemanalJogador(idJogador, dataTreino);
  return { treino, jogador: { id: jogador.id, nome: jogador.nome, posicao: jogador.posicao }, acompanhamentoSemanal: cargaSemanal };
}

async function listarTreinos({ jogadorId, tipo, dataInicio, dataFim } = {}) {
  const where = {};
  if (jogadorId !== undefined) where.jogadorId = paraInteiro(jogadorId, 'jogadorId');
  if (tipo !== undefined) {
    if (!Treino.TIPOS.includes(tipo)) throw new AppError('Tipo inválido. Use F, T ou E.', 400);
    where.tipo = tipo;
  }
  const inicio = dataInicio !== undefined ? parseDataISO(dataInicio) : null;
  const fim = dataFim !== undefined ? new Date(parseDataISO(dataFim).getTime() + 24 * 3600 * 1000 - 1) : null; // dia inclusive
  if (inicio && fim) {
    if (inicio > fim) throw new AppError('"dataInicio" não pode ser posterior a "dataFim".', 400);
    where.dataTreino = { [Op.between]: [inicio, fim] };
  } else if (inicio) {
    where.dataTreino = { [Op.gte]: inicio };
  } else if (fim) {
    where.dataTreino = { [Op.lte]: fim };
  }

  return Treino.findAll({
    where,
    include: [{ model: Jogador, as: 'jogador', attributes: ['id', 'nome', 'posicao', 'ativo'] }],
    order: [['dataTreino', 'DESC'], ['id', 'DESC']],
  });
}

/** Treinos de um atleta; com ?data=YYYY-MM-DD inclui também o resumo semanal e o status de risco. */
async function listarTreinosDoJogador(id, { data, tipo, dataInicio, dataFim } = {}) {
  const jogador = await buscarJogador(paraInteiro(id, 'id'));
  const treinos = await listarTreinos({ jogadorId: jogador.id, tipo, dataInicio, dataFim });
  const resposta = { jogador: { id: jogador.id, nome: jogador.nome, posicao: jogador.posicao, ativo: jogador.ativo }, total: treinos.length, treinos };
  if (data !== undefined) resposta.acompanhamentoSemanal = await calcularCargaSemanalJogador(jogador.id, data);
  return resposta;
}

async function excluirTreino(codigo) {
  const treino = await Treino.findOne({ where: { codigo } });
  if (!treino) throw new AppError('Treino não encontrado.', 404);
  await treino.destroy();
  return treino;
}

module.exports = { registrarTreino, listarTreinos, listarTreinosDoJogador, excluirTreino, calcularCargaSemanalJogador };
