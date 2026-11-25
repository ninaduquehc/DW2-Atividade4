// Especificação OpenAPI 3.0 exibida em /api-docs (Swagger UI).
const erro = (descricao) => ({ description: descricao, content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } } });
const json = (ref) => ({ 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } });
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 } };

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API de Treinos Esportivos',
    version: '1.0.0',
    description:
      'Gerenciamento de jogadores e treinos com cálculo automático de carga e relatório semanal.\n\n' +
      '**Carga = (duração / 10) × intensidade × multiplicador** (F = 1,5 | T = 1,2 | E = 1,0).\n\n' +
      'Semana: segunda a domingo (UTC). "RISCO DE SOBRECARGA" somente quando a carga semanal for **estritamente maior** que o limite.\n\n' +
      'O indicador de risco é exclusivamente didático e não é diagnóstico nem predição clínica de lesão.',
  },
  tags: [{ name: 'Jogadores' }, { name: 'Configuração' }, { name: 'Treinos' }, { name: 'Relatórios' }],
  paths: {
    '/jogadores': {
      post: {
        tags: ['Jogadores'], summary: 'Cadastrar atleta',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/JogadorEntrada' }, example: { nome: 'Carlos Silva', posicao: 'M' } } } },
        responses: { 201: { description: 'Criado', content: json('Jogador') }, 400: erro('Dados inválidos'), 500: erro('Erro interno') },
      },
      get: {
        tags: ['Jogadores'], summary: 'Listar atletas',
        parameters: [
          { name: 'posicao', in: 'query', schema: { type: 'string', enum: ['G', 'Z', 'M', 'A'] } },
          { name: 'ativo', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Lista de atletas', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Jogador' } } } } }, 400: erro('Filtro inválido') },
      },
    },
    '/jogadores/{id}': {
      get: { tags: ['Jogadores'], summary: 'Consultar atleta', parameters: [idParam], responses: { 200: { description: 'Atleta', content: json('Jogador') }, 404: erro('Não encontrado') } },
      put: {
        tags: ['Jogadores'], summary: 'Atualizar atleta', parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/JogadorEntrada' }, example: { nome: 'Carlos Silva Jr.', posicao: 'A' } } } },
        responses: { 200: { description: 'Atualizado', content: json('Jogador') }, 400: erro('Dados inválidos'), 404: erro('Não encontrado') },
      },
    },
    '/jogadores/{id}/desativar': {
      patch: { tags: ['Jogadores'], summary: 'Desativar atleta (preserva o histórico)', parameters: [idParam], responses: { 200: { description: 'Desativado' }, 404: erro('Não encontrado') } },
    },
    '/configuracao': {
      get: { tags: ['Configuração'], summary: 'Consultar limite máximo semanal', responses: { 200: { description: 'Configuração atual', content: json('Configuracao') }, 404: erro('Ainda não configurado') } },
      put: {
        tags: ['Configuração'], summary: 'Cadastrar/atualizar limite máximo semanal',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ConfiguracaoEntrada' }, example: { cargaMaximaSemanal: 200, dataVigencia: '2026-10-01' } } } },
        responses: { 200: { description: 'Atualizada', content: json('Configuracao') }, 201: { description: 'Criada', content: json('Configuracao') }, 400: erro('Valor inválido') },
      },
    },
    '/treinos': {
      post: {
        tags: ['Treinos'], summary: 'Registrar sessão de treino (calcula e grava a carga)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TreinoEntrada' }, example: { codigo: 'TR-0001', jogadorId: 1, dataTreino: '2026-10-05T09:00:00Z', tipo: 'F', duracaoMin: 60, intensidade: 8 } } } },
        responses: {
          201: { description: 'Criado (carga = 72 neste exemplo) com acompanhamento semanal' },
          400: erro('Intensidade fora de 1–10, duração ≤ 0, tipo inválido etc.'),
          404: erro('Jogador inexistente'),
          409: erro('Código duplicado ou jogador inativo'),
        },
      },
      get: {
        tags: ['Treinos'], summary: 'Listar e filtrar sessões (com dados do jogador)',
        parameters: [
          { name: 'jogadorId', in: 'query', schema: { type: 'integer' } },
          { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['F', 'T', 'E'] } },
          { name: 'dataInicio', in: 'query', schema: { type: 'string', example: '2026-10-05' } },
          { name: 'dataFim', in: 'query', schema: { type: 'string', example: '2026-10-11' } },
        ],
        responses: { 200: { description: 'Lista de treinos' }, 400: erro('Filtro inválido') },
      },
    },
    '/treinos/jogador/{id}': {
      get: {
        tags: ['Treinos'], summary: 'Treinos de um atleta (opcional: resumo semanal com ?data=)',
        parameters: [idParam, { name: 'data', in: 'query', description: 'Qualquer dia da semana desejada', schema: { type: 'string', example: '2026-10-05' } }],
        responses: { 200: { description: 'Treinos do atleta' }, 404: erro('Atleta não encontrado') },
      },
    },
    '/treinos/{codigo}': {
      delete: {
        tags: ['Treinos'], summary: 'Excluir sessão pelo código',
        parameters: [{ name: 'codigo', in: 'path', required: true, schema: { type: 'string', example: 'TR-0001' } }],
        responses: { 200: { description: 'Excluído' }, 404: erro('Treino não encontrado') },
      },
    },
    '/relatorios/semanal': {
      get: {
        tags: ['Relatórios'], summary: 'Relatório semanal de performance',
        parameters: [{ name: 'data', in: 'query', required: true, description: 'Qualquer dia da semana (YYYY-MM-DD)', schema: { type: 'string', example: '2026-10-05' } }],
        responses: { 200: { description: 'Relatório consolidado' }, 400: erro('Data ausente/ inválida'), 409: erro('Limite semanal não configurado') },
      },
    },
  },
  components: {
    schemas: {
      Erro: { type: 'object', properties: { erro: { type: 'string' }, detalhes: { type: 'array', items: { type: 'string' } } } },
      JogadorEntrada: { type: 'object', required: ['nome', 'posicao'], properties: { nome: { type: 'string' }, posicao: { type: 'string', enum: ['G', 'Z', 'M', 'A'] }, ativo: { type: 'boolean' } } },
      Jogador: { type: 'object', properties: { id: { type: 'integer' }, nome: { type: 'string' }, posicao: { type: 'string', enum: ['G', 'Z', 'M', 'A'] }, ativo: { type: 'boolean' }, createdAt: { type: 'string' }, updatedAt: { type: 'string' } } },
      ConfiguracaoEntrada: { type: 'object', required: ['cargaMaximaSemanal'], properties: { cargaMaximaSemanal: { type: 'number' }, dataVigencia: { type: 'string', format: 'date' } } },
      Configuracao: { type: 'object', properties: { id: { type: 'integer' }, cargaMaximaSemanal: { type: 'number' }, dataVigencia: { type: 'string', nullable: true } } },
      TreinoEntrada: {
        type: 'object', required: ['codigo', 'jogadorId', 'dataTreino', 'tipo', 'duracaoMin', 'intensidade'],
        properties: {
          codigo: { type: 'string' }, jogadorId: { type: 'integer' }, dataTreino: { type: 'string' },
          tipo: { type: 'string', enum: ['F', 'T', 'E'] }, duracaoMin: { type: 'integer', minimum: 1 }, intensidade: { type: 'integer', minimum: 1, maximum: 10 },
        },
      },
    },
  },
};
