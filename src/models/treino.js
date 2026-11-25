const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TIPOS = ['F', 'T', 'E']; // Físico, Técnico, Estratégico

const Treino = sequelize.define(
  'Treino',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: { name: 'uq_treinos_codigo', msg: 'Já existe um treino com este código.' },
      validate: { notEmpty: { msg: 'O código do treino é obrigatório.' } },
    },
    jogadorId: { type: DataTypes.INTEGER, allowNull: false },
    dataTreino: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: { isDate: { args: true, msg: 'Data do treino inválida.' } },
    },
    tipo: {
      type: DataTypes.ENUM(...TIPOS),
      allowNull: false,
      validate: { isIn: { args: [TIPOS], msg: 'Tipo inválido. Use F, T ou E.' } },
    },
    duracaoMin: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'A duração deve ser um número inteiro de minutos.' },
        min: { args: [1], msg: 'A duração deve ser maior que zero.' },
      },
    },
    intensidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'A intensidade deve ser um número inteiro.' },
        min: { args: [1], msg: 'A intensidade deve estar entre 1 e 10.' },
        max: { args: [10], msg: 'A intensidade deve estar entre 1 e 10.' },
      },
    },
    carga: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      // MySQL devolve DECIMAL como string; o getter padroniza a resposta JSON como número.
      get() {
        const v = this.getDataValue('carga');
        return v === null || v === undefined ? v : Number(v);
      },
    },
  },
  { tableName: 'treinos' }
);

Treino.TIPOS = TIPOS;
module.exports = Treino;
