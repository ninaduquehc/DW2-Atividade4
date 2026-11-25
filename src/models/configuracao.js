const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Configuracao = sequelize.define(
  'Configuracao',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cargaMaximaSemanal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'A carga máxima semanal deve ser numérica.' },
        min: { args: [0.01], msg: 'A carga máxima semanal deve ser maior que zero.' },
      },
    },
    dataVigencia: { type: DataTypes.DATEONLY, allowNull: true },
  },
  { tableName: 'configuracoes' }
);

module.exports = Configuracao;
