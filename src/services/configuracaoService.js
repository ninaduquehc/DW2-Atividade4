const { Configuracao } = require('../models');
const AppError = require('../utils/AppError');
const { parseDataISO } = require('../utils/semana');
const { paraNumero } = require('../utils/numeros');

/** Retorna o registro de configuração mais recente (ou null). */
const buscarRegistro = () => Configuracao.findOne({ order: [['id', 'DESC']] });

function formatar(registro) {
  return {
    id: registro.id,
    cargaMaximaSemanal: paraNumero(registro.cargaMaximaSemanal),
    dataVigencia: registro.dataVigencia,
    atualizadoEm: registro.updatedAt,
  };
}

async function consultarConfiguracao() {
  const registro = await buscarRegistro();
  if (!registro) throw new AppError('Limite semanal ainda não configurado. Use PUT /configuracao.', 404);
  return formatar(registro);
}

/** Cadastra (primeira vez) ou atualiza o limite máximo semanal. */
async function atualizarConfiguracao({ cargaMaximaSemanal, dataVigencia } = {}) {
  const limite = Number(cargaMaximaSemanal);
  if (cargaMaximaSemanal === undefined || cargaMaximaSemanal === null || cargaMaximaSemanal === '' || !Number.isFinite(limite) || limite <= 0) {
    throw new AppError('Informe "cargaMaximaSemanal" como um número maior que zero.', 400);
  }
  if (dataVigencia !== undefined && dataVigencia !== null) parseDataISO(dataVigencia);

  const dados = { cargaMaximaSemanal: limite, dataVigencia: dataVigencia ?? null };
  const existente = await buscarRegistro();
  const registro = existente ? await existente.update(dados) : await Configuracao.create(dados);
  return { criado: !existente, configuracao: formatar(registro) };
}

/** Uso interno: devolve o limite numérico ou lança 409 se não houver configuração. */
async function obterLimite() {
  const registro = await buscarRegistro();
  if (!registro) {
    throw new AppError('Configure o limite máximo semanal (PUT /configuracao) antes de usar esta funcionalidade.', 409);
  }
  return paraNumero(registro.cargaMaximaSemanal);
}

module.exports = { consultarConfiguracao, atualizarConfiguracao, obterLimite };
