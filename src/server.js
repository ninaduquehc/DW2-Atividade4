require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = Number(process.env.PORT) || 3000;

(async () => {
  try {
    // Apenas verifica a conexão. As tabelas são criadas por MIGRATIONS (npm run db:migrate),
    // nunca por sync({ force: true }).
    await sequelize.authenticate();
    console.log('Conexão com o MySQL estabelecida.');
    app.listen(PORT, () => console.log(`API em http://localhost:${PORT}  |  Swagger em http://localhost:${PORT}/api-docs`));
  } catch (err) {
    // Mostra só o tipo do erro: não imprime host, usuário nem senha.
    console.error(`Falha ao conectar ao banco (${err.name}). Verifique o arquivo .env e se o MySQL está ativo.`);
    process.exit(1);
  }
})();
