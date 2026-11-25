# Evidências de requisições e respostas

Geradas com `scripts/evidencias.sh` sobre o banco recém-semeado (`npm run db:reset`). Limite semanal: 200.

## 1. Massa de dados (6 atletas, 4 posições, 24 treinos F/T/E)

### Listar atletas
```
$ /jogadores
[
  {
    "id": 3,
    "nome": "Bruno Santos",
    "posicao": "Z",
    "ativo": true,
    "createdAt": "2026-11-23T18:34:58.000Z",
    "updatedAt": "2026-11-23T18:34:58.000Z"
  },
  {
    "id": 5,
    "nome": "Diego Ramos",
    "posicao": "M",
    "ativo": true,
    "createdAt": "2026-11-23T18:34:58.000Z",
    "updatedAt": "2026-11-23T18:34:58.000Z"
  },
  {
    "id": 4,
    "nome": "Lucas Ferreira",
    "posicao": "M",
    "ativo": true,
    "createdAt": "2026-11-23T18:34:58.000Z",
    "updatedAt": "2026-11-23T18:34:58.000Z"
  },
  {
    "id": 1,
    "nome": "Marcos Almeida",
    "posicao": "G",
    "ativo": true,
    "createdAt": "2026-11-23T18:34:58.000Z",
    "updatedAt": "2026-11-23T18:34:58.000Z"
  },
  {
    "id": 2,
    "nome": "Rafael Costa",
    "posicao": "Z",
    "ativo": true,
    "createdAt": "2026-11-23T18:34:58.000Z",
    "updatedAt": "2026-11-23T18:34:58.000Z"
  },
  {
    "id": 6,
    "nome": "Thiago Nunes",
    "posicao": "A",
    "ativo": true,
    "createdAt": "2026-11-23T18:34:58.000Z",
    "updatedAt": "2026-11-23T18:34:58.000Z"
  }
]
[HTTP 200]
```

### Limite semanal configurado
```
$ /configuracao
{
  "id": 1,
  "cargaMaximaSemanal": 200,
  "dataVigencia": "2026-10-01",
  "atualizadoEm": "2026-11-23T18:34:58.000Z"
}
[HTTP 200]
```

### Atualizar limite (PUT) e restaurar para 200
```
$ -X PUT /configuracao -H Content-Type: application/json -d {"cargaMaximaSemanal":200,"dataVigencia":"2026-10-01"}
{
  "id": 1,
  "cargaMaximaSemanal": 200,
  "dataVigencia": "2026-10-01",
  "atualizadoEm": "2026-11-23T18:35:00.814Z"
}
[HTTP 200]
```

## 2. Validação manual da carga

Treino físico, 60 min, intensidade 8 → (60 / 10) × 8 × 1,5 = **72**.

### Registrar TR-EVID-01
```
$ -X POST /treinos -H Content-Type: application/json -d {"codigo":"TR-EVID-01","jogadorId":1,"dataTreino":"2026-10-19T09:00:00Z","tipo":"F","duracaoMin":60,"intensidade":8}
{
  "treino": {
    "carga": 72,
    "id": 25,
    "codigo": "TR-EVID-01",
    "jogadorId": 1,
    "dataTreino": "2026-10-19T09:00:00.000Z",
    "tipo": "F",
    "duracaoMin": 60,
    "intensidade": 8,
    "updatedAt": "2026-11-23T18:35:00.845Z",
    "createdAt": "2026-11-23T18:35:00.845Z"
  },
  "jogador": {
    "id": 1,
    "nome": "Marcos Almeida",
    "posicao": "G"
  },
  "acompanhamentoSemanal": {
    "semana": {
      "inicio": "2026-10-19",
      "fim": "2026-10-25"
    },
    "quantidadeTreinos": 1,
    "cargaSemanal": 72,
    "cargaMaximaSemanal": 200,
    "status": "DENTRO DO LIMITE"
  }
}
[HTTP 201]
```

## 3. Erros esperados

### Código duplicado (409)
```
$ -X POST /treinos -H Content-Type: application/json -d {"codigo":"TR-EVID-01","jogadorId":1,"dataTreino":"2026-10-19T09:00:00Z","tipo":"F","duracaoMin":60,"intensidade":8}
{
  "erro": "Já existe um treino com este código."
}
[HTTP 409]
```

### Intensidade inválida = 11 (400)
```
$ -X POST /treinos -H Content-Type: application/json -d {"codigo":"TR-EVID-02","jogadorId":1,"dataTreino":"2026-10-19","tipo":"F","duracaoMin":60,"intensidade":11}
{
  "erro": "A intensidade deve ser um número inteiro de 1 a 10."
}
[HTTP 400]
```

### Intensidade inválida = 0 (400)
```
$ -X POST /treinos -H Content-Type: application/json -d {"codigo":"TR-EVID-02","jogadorId":1,"dataTreino":"2026-10-19","tipo":"F","duracaoMin":60,"intensidade":0}
{
  "erro": "A intensidade deve ser um número inteiro de 1 a 10."
}
[HTTP 400]
```

### Duração não positiva (400)
```
$ -X POST /treinos -H Content-Type: application/json -d {"codigo":"TR-EVID-02","jogadorId":1,"dataTreino":"2026-10-19","tipo":"T","duracaoMin":0,"intensidade":5}
{
  "erro": "A duração deve ser um número inteiro maior que zero."
}
[HTTP 400]
```

### Atleta inexistente (404)
```
$ -X POST /treinos -H Content-Type: application/json -d {"codigo":"TR-EVID-03","jogadorId":999,"dataTreino":"2026-10-19","tipo":"T","duracaoMin":30,"intensidade":5}
{
  "erro": "Jogador não encontrado."
}
[HTTP 404]
```

### Cadastrar atleta para teste de inativo
```
$ -X POST /jogadores -H Content-Type: application/json -d {"nome":"Atleta Inativo","posicao":"G"}
{
  "ativo": true,
  "id": 7,
  "nome": "Atleta Inativo",
  "posicao": "G",
  "updatedAt": "2026-11-23T18:35:01.024Z",
  "createdAt": "2026-11-23T18:35:01.024Z"
}
[HTTP 201]
```

### Desativar atleta 7
```
$ -X PATCH /jogadores/7/desativar
{
  "mensagem": "Jogador desativado. O histórico de treinos foi preservado.",
  "jogador": {
    "id": 7,
    "nome": "Atleta Inativo",
    "posicao": "G",
    "ativo": false,
    "createdAt": "2026-11-23T18:35:01.000Z",
    "updatedAt": "2026-11-23T18:35:01.059Z"
  }
}
[HTTP 200]
```

### Treino para atleta inativo (409)
```
$ -X POST /treinos -H Content-Type: application/json -d {"codigo":"TR-EVID-04","jogadorId":7,"dataTreino":"2026-10-19","tipo":"T","duracaoMin":30,"intensidade":5}
{
  "erro": "Não é possível registrar treino para jogador inativo."
}
[HTTP 409]
```

### Posição inválida (400)
```
$ -X POST /jogadores -H Content-Type: application/json -d {"nome":"Fulano","posicao":"X"}
{
  "erro": "Dados inválidos.",
  "detalhes": [
    "Posição inválida. Use G, Z, M ou A."
  ]
}
[HTTP 400]
```

### Excluir treino inexistente (404)
```
$ -X DELETE /treinos/NAO-EXISTE
{
  "erro": "Treino não encontrado."
}
[HTTP 404]
```

### Excluir treino TR-EVID-01 (200)
```
$ -X DELETE /treinos/TR-EVID-01
{
  "mensagem": "Treino excluído com sucesso."
}
[HTTP 200]
```

## 4. Consultas e filtros

### Treinos do atleta 4 com resumo semanal (semana 1 → risco)
```
$ /treinos/jogador/4?data=2026-10-05
{
  "jogador": {
    "id": 4,
    "nome": "Lucas Ferreira",
    "posicao": "M",
    "ativo": true
  },
  "total": 5,
  "treinos": [
    {
      "carga": 36,
      "id": 19,
      "codigo": "TR-019",
      "jogadorId": 4,
      "dataTreino": "2026-10-15T15:00:00.000Z",
      "tipo": "E",
      "duracaoMin": 60,
      "intensidade": 6,
      "createdAt": "2026-11-23T18:34:58.000Z",
      "updatedAt": "2026-11-23T18:34:58.000Z",
      "jogador": {
        "id": 4,
        "nome": "Lucas Ferreira",
        "posicao": "M",
        "ativo": true
      }
    },
    {
      "carga": 63,
      "id": 18,
      "codigo": "TR-018",
      "jogadorId": 4,
      "dataTreino": "2026-10-12T15:00:00.000Z",
      "tipo": "F",
      "duracaoMin": 60,
      "intensidade": 7,
      "createdAt": "2026-11-23T18:34:58.000Z",
      "updatedAt": "2026-11-23T18:34:58.000Z",
      "jogador": {
        "id": 4,
        "nome": "Lucas Ferreira",
        "posicao": "M",
        "ativo": true
      }
    },
    {
      "carga": 57.6,
      "id": 10,
      "codigo": "TR-010",
      "jogadorId": 4,
      "dataTreino": "2026-10-09T15:00:00.000Z",
      "tipo": "T",
      "duracaoMin": 60,
      "intensidade": 8,
      "createdAt": "2026-11-23T18:34:58.000Z",
      "updatedAt": "2026-11-23T18:34:58.000Z",
      "jogador": {
        "id": 4,
        "nome": "Lucas Ferreira",
        "posicao": "M",
        "ativo": true
      }
    },
    {
      "carga": 81,
      "id": 9,
      "codigo": "TR-009",
      "jogadorId": 4,
      "dataTreino": "2026-10-07T15:00:00.000Z",
      "tipo": "F",
      "duracaoMin": 60,
      "intensidade": 9,
      "createdAt": "2026-11-23T18:34:58.000Z",
      "updatedAt": "2026-11-23T18:34:58.000Z",
      "jogador": {
        "id": 4,
        "nome": "Lucas Ferreira",
        "posicao": "M",
        "ativo": true
      }
    },
    {
      "carga": 135,
      "id": 8,
      "codigo": "TR-008",
      "jogadorId": 4,
      "dataTreino": "2026-10-05T15:00:00.000Z",
      "tipo": "F",
      "duracaoMin": 90,
      "intensidade": 10,
      "createdAt": "2026-11-23T18:34:58.000Z",
      "updatedAt": "2026-11-23T18:34:58.000Z",
      "jogador": {
        "id": 4,
        "nome": "Lucas Ferreira",
        "posicao": "M",
        "ativo": true
      }
    }
  ],
  "acompanhamentoSemanal": {
    "semana": {
      "inicio": "2026-10-05",
      "fim": "2026-10-11"
    },
    "quantidadeTreinos": 3,
    "cargaSemanal": 273.6,
    "cargaMaximaSemanal": 200,
    "status": "RISCO DE SOBRECARGA"
  }
}
[HTTP 200]
```

### Treinos do atleta 4 com resumo semanal (semana 2 → dentro do limite)
```
$ /treinos/jogador/4?data=2026-10-12
{
  "jogador": {
    "id": 4,
    "nome": "Lucas Ferreira",
    "posicao": "M",
    "ativo": true
  },
  "total": 5,
  "treinos": [
    {
      "carga": 36,
      "id": 19,
      "codigo": "TR-019",
      "jogadorId": 4,
      "dataTreino": "2026-10-15T15:00:00.000Z",
      "tipo": "E",
      "duracaoMin": 60,
      "intensidade": 6,
      "createdAt": "2026-11-23T18:34:58.000Z",
      "updatedAt": "2026-11-23T18:34:58.000Z",
      "jogador": {
        "id": 4,
        "nome": "Lucas Ferreira",
        "posicao": "M",
        "ativo": true
      }
    },
    {
      "carga": 63,
      "id": 18,
      "codigo": "TR-018",
      "jogadorId": 4,
      "dataTreino": "2026-10-12T15:00:00.000Z",
      "tipo": "F",
      "duracaoMin": 60,
      "intensidade": 7,
      "createdAt": "2026-11-23T18:34:58.000Z",
      "updatedAt": "2026-11-23T18:34:58.000Z",
      "jogador": {
        "id": 4,
        "nome": "Lucas Ferreira",
        "posicao": "M",
        "ativo": true
      }
    },
    {
      "carga": 57.6,
      "id": 10,
      "codigo": "TR-010",
      "jogadorId": 4,
      "dataTreino": "2026-10-09T15:00:00.000Z",
      "tipo": "T",
      "duracaoMin": 60,
      "intensidade": 8,
      "createdAt": "2026-11-23T18:34:58.000Z",
      "updatedAt": "2026-11-23T18:34:58.000Z",
      "jogador": {
        "id": 4,
        "nome": "Lucas Ferreira",
        "posicao": "M",
        "ativo": true
      }
    },
    {
      "carga": 81,
      "id": 9,
      "codigo": "TR-009",
      "jogadorId": 4,
      "dataTreino": "2026-10-07T15:00:00.000Z",
      "tipo": "F",
      "duracaoMin": 60,
      "intensidade": 9,
      "createdAt": "2026-11-23T18:34:58.000Z",
      "updatedAt": "2026-11-23T18:34:58.000Z",
      "jogador": {
        "id": 4,
        "nome": "Lucas Ferreira",
        "posicao": "M",
        "ativo": true
      }
    },
    {
      "carga": 135,
      "id": 8,
      "codigo": "TR-008",
      "jogadorId": 4,
      "dataTreino": "2026-10-05T15:00:00.000Z",
      "tipo": "F",
      "duracaoMin": 90,
      "intensidade": 10,
      "createdAt": "2026-11-23T18:34:58.000Z",
      "updatedAt": "2026-11-23T18:34:58.000Z",
      "jogador": {
        "id": 4,
        "nome": "Lucas Ferreira",
        "posicao": "M",
        "ativo": true
      }
    }
  ],
  "acompanhamentoSemanal": {
    "semana": {
      "inicio": "2026-10-12",
      "fim": "2026-10-18"
    },
    "quantidadeTreinos": 2,
    "cargaSemanal": 99,
    "cargaMaximaSemanal": 200,
    "status": "DENTRO DO LIMITE"
  }
}
[HTTP 200]
```

### Filtro por tipo=E e atleta=2
```
$ /treinos?tipo=E&jogadorId=2
[
  {
    "carga": 30,
    "id": 5,
    "codigo": "TR-005",
    "jogadorId": 2,
    "dataTreino": "2026-10-08T09:00:00.000Z",
    "tipo": "E",
    "duracaoMin": 60,
    "intensidade": 5,
    "createdAt": "2026-11-23T18:34:58.000Z",
    "updatedAt": "2026-11-23T18:34:58.000Z",
    "jogador": {
      "id": 2,
      "nome": "Rafael Costa",
      "posicao": "Z",
      "ativo": true
    }
  }
]
[HTTP 200]
```

## 5. Relatório semanal — duas semanas para comparação

### Semana 1 (05 a 11/10): 3 atletas em risco
```
$ /relatorios/semanal?data=2026-10-05
{
  "semana": {
    "inicio": "2026-10-05",
    "fim": "2026-10-11"
  },
  "criterioRanking": "Rankings (maior/menor carga) consideram apenas jogadores com pelo menos um treino na semana. Em caso de empate, todos os empatados são listados.",
  "cargaMaximaSemanal": 200,
  "totalTreinos": 14,
  "jogadoresComTreino": 6,
  "porJogador": [
    {
      "jogadorId": 4,
      "nome": "Lucas Ferreira",
      "posicao": "M",
      "ativo": true,
      "quantidadeTreinos": 3,
      "cargaSemanal": 273.6,
      "status": "RISCO DE SOBRECARGA"
    },
    {
      "jogadorId": 6,
      "nome": "Thiago Nunes",
      "posicao": "A",
      "ativo": true,
      "quantidadeTreinos": 2,
      "cargaSemanal": 219.6,
      "status": "RISCO DE SOBRECARGA"
    },
    {
      "jogadorId": 2,
      "nome": "Rafael Costa",
      "posicao": "Z",
      "ativo": true,
      "quantidadeTreinos": 3,
      "cargaSemanal": 201.9,
      "status": "RISCO DE SOBRECARGA"
    },
    {
      "jogadorId": 1,
      "nome": "Marcos Almeida",
      "posicao": "G",
      "ativo": true,
      "quantidadeTreinos": 2,
      "cargaSemanal": 136.8,
      "status": "DENTRO DO LIMITE"
    },
    {
      "jogadorId": 3,
      "nome": "Bruno Santos",
      "posicao": "Z",
      "ativo": true,
      "quantidadeTreinos": 2,
      "cargaSemanal": 61.2,
      "status": "DENTRO DO LIMITE"
    },
    {
      "jogadorId": 5,
      "nome": "Diego Ramos",
      "posicao": "M",
      "ativo": true,
      "quantidadeTreinos": 2,
      "cargaSemanal": 58.5,
      "status": "DENTRO DO LIMITE"
    }
  ],
  "maiorCargaSemanal": {
    "cargaSemanal": 273.6,
    "empate": false,
    "jogadores": [
      {
        "jogadorId": 4,
        "nome": "Lucas Ferreira",
        "posicao": "M",
        "quantidadeTreinos": 3
      }
    ]
  },
  "menorCargaSemanal": {
    "cargaSemanal": 58.5,
    "empate": false,
    "jogadores": [
      {
        "jogadorId": 5,
        "nome": "Diego Ramos",
        "posicao": "M",
        "quantidadeTreinos": 2
      }
    ]
  },
  "jogadoresEmRisco": {
    "quantidade": 3,
    "jogadores": [
      {
        "jogadorId": 4,
        "nome": "Lucas Ferreira",
        "cargaSemanal": 273.6
      },
      {
        "jogadorId": 6,
        "nome": "Thiago Nunes",
        "cargaSemanal": 219.6
      },
      {
        "jogadorId": 2,
        "nome": "Rafael Costa",
        "cargaSemanal": 201.9
      }
    ]
  },
  "mediaPorTipo": {
    "F": {
      "quantidade": 6,
      "cargaMedia": 96
    },
    "T": {
      "quantidade": 5,
      "cargaMedia": 58.32
    },
    "E": {
      "quantidade": 3,
      "cargaMedia": 28
    }
  },
  "porPosicao": {
    "G": {
      "totalTreinos": 2,
      "cargaMediaPorSessao": 68.4
    },
    "Z": {
      "totalTreinos": 5,
      "cargaMediaPorSessao": 52.62
    },
    "M": {
      "totalTreinos": 5,
      "cargaMediaPorSessao": 66.42
    },
    "A": {
      "totalTreinos": 2,
      "cargaMediaPorSessao": 109.8
    }
  }
}
[HTTP 200]
```

### Semana 2 (12 a 18/10): nenhum em risco
```
$ /relatorios/semanal?data=2026-10-14
{
  "semana": {
    "inicio": "2026-10-12",
    "fim": "2026-10-18"
  },
  "criterioRanking": "Rankings (maior/menor carga) consideram apenas jogadores com pelo menos um treino na semana. Em caso de empate, todos os empatados são listados.",
  "cargaMaximaSemanal": 200,
  "totalTreinos": 10,
  "jogadoresComTreino": 6,
  "porJogador": [
    {
      "jogadorId": 6,
      "nome": "Thiago Nunes",
      "posicao": "A",
      "ativo": true,
      "quantidadeTreinos": 3,
      "cargaSemanal": 166.2,
      "status": "DENTRO DO LIMITE"
    },
    {
      "jogadorId": 5,
      "nome": "Diego Ramos",
      "posicao": "M",
      "ativo": true,
      "quantidadeTreinos": 2,
      "cargaSemanal": 158.4,
      "status": "DENTRO DO LIMITE"
    },
    {
      "jogadorId": 4,
      "nome": "Lucas Ferreira",
      "posicao": "M",
      "ativo": true,
      "quantidadeTreinos": 2,
      "cargaSemanal": 99,
      "status": "DENTRO DO LIMITE"
    },
    {
      "jogadorId": 2,
      "nome": "Rafael Costa",
      "posicao": "Z",
      "ativo": true,
      "quantidadeTreinos": 1,
      "cargaSemanal": 54,
      "status": "DENTRO DO LIMITE"
    },
    {
      "jogadorId": 3,
      "nome": "Bruno Santos",
      "posicao": "Z",
      "ativo": true,
      "quantidadeTreinos": 1,
      "cargaSemanal": 36,
      "status": "DENTRO DO LIMITE"
    },
    {
      "jogadorId": 1,
      "nome": "Marcos Almeida",
      "posicao": "G",
      "ativo": true,
      "quantidadeTreinos": 1,
      "cargaSemanal": 30,
      "status": "DENTRO DO LIMITE"
    }
  ],
  "maiorCargaSemanal": {
    "cargaSemanal": 166.2,
    "empate": false,
    "jogadores": [
      {
        "jogadorId": 6,
        "nome": "Thiago Nunes",
        "posicao": "A",
        "quantidadeTreinos": 3
      }
    ]
  },
  "menorCargaSemanal": {
    "cargaSemanal": 30,
    "empate": false,
    "jogadores": [
      {
        "jogadorId": 1,
        "nome": "Marcos Almeida",
        "posicao": "G",
        "quantidadeTreinos": 1
      }
    ]
  },
  "jogadoresEmRisco": {
    "quantidade": 0,
    "jogadores": []
  },
  "mediaPorTipo": {
    "F": {
      "quantidade": 4,
      "cargaMedia": 67.5
    },
    "T": {
      "quantidade": 3,
      "cargaMedia": 55.2
    },
    "E": {
      "quantidade": 3,
      "cargaMedia": 36
    }
  },
  "porPosicao": {
    "G": {
      "totalTreinos": 1,
      "cargaMediaPorSessao": 30
    },
    "Z": {
      "totalTreinos": 2,
      "cargaMediaPorSessao": 45
    },
    "M": {
      "totalTreinos": 4,
      "cargaMediaPorSessao": 64.35
    },
    "A": {
      "totalTreinos": 3,
      "cargaMediaPorSessao": 55.4
    }
  }
}
[HTTP 200]
```

### Semana sem treinos
```
$ /relatorios/semanal?data=2026-11-02
{
  "semana": {
    "inicio": "2026-11-02",
    "fim": "2026-11-08"
  },
  "criterioRanking": "Rankings (maior/menor carga) consideram apenas jogadores com pelo menos um treino na semana. Em caso de empate, todos os empatados são listados.",
  "cargaMaximaSemanal": 200,
  "totalTreinos": 0,
  "jogadoresComTreino": 0,
  "porJogador": [],
  "maiorCargaSemanal": null,
  "menorCargaSemanal": null,
  "jogadoresEmRisco": {
    "quantidade": 0,
    "jogadores": []
  },
  "mediaPorTipo": {
    "F": {
      "quantidade": 0,
      "cargaMedia": null
    },
    "T": {
      "quantidade": 0,
      "cargaMedia": null
    },
    "E": {
      "quantidade": 0,
      "cargaMedia": null
    }
  },
  "porPosicao": {
    "G": {
      "totalTreinos": 0,
      "cargaMediaPorSessao": null
    },
    "Z": {
      "totalTreinos": 0,
      "cargaMediaPorSessao": null
    },
    "M": {
      "totalTreinos": 0,
      "cargaMediaPorSessao": null
    },
    "A": {
      "totalTreinos": 0,
      "cargaMediaPorSessao": null
    }
  },
  "mensagem": "Nenhum treino registrado nesta semana. Rankings não se aplicam."
}
[HTTP 200]
```

### Data inválida (400)
```
$ /relatorios/semanal?data=2026-13-40
{
  "erro": "Data inválida. Use uma data real no formato YYYY-MM-DD."
}
[HTTP 400]
```
