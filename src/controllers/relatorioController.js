const service = require('../services/relatorioService');

exports.relatorioSemanal = async (req, res, next) => {
  try {
    res.status(200).json(await service.gerarRelatorioSemanal(req.query.data));
  } catch (err) { next(err); }
};
