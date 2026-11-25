const service = require('../services/treinoService');

exports.registrarTreino = async (req, res, next) => {
  try {
    res.status(201).json(await service.registrarTreino(req.body));
  } catch (err) { next(err); }
};

exports.listarTreinos = async (req, res, next) => {
  try {
    res.status(200).json(await service.listarTreinos(req.query));
  } catch (err) { next(err); }
};

exports.listarTreinosDoJogador = async (req, res, next) => {
  try {
    res.status(200).json(await service.listarTreinosDoJogador(req.params.id, req.query));
  } catch (err) { next(err); }
};

exports.excluirTreino = async (req, res, next) => {
  try {
    await service.excluirTreino(req.params.codigo);
    res.status(200).json({ mensagem: 'Treino excluído com sucesso.' });
  } catch (err) { next(err); }
};
