# DW2-Atividade4 — API de Treinos Esportivos (carga e risco de sobrecarga)

API REST em **Node.js + Express + Sequelize + MySQL** para o acompanhamento semanal dos treinos de um clube de futebol: cadastro de atletas, registro de treinos com **cálculo automático da carga**, limite semanal configurável e **relatório semanal de performance**.

> O indicador de risco é **exclusivamente didático**; não é diagnóstico nem predição clínica de lesão.

## Tecnologias
Node.js 18+ · Express · Sequelize 6 (dialeto `mysql`) · mysql2 · dotenv · Sequelize CLI (migrations/seeders) · swagger-ui-express

## Como executar

```bash
# 1. dependências
npm install

# 2. variáveis de ambiente (nunca versionar o .env)
cp .env.example .env        # edite DB_USER, DB_PASS, DB_NAME...

# 3. banco, tabelas e massa de teste
npm run db:create           # cria o banco (CREATE DATABASE IF NOT EXISTS)
npm run db:migrate          # cria as tabelas (migrations)
npm run db:seed             # 6 atletas, limite = 200, 24 treinos em 2 semanas

# 4. subir a API
npm start                   # http://localhost:3000   |  Swagger: http://localhost:3000/api-docs
```

Outros comandos: `npm run db:reset` (desfaz tudo e recria com a massa de teste) · `npm test` (testes unitários da carga e da semana) · `bash scripts/evidencias.sh` (roteiro completo de requisições).

## Estrutura

```
src/
  config/        config.js (lê o .env; usado pela app e pelo CLI) · database.js (instância Sequelize)
  models/        jogador.js · treino.js · configuracao.js · index.js (associações)
  services/      regras de negócio e consultas Sequelize (cargaService, jogadorService, treinoService,
                 configuracaoService, relatorioService)
  controllers/   recebem req/res, chamam services (async/await + try/catch)
  routes/        mapeamento dos endpoints
  middlewares/   errorHandler (status HTTP + mensagens sem detalhes sensíveis)
  utils/         AppError · semana (segunda→domingo, UTC) · numeros
  docs/swagger.js  especificação OpenAPI
migrations/      criação das tabelas (Sequelize CLI)
seeders/         massa de dados de teste
tests/           testes unitários (node:test)
scripts/         criar-banco.js · evidencias.sh
docs/            evidencias-requisicoes.md
```

## Estratégia de criação das tabelas
Usamos **migrations com Sequelize CLI** (opção preferencial do enunciado): o esquema fica versionado, é reproduzível (`db:migrate` / `db:migrate:undo:all`) e **não há `sync({ force: true })` em lugar nenhum**. O `server.js` apenas chama `sequelize.authenticate()` para verificar a conexão. As FKs usam `ON DELETE RESTRICT`, então um jogador com histórico nunca é apagado — ele é só **desativado** (`ativo = false`).

## Modelo de dados
| Model | Atributos | Observações |
|---|---|---|
| **Jogador** | id, nome, posicao (`G`,`Z`,`M`,`A`), ativo | `Jogador.hasMany(Treino)` |
| **Treino** | id, codigo (UNIQUE), jogadorId (FK), dataTreino, tipo (`F`,`T`,`E`), duracaoMin, intensidade, carga | `Treino.belongsTo(Jogador)` |
| **Configuracao** | id, cargaMaximaSemanal, dataVigencia (opcional) | guarda o limite semanal |

Validações no model: nome obrigatório, posição/tipo válidos (ENUM + `isIn`), duração inteira ≥ 1, intensidade inteira de 1 a 10, `codigo` único.

## Regras de negócio
`carga = (duracaoMin / 10) × intensidade × multiplicador` — **F = 1,5 · T = 1,2 · E = 1,0** (ex.: F, 60 min, int. 8 → **72**).
A carga semanal é a soma das cargas de **segunda a domingo** (UTC). **RISCO DE SOBRECARGA** somente quando a soma for **estritamente maior** que o limite (empate não sinaliza). Implementado em `src/services/cargaService.js` (`calcularCarga`, `statusDaCarga`).

## Endpoints
| Método | Rota | Finalidade | Status |
|---|---|---|---|
| POST | `/jogadores` | Cadastrar atleta | 201, 400 |
| GET | `/jogadores` (`?posicao=&ativo=`) | Listar | 200, 400 |
| GET | `/jogadores/:id` | Consultar | 200, 404 |
| PUT | `/jogadores/:id` | Atualizar (`nome`, `posicao`, `ativo`) | 200, 400, 404 |
| PATCH | `/jogadores/:id/desativar` | Desativar (mantém histórico) | 200, 404 |
| GET / PUT | `/configuracao` | Consultar / cadastrar-atualizar limite | 200, 201, 400, 404 |
| POST | `/treinos` | Registrar sessão (calcula e grava a carga; devolve o acompanhamento da semana) | 201, 400, 404, 409 |
| GET | `/treinos` (`?jogadorId=&tipo=&dataInicio=&dataFim=`) | Listar com dados do jogador | 200, 400 |
| GET | `/treinos/jogador/:id` (`?data=` opcional) | Treinos do atleta (+ resumo semanal) | 200, 404 |
| DELETE | `/treinos/:codigo` | Excluir pelo código | 200, 404 |
| GET | `/relatorios/semanal?data=YYYY-MM-DD` | Relatório da semana que contém a data | 200, 400, 409 |

Códigos: **400** dado inválido (intensidade fora de 1–10, duração ≤ 0, tipo/posição/data inválidos) · **404** não encontrado · **409** conflito (código duplicado, treino para atleta **inativo**, limite não configurado no relatório) · **500** erro interno genérico.

## Relatório semanal
Retorna: total de treinos; carga e nº de treinos **por jogador** (com status); **maior** e **menor** carga (com nome, posição, total e nº de treinos); **jogadores em risco**; **média por tipo** (F, T, E); **por posição** (total de treinos e carga média por sessão).

Decisões documentadas:
- **Critério de ranking:** só entram jogadores com ao menos um treino na semana (o critério também vem no JSON em `criterioRanking`).
- **Empates:** todos os empatados são listados e `empate: true`.
- **Semana sem treinos:** zeros, rankings `null`, médias `null` e uma `mensagem` explicativa (HTTP 200).
- **Tipos/posições sem sessões:** F, T, E e G, Z, M, A aparecem sempre, com quantidade 0 e média `null`.
- Atletas **inativos** com treinos na semana continuam no relatório (histórico preservado).

## Onde o Sequelize e o async/await foram usados
- **Conexão/configuração:** `src/config/database.js` (`new Sequelize(..., { dialect: 'mysql' })`) com credenciais do `.env`.
- **Models e validações:** `src/models/*.js` (`sequelize.define`, `DataTypes`, `validate`); **associações** em `src/models/index.js` (`hasMany` / `belongsTo`).
- **CRUD (`await` em todos):** `Model.create` (cadastrar jogador, registrar treino), `findAll` (listar jogadores/treinos, com `include` + `where`), `findByPk` (consultar jogador), `findOne` (código duplicado, treino por código, configuração), `instância.update` (atualizar/desativar jogador, configuração), `instância.destroy` (excluir treino).
- **Agregações:** `Treino.sum` e `Treino.count` (carga semanal e total); no relatório, `findAll` com `fn('SUM'|'COUNT'|'AVG')`, `col`, `group`, `include` do jogador e `Op.between` na data (`relatorioService.js`).
- **async/await + try/catch:** services e controllers são `async`; cada controller faz `try { await service... } catch (err) { next(err) }` e o `errorHandler` converte o erro em status HTTP. No relatório, as 4 consultas independentes rodam em paralelo com `await Promise.all([...])`.
- **Sem SQL escrito à mão** nas funcionalidades (o único `CREATE DATABASE` está no script utilitário `criar-banco.js`).

## Segurança e tratamento de falhas
Credenciais só no `.env` (ignorado pelo Git; `.env.example` sem senhas). O `errorHandler` nunca devolve mensagens de banco, SQL ou stack trace — erros inesperados viram `500 {"erro":"Erro interno do servidor."}` e o log mostra apenas o tipo do erro. Com o banco fora do ar, a API responde 500 genérico e o log não contém host, usuário nem senha.

## Testes
- **Automatizados:** `npm test` — fórmula da carga (exemplo = 72), multiplicadores, intensidade/duração/tipo inválidos, empate não sinaliza risco, fronteiras da semana segunda→domingo.
- **Manuais (seção 8 do enunciado):** `docs/evidencias-requisicoes.md` traz as requisições/respostas (6 atletas nas 4 posições, 24 treinos F/T/E, limite 200 → semana 1 com 3 atletas acima e 3 abaixo, semana 2 com todos abaixo, código duplicado, intensidade/duração inválidas, atleta inexistente e inativo, semana sem treinos).
- **Evidências no Swagger:** abra `/api-docs`, execute as chamadas (*Try it out*) e tire os prints para o entregável.

## Datas e fuso
Datas são armazenadas e interpretadas em **UTC** (`timezone: '+00:00'`). `dataTreino` aceita `2026-10-05`, `2026-10-05T18:00:00Z` ou sem fuso (tratada como UTC). Assim a fronteira da semana não depende do fuso do servidor.
