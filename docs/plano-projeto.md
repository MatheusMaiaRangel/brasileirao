# Plano do projeto: Central do Brasileirão

## Problema e público-alvo

Informações de clubes e elencos ficam dispersas e são difíceis de manter atualizadas. A aplicação permite que um responsável pelo cadastro consulte, inclua, edite e remova clubes e jogadores em uma interface web. O tema é uma proposta própria do grupo e deve ser confirmado com o professor.

## Requisitos funcionais

1. Cadastrar, listar, consultar, editar e excluir clubes.
2. Cadastrar, listar, editar e excluir jogadores vinculados a clubes existentes.
3. Consultar o elenco de cada clube e transferir um jogador entre clubes.
4. Impedir a exclusão de um clube que ainda possui jogadores.
5. Validar os dados recebidos e apresentar mensagens de sucesso ou erro na interface.
6. Permitir imagens opcionais de clubes e jogadores.

## Modelo de dados

| Entidade | Campos principais | Relação |
| --- | --- | --- |
| Clube (`times`) | `_id`, `nome`, `estadio`, `anoFundacao`, `imagem`, `imagemEstadio` | Possui vários jogadores e um técnico |
| Jogador (`jogadores`) | `_id`, `nome`, `idade`, `posicao`, `numeroCamisa`, `imagem`, `timeId` | Pertence a um clube pelo `timeId` |
| Técnico (`tecnicos`) | `_id`, `nome`, `idade`, `imagem`, `timeId` | Um por clube, pelo `timeId` |

O NeDB gera o `_id` e os carimbos de data. A API mantém a integridade da relação ao exigir um clube existente para cadastrar ou transferir jogadores e ao bloquear a exclusão de um clube que ainda tenha jogadores ou técnico; cada clube aceita no máximo um técnico.

## Arquitetura e decisões técnicas

O frontend em React e Vite envia requisições HTTP para uma API própria em Fastify e TypeScript. A API concentra validações e regras de negócio; o NeDB grava os dados em arquivos locais. JSON é usado nas operações comuns e `multipart/form-data` quando há imagem. O Fastify permite testar as rotas com `inject`, sem iniciar uma porta de rede. Os testes usam `node:test` com `tsx`.

O NeDB foi escolhido para a execução local simples, sem serviço de banco externo. Para hospedagem em plataforma sem disco persistente, esse armazenamento precisa ser substituído ou conectado a um serviço persistente para garantir que novos registros sobrevivam a reinicializações.

## Endpoints planejados e implementados

A relação de rotas, métodos, dados e exemplos está em [Back/README.md](../Back/README.md). Os endpoints de clubes usam `GET`, `POST`, `PUT` e `DELETE`; os de jogadores incluem `PATCH` para transferência.

## Entregas da atividade

| Semana | Evidência no projeto |
| --- | --- |
| 1 | Este plano, modelo de dados, rotas e repositório Git |
| 2 | API Fastify e endpoints; os testes atuais não comprovam, por si só, a data da entrega parcial |
| 3 | Interface React integrada ao CRUD |
| 4 | Testes ampliados, validações e ciclo TDD demonstrável nos commits `385be46`, `9ec166d` e `949742b` |
| 5 | README, roteiro de apresentação e demonstração final do grupo |

As datas e a aceitação das entregas semanais dependem da avaliação do professor; este documento registra as evidências disponíveis no repositório.
