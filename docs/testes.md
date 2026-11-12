# Testes e TDD

Esta parte documenta a estratégia de testes automatizados do projeto, os ciclos de TDD (Red → Green → Refactor) e como executar e demonstrar tudo na apresentação.

## Resumo

| Parte | Ferramentas | Testes | Cobertura (linhas / branches) | Meta mínima |
| --- | --- | --- | --- | --- |
| Back (API) | `node:test` + `tsx` + `fastify.inject` | 120 | 98% / 93% | 90% / 80% |
| Front (React) | Vitest + Testing Library + jsdom | 68 | 98% / 85% | 80% / 80% |

As metas ficam nos scripts `test:coverage`: se a cobertura cair abaixo delas, o comando falha. O workflow `.github/workflows/testes.yml` roda tipos, lint, testes e cobertura do back e do front em cada push na `main` e em cada pull request.

## Como executar

```bash
# API
cd Back
npm ci
npm test                # todos os testes
npm run test:coverage   # testes + relatório de cobertura com meta mínima

# Interface
cd Front
npm ci
npm test                # todos os testes
npm run test:watch      # modo observação, útil durante o TDD
npm run test:coverage   # testes + cobertura (relatório HTML em Front/coverage/)
```

Os testes da API sobem o servidor em memória com `fastify.inject`, sem abrir porta, e usam um diretório temporário próprio para o NeDB e os uploads. Os dados reais em `Back/data` nunca são alterados. Os testes do front simulam a API (`vi.mock`), então não precisam do backend rodando.

## Tipos de teste

**Back (`Back/test/`)**

| Arquivo | Tipo | O que cobre |
| --- | --- | --- |
| `validacao.unit.test.ts` | Unidade | `inteiroPositivo`, `textoPreenchido`, `anoFundacaoValido` e `resolverArquivoDeUpload` |
| `crud-times.test.ts` | Integração HTTP | CRUD de clubes com respostas 201, 200, 204, 400 e 404 |
| `crud-jogadores.test.ts` | Integração HTTP | CRUD de jogadores, upload multipart e bloqueio 409 ao excluir clube com elenco |
| `transferencia-jogador.test.ts` | Integração HTTP | `PATCH` de transferência: 400, 404 e atualização dos dois elencos |
| `edicao-jogador.test.ts` | Integração HTTP | Validação de nome e posição na edição |
| `uploads-seguranca.test.ts` | Segurança | Bloqueio de *path traversal* em `GET /uploads/:file` |
| `erros-internos.test.ts` | Erros | Falhas do banco simuladas com `mock.method` → 500 sem vazar detalhes |
| `api`, `erros-api`, `foto-estadio`, `tecnico`, `validacao-jogador` | Integração HTTP | Fluxos já existentes do grupo |

O helper `test/helpers/app.ts` cria a API de teste, fábricas de clube e jogador, e o corpo multipart. No encerramento, ele espera a fila de gravação do NeDB antes de apagar a pasta temporária, o que evita testes instáveis.

**Front (`Front/src/**/*.test.ts(x)`)**

| Arquivo | O que cobre |
| --- | --- |
| `utils/timeHelpers.test.ts` | Montagem de URLs de imagem e leitura de id |
| `services/api.test.ts` | Escolha entre JSON e `FormData` em `comImagem` |
| `pages/Times.test.tsx` | Listar, cadastrar (JSON e multipart), editar, excluir com confirmação e mostrar erros da API |
| `pages/TimeDetalhes.test.tsx` | Elenco, cadastro, edição, transferência (`PATCH`) e exclusão de jogadores |
| `pages/TecnicoSecao.test.tsx` | Cadastro, edição e exclusão do técnico |
| `App.test.tsx` | Navegação entre a lista de clubes e os detalhes |

## Ciclos de TDD

Cada ciclo tem um commit **Red** (teste novo falhando), um **Green** (código mínimo para passar) e, quando há o que melhorar, um **Refactor** (código reorganizado com os testes ainda verdes). Os três primeiros nasceram de bugs reais encontrados ao testar a API.

| # | Regra | Red | Green | Refactor |
| --- | --- | --- | --- | --- |
| 0 | Idade e camisa devem ser inteiros positivos *(ciclo do grupo)* | `385be46` | `9ec166d` | `949742b` |
| 1 | `GET /uploads/..%2Farquivo` não pode ler arquivos fora da pasta de uploads | `3c7c9b3` | `28e44de` | `2249df8` |
| 2 | `PUT /jogadores/:id` rejeita nome ou posição em branco (antes respondia 200 e ignorava o campo) | `5a1fcc8` | `37b4a0e` | `8a4fc4a` |
| 3 | `PATCH /jogadores/:id` sem `timeId` responde 400 (antes respondia 404 "Time não encontrado") | `4d8bbc7` | `fe14ba2` | `757d094` |
| 4 | Erro 500 responde "Erro interno do servidor", sem a mensagem interna da exceção | `b56edc4` | `f2818ee` | — |

O ciclo 1 corrigiu uma falha de segurança: antes, a rota de uploads devolvia o conteúdo de qualquer arquivo legível do servidor.

### Como demonstrar um ciclo na apresentação

```bash
git log --oneline --reverse main..test/ampliacao-testes   # mostra a sequência red → green → refactor

git checkout 3c7c9b3 -- Back/src                          # volta o código ao estado do RED
cd Back && npx tsx --import ./test/setup.ts --test test/uploads-seguranca.test.ts   # 3 testes falham
cd .. && git checkout HEAD -- Back/src                    # volta ao código atual
cd Back && npm test                                       # tudo passa
```

`git show 28e44de` mostra a correção mínima do Green, e `git show 2249df8` mostra a refatoração.
