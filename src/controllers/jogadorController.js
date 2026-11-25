const service = require('../services/jogadorService');

// Cada handler: async/await + try/catch; erros vão para o errorHandler (status HTTP adequado).
exports.cadastrarJogador = async (req, res, next) => {
  try {
    const jogador = await service.cadastrarJogador(req.body);
    res.status(201).json(jogador);
  } catch (err) { next(err); }
};

exports.listarJogadores = async (req, res, next) => {
  try {
    res.status(200).json(await service.listarJogadores(req.query));
  } catch (err) { next(err); }
};

exports.buscarJogador = async (req, res, next) => {
  try {
    res.status(200).json(await service.buscarJogador(req.params.id));
  } catch (err) { next(err); }
};

exports.atualizarJogador = async (req, res, next) => {
  try {
    res.status(200).json(await service.atualizarJogador(req.params.id, req.body));
  } catch (err) { next(err); }
};

exports.desativarJogador = async (req, res, next) => {
  try {
    const jogador = await service.desativarJogador(req.params.id);
    res.status(200).json({ mensagem: 'Jogador desativado. O histórico de treinos foi preservado.', jogador });
  } catch (err) { next(err); }
};
