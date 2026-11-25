const { Router } = require('express');
const jogador = require('../controllers/jogadorController');
const configuracao = require('../controllers/configuracaoController');
const treino = require('../controllers/treinoController');
const relatorio = require('../controllers/relatorioController');

const router = Router();

router.post('/jogadores', jogador.cadastrarJogador);
router.get('/jogadores', jogador.listarJogadores);
router.get('/jogadores/:id', jogador.buscarJogador);
router.put('/jogadores/:id', jogador.atualizarJogador);
router.patch('/jogadores/:id/desativar', jogador.desativarJogador);

router.get('/configuracao', configuracao.consultarConfiguracao);
router.put('/configuracao', configuracao.atualizarConfiguracao);

router.post('/treinos', treino.registrarTreino);
router.get('/treinos', treino.listarTreinos);
router.get('/treinos/jogador/:id', treino.listarTreinosDoJogador);
router.delete('/treinos/:codigo', treino.excluirTreino);

router.get('/relatorios/semanal', relatorio.relatorioSemanal);

module.exports = router;
