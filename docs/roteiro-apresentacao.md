# Roteiro da apresentação final (15 a 20 minutos)

Distribuam as falas entre todos os integrantes e ensaiem com o backend e o frontend em execução local. Confirmem com o professor a aprovação do tema e das tecnologias.

| Tempo sugerido | Conteúdo | Demonstração |
| --- | --- | --- |
| 2 min | Problema, público-alvo e objetivo | Tela inicial |
| 3 min | Arquitetura: React → Fastify → NeDB | Explicar `Front/src/services/api.ts`, rotas e arquivos de dados |
| 4 min | CRUD dos clubes e jogadores | Cadastrar, editar, consultar e excluir dados de teste |
| 2 min | Dois endpoints e JSON | `GET /times` e `POST /times` com curl ou cliente HTTP |
| 3 min | TDD e testes | Mostrar os três commits e executar `npm test` |
| 2 min | Git, branches e colaboração | Mostrar histórico, autores e integração da branch |
| 2 min | Dificuldades e melhorias futuras | Persistência em hospedagem sem disco, validações e responsividade |

## Demonstração de endpoints

1. `GET http://localhost:3000/times`: mostrar resposta `200` com `sucesso: true` e a lista em `dados`.
2. `POST http://localhost:3000/times` com JSON `{ "nome": "Time Demo", "estadio": "Arena Demo", "anoFundacao": 2000 }`: mostrar `201` e o `_id` retornado. Depois, excluir o clube de demonstração.

Os comandos `curl` completos e o formato dos erros estão em [Back/README.md](../Back/README.md).

## Demonstração do ciclo Red, Green e Refactor

1. **Red — `385be46`:** o teste novo exigiu `400` para idade `0`, enquanto a API respondeu `201`; o teste falhou.
2. **Green — `9ec166d`:** a validação mínima no cadastro e na edição fez os testes passarem.
3. **Refactor — `949742b`:** a checagem duplicada foi extraída para uma função compartilhada, mantendo os testes passando.

Mostrem `git log --oneline` e `git show` de cada commit. Executem `npm test` dentro de `Back`, depois `npm run typecheck`. Também há testes de entradas inválidas e respostas `400`, `404` e `409`.

## Antes da apresentação

- [ ] Confirmar com o professor o tema e as tecnologias escolhidas.
- [ ] Definir quem apresenta cada parte e garantir participação de todos.
- [ ] Integrar e publicar a branch com os commits de TDD no repositório remoto.
- [ ] Testar o CRUD com dados de demonstração no ambiente que será usado na sala.
- [ ] Verificar se o armazenamento do backend publicado persiste novos dados; se não, demonstrar o CRUD localmente.
