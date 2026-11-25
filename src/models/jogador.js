const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const POSICOES = ['G', 'Z', 'M', 'A']; // Goleiro, Zagueiro, Meio-campo, Atacante

const Jogador = sequelize.define(
  'Jogador',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notNull: { msg: 'O nome do jogador é obrigatório.' },
        notEmpty: { msg: 'O nome do jogador é obrigatório.' },
        len: { args: [2, 120], msg: 'O nome deve ter entre 2 e 120 caracteres.' },
      },
    },
    posicao: {
      type: DataTypes.ENUM(...POSICOES),
      allowNull: false,
      validate: {
        notNull: { msg: 'A posição é obrigatória (G, Z, M ou A).' },
        isIn: { args: [POSICOES], msg: 'Posição inválida. Use G, Z, M ou A.' },
      },
    },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'jogadores' }
);

Jogador.POSICOES = POSICOES;
module.exports = Jogador;
