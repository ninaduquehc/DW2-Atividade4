const { Op, fn, col } = require('sequelize');
const { Treino, Jogador } = require('../models');
const AppError = require('../utils/AppError');
const { intervaloDaSemana, parseDataISO, dataCurta } = require('../utils/semana');
const { arredondar, paraNumero } = require('../utils/numeros');
const { statusDaCarga, ROTULO_RISCO } = require('./cargaService');
const { obterLimite } = require('./configuracaoService');

const CRITERIO_RANKING =
  'Rankings (maior/menor carga) consideram apenas jogadores com pelo menos um treino na semana. Em caso de empate, todos os empatados são listados.';

/**
 * Relatório semanal. Todas as consultas usam Sequelize (include + where + Op.between + group + agregações).
 * As quatro consultas independentes rodam em paralelo com Promise.all (async/await).
 */
async function gerarRelatorioSemanal(dataReferencia) {
  if (!dataReferencia) throw new AppError('Informe a data de referência: ?data=YYYY-MM-DD.', 400);
  parseDataISO(dataReferencia); // valida formato (400)
  const { inicio, fim } = intervaloDaSemana(dataReferencia);
  const limite = await obterLimite(); // 409 se não houver configuração

  const where = { dataTreino: { [Op.between]: [inicio, fim] } };

  const [totalTreinos, porJogadorBruto, porTipoBruto, porPosicaoBruto] = await Promise.all([
    // COUNT(*) da semana
    Treino.count({ where }),

    // Carga semanal e nº de treinos por jogador: JOIN + GROUP BY + SUM/COUNT
    Treino.findAll({
      attributes: [
        'jogadorId',
        [fn('COUNT', col('Treino.id')), 'quantidadeTreinos'],
        [fn('SUM', col('Treino.carga')), 'cargaSemanal'],
      ],
      include: [{ model: Jogador, as: 'jogador', attributes: ['nome', 'posicao', 'ativo'] }],
      where,
      group: ['Treino.jogadorId', 'jogador.id', 'jogador.nome', 'jogador.posicao', 'jogador.ativo'],
      raw: true,
      nest: true,
    }),

    // Carga média por tipo de treino: GROUP BY tipo + AVG
    Treino.findAll({
      attributes: ['tipo', [fn('COUNT', col('id')), 'quantidade'], [fn('AVG', col('carga')), 'cargaMedia']],
      where,
      group: ['tipo'],
      raw: true,
    }),

    // Por posição: JOIN com jogador, GROUP BY posição, COUNT e AVG por sessão
    Treino.findAll({
      attributes: [
        [col('jogador.posicao'), 'posicao'],
        [fn('COUNT', col('Treino.id')), 'totalTreinos'],
        [fn('AVG', col('Treino.carga')), 'cargaMediaPorSessao'],
      ],
      include: [{ model: Jogador, as: 'jogador', attributes: [] }],
      where,
      group: [col('jogador.posicao')],
      raw: true,
    }),
  ]);

  // ----- por jogador (ordenado por carga desc, depois nome) -----
  const porJogador = porJogadorBruto
    .map((l) => {
      const cargaSemanal = paraNumero(l.cargaSemanal);
      return {
        jogadorId: l.jogadorId,
        nome: l.jogador.nome,
        posicao: l.jogador.posicao,
        ativo: Boolean(l.jogador.ativo),
        quantidadeTreinos: Number(l.quantidadeTreinos),
        cargaSemanal,
        status: statusDaCarga(cargaSemanal, limite),
      };
    })
    .sort((a, b) => b.cargaSemanal - a.cargaSemanal || a.nome.localeCompare(b.nome));

  // ----- rankings com tratamento de empates -----
  const montarRanking = (valorAlvo) => {
    const jogadores = porJogador
      .filter((j) => j.cargaSemanal === valorAlvo)
      .map(({ jogadorId, nome, posicao, quantidadeTreinos }) => ({ jogadorId, nome, posicao, quantidadeTreinos }));
    return { cargaSemanal: valorAlvo, empate: jogadores.length > 1, jogadores };
  };
  const semTreinos = porJogador.length === 0;
  const maiorCargaSemanal = semTreinos ? null : montarRanking(porJogador[0].cargaSemanal);
  const menorCargaSemanal = semTreinos ? null : montarRanking(porJogador[porJogador.length - 1].cargaSemanal);

  // ----- jogadores em risco (estritamente acima do limite) -----
  const emRisco = porJogador.filter((j) => j.status === ROTULO_RISCO);

  // ----- média por tipo (sempre F, T e E; tipo sem sessões → quantidade 0 e média null) -----
  const mediaPorTipo = { F: { quantidade: 0, cargaMedia: null }, T: { quantidade: 0, cargaMedia: null }, E: { quantidade: 0, cargaMedia: null } };
  porTipoBruto.forEach((t) => {
    mediaPorTipo[t.tipo] = { quantidade: Number(t.quantidade), cargaMedia: arredondar(t.cargaMedia) };
  });

  // ----- por posição (sempre G, Z, M e A) -----
  const porPosicao = {};
  Jogador.POSICOES.forEach((p) => {
    porPosicao[p] = { totalTreinos: 0, cargaMediaPorSessao: null };
  });
  porPosicaoBruto.forEach((p) => {
    porPosicao[p.posicao] = { totalTreinos: Number(p.totalTreinos), cargaMediaPorSessao: arredondar(p.cargaMediaPorSessao) };
  });

  return {
    semana: { inicio: dataCurta(inicio), fim: dataCurta(fim) },
    criterioRanking: CRITERIO_RANKING,
    cargaMaximaSemanal: limite,
    totalTreinos,
    jogadoresComTreino: porJogador.length,
    porJogador,
    maiorCargaSemanal,
    menorCargaSemanal,
    jogadoresEmRisco: { quantidade: emRisco.length, jogadores: emRisco.map((j) => ({ jogadorId: j.jogadorId, nome: j.nome, cargaSemanal: j.cargaSemanal })) },
    mediaPorTipo,
    porPosicao,
    ...(semTreinos && { mensagem: 'Nenhum treino registrado nesta semana. Rankings não se aplicam.' }),
  };
}

module.exports = { gerarRelatorioSemanal };
