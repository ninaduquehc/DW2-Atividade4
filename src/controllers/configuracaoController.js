const service = require('../services/configuracaoService');

exports.consultarConfiguracao = async (req, res, next) => {
  try {
    res.status(200).json(await service.consultarConfiguracao());
  } catch (err) { next(err); }
};

exports.atualizarConfiguracao = async (req, res, next) => {
  try {
    const { criado, configuracao } = await service.atualizarConfiguracao(req.body);
    res.status(criado ? 201 : 200).json(configuracao);
  } catch (err) { next(err); }
};
