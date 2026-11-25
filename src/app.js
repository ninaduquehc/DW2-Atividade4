const express = require('express');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const swaggerSpec = require('./docs/swagger');
const { errorHandler, naoEncontrado } = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.json({ api: 'Treinos Esportivos - Carga e Risco de Sobrecarga', documentacao: '/api-docs' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'API de Treinos' }));
app.use(routes);

app.use(naoEncontrado);
app.use(errorHandler);

module.exports = app;
