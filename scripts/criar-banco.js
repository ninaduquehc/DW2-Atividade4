// Cria o banco de dados (se não existir) usando o próprio Sequelize.
// Uso: npm run db:create
require('dotenv').config();
const { Sequelize } = require('sequelize');

(async () => {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;
  if (!DB_NAME || !DB_USER) {
    console.error('Defina DB_NAME e DB_USER no arquivo .env');
    process.exit(1);
  }
  const conn = new Sequelize('', DB_USER, DB_PASS, {
    host: DB_HOST || 'localhost',
    port: Number(DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
  });
  try {
    // Nome do banco vem do .env; só aceitamos caracteres seguros.
    if (!/^[A-Za-z0-9_]+$/.test(DB_NAME)) throw new Error('DB_NAME inválido');
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Banco "${DB_NAME}" pronto.`);
  } catch (err) {
    console.error('Não foi possível criar o banco:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.close();
  }
})();
