#!/usr/bin/env bash
# Roteiro de testes manuais (seção 8 do enunciado). Requer a API rodando e o banco com o seed.
# Uso: bash scripts/evidencias.sh > docs/evidencias-requisicoes.md
B=${BASE_URL:-http://localhost:3000}; H='Content-Type: application/json'
r(){ local t="$1"; shift; echo; echo "### $t"; echo '```'; echo "$ $*" | sed "s#$B##"; curl -s -m 10 -w '\n[HTTP %{http_code}]\n' "$@" | python3 -c "
import sys,json,re
t=sys.stdin.read(); m=re.search(r'\n\[HTTP \d+\]\n\$',t)
corpo=t[:m.start()] if m else t; st=t[m.start():].strip() if m else ''
try: corpo=json.dumps(json.loads(corpo),ensure_ascii=False,indent=2)
except Exception: pass
print(corpo); print(st)"; echo '```'; }

echo "# Evidências de requisições e respostas"
echo; echo "Geradas com \`scripts/evidencias.sh\` sobre o banco recém-semeado (\`npm run db:reset\`). Limite semanal: 200."

echo; echo "## 1. Massa de dados (6 atletas, 4 posições, 24 treinos F/T/E)"
r "Listar atletas" "$B/jogadores"
r "Limite semanal configurado" "$B/configuracao"
r "Atualizar limite (PUT) e restaurar para 200" -X PUT "$B/configuracao" -H "$H" -d '{"cargaMaximaSemanal":200,"dataVigencia":"2026-10-01"}'

echo; echo "## 2. Validação manual da carga"
echo; echo "Treino físico, 60 min, intensidade 8 → (60 / 10) × 8 × 1,5 = **72**."
r "Registrar TR-EVID-01" -X POST "$B/treinos" -H "$H" -d '{"codigo":"TR-EVID-01","jogadorId":1,"dataTreino":"2026-10-19T09:00:00Z","tipo":"F","duracaoMin":60,"intensidade":8}'

echo; echo "## 3. Erros esperados"
r "Código duplicado (409)" -X POST "$B/treinos" -H "$H" -d '{"codigo":"TR-EVID-01","jogadorId":1,"dataTreino":"2026-10-19T09:00:00Z","tipo":"F","duracaoMin":60,"intensidade":8}'
r "Intensidade inválida = 11 (400)" -X POST "$B/treinos" -H "$H" -d '{"codigo":"TR-EVID-02","jogadorId":1,"dataTreino":"2026-10-19","tipo":"F","duracaoMin":60,"intensidade":11}'
r "Intensidade inválida = 0 (400)" -X POST "$B/treinos" -H "$H" -d '{"codigo":"TR-EVID-02","jogadorId":1,"dataTreino":"2026-10-19","tipo":"F","duracaoMin":60,"intensidade":0}'
r "Duração não positiva (400)" -X POST "$B/treinos" -H "$H" -d '{"codigo":"TR-EVID-02","jogadorId":1,"dataTreino":"2026-10-19","tipo":"T","duracaoMin":0,"intensidade":5}'
r "Atleta inexistente (404)" -X POST "$B/treinos" -H "$H" -d '{"codigo":"TR-EVID-03","jogadorId":999,"dataTreino":"2026-10-19","tipo":"T","duracaoMin":30,"intensidade":5}'
r "Cadastrar atleta para teste de inativo" -X POST "$B/jogadores" -H "$H" -d '{"nome":"Atleta Inativo","posicao":"G"}'
r "Desativar atleta 7" -X PATCH "$B/jogadores/7/desativar"
r "Treino para atleta inativo (409)" -X POST "$B/treinos" -H "$H" -d '{"codigo":"TR-EVID-04","jogadorId":7,"dataTreino":"2026-10-19","tipo":"T","duracaoMin":30,"intensidade":5}'
r "Posição inválida (400)" -X POST "$B/jogadores" -H "$H" -d '{"nome":"Fulano","posicao":"X"}'
r "Excluir treino inexistente (404)" -X DELETE "$B/treinos/NAO-EXISTE"
r "Excluir treino TR-EVID-01 (200)" -X DELETE "$B/treinos/TR-EVID-01"

echo; echo "## 4. Consultas e filtros"
r "Treinos do atleta 4 com resumo semanal (semana 1 → risco)" "$B/treinos/jogador/4?data=2026-10-05"
r "Treinos do atleta 4 com resumo semanal (semana 2 → dentro do limite)" "$B/treinos/jogador/4?data=2026-10-12"
r "Filtro por tipo=E e atleta=2" "$B/treinos?tipo=E&jogadorId=2"

echo; echo "## 5. Relatório semanal — duas semanas para comparação"
r "Semana 1 (05 a 11/10): 3 atletas em risco" "$B/relatorios/semanal?data=2026-10-05"
r "Semana 2 (12 a 18/10): nenhum em risco" "$B/relatorios/semanal?data=2026-10-14"
r "Semana sem treinos" "$B/relatorios/semanal?data=2026-11-02"
r "Data inválida (400)" "$B/relatorios/semanal?data=2026-13-40"
