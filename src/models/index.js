const sequelize = require('../config/database');
const Jogador = require('./jogador');
const Treino = require('./treino');
const Configuracao = require('./configuracao');

// Associações obrigatórias: 1 jogador -> N treinos.
// RESTRICT impede apagar um jogador que tenha histórico (o jogador é só desativado).
Jogador.hasMany(Treino, { foreignKey: 'jogadorId', as: 'treinos', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Treino.belongsTo(Jogador, { foreignKey: 'jogadorId', as: 'jogador' });

module.exports = { sequelize, Jogador, Treino, Configuracao };
