const { Sequelize } = require('sequelize');
const configs = require('./config');

const env = process.env.NODE_ENV || 'development';
const { database, username, password, ...options } = configs[env];

// Instância única do Sequelize, compartilhada por todos os models.
const sequelize = new Sequelize(database, username, password, options);

module.exports = sequelize;
