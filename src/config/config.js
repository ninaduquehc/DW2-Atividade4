// Configuração lida tanto pela aplicação quanto pelo Sequelize CLI (.sequelizerc).
// As credenciais vêm SEMPRE de variáveis de ambiente (.env).
require('dotenv').config();

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  // Todas as datas são armazenadas e interpretadas em UTC.
  // Assim a "semana" (segunda a domingo) não muda conforme o fuso do servidor.
  timezone: '+00:00',
  logging: false,
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
