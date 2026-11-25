const { Jogador } = require('../models');
const AppError = require('../utils/AppError');

const CAMPOS_EDITAVEIS = ['nome', 'posicao', 'ativo'];

const filtrarCampos = (dados = {}) =>
  CAMPOS_EDITAVEIS.reduce((acc, campo) => {
    if (dados[campo] !== undefined) acc[campo] = dados[campo];
    return acc;
  }, {});

function validarAtivo(dados) {
  if (dados.ativo !== undefined && typeof dados.ativo !== 'boolean') {
    throw new AppError('O campo "ativo" deve ser true ou false.', 400);
  }
}

async function cadastrarJogador(dados) {
  const campos = filtrarCampos(dados);
  validarAtivo(campos);
  return Jogador.create(campos); // validações do model (nome, posição)
}

async function listarJogadores({ posicao, ativo } = {}) {
  const where = {};
  if (posicao !== undefined) {
    if (!Jogador.POSICOES.includes(posicao)) throw new AppError('Posição inválida. Use G, Z, M ou A.', 400);
    where.posicao = posicao;
  }
  if (ativo !== undefined) {
    if (!['true', 'false'].includes(String(ativo))) throw new AppError('O filtro "ativo" deve ser true ou false.', 400);
    where.ativo = String(ativo) === 'true';
  }
  return Jogador.findAll({ where, order: [['nome', 'ASC']] });
}

async function buscarJogador(id) {
  const jogador = await Jogador.findByPk(id);
  if (!jogador) throw new AppError('Jogador não encontrado.', 404);
  return jogador;
}

async function atualizarJogador(id, dados) {
  const jogador = await buscarJogador(id);
  const campos = filtrarCampos(dados);
  if (Object.keys(campos).length === 0) {
    throw new AppError('Informe ao menos um campo para atualizar (nome, posicao, ativo).', 400);
  }
  validarAtivo(campos);
  return jogador.update(campos);
}

/** Desativação lógica: o histórico de treinos é preservado. */
async function desativarJogador(id) {
  const jogador = await buscarJogador(id);
  if (jogador.ativo) await jogador.update({ ativo: false });
  return jogador;
}

module.exports = { cadastrarJogador, listarJogadores, buscarJogador, atualizarJogador, desativarJogador };
