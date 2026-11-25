const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const AppError = require('../utils/AppError');

// Rota inexistente
const naoEncontrado = (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' });

// Tratamento central de erros: nunca devolve detalhes de banco, credenciais ou stack trace.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.message, ...(err.detalhes && { detalhes: err.detalhes }) });
  }
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({ erro: 'Registro duplicado: já existe um item com este valor único (ex.: código do treino).' });
  }
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(409).json({ erro: 'Operação conflita com registros relacionados.' });
  }
  if (err instanceof ValidationError) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: err.errors.map((e) => e.message) });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }
  // Erro inesperado: registra só o nome/mensagem no servidor (sem dados de conexão) e responde genérico.
  console.error(`[ERRO] ${req.method} ${req.originalUrl} -> ${err.name}`);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { errorHandler, naoEncontrado };
