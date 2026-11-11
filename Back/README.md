# Backend

API responsável pelo gerenciamento dos dados de clubes e jogadores.

## Instalação

Clone o repositório: 

```bash
git clone https://github.com/MatheusMaiaRangel/brasileirao.git
```

Acesse a pasta do backend:

```bash
cd Back
```

Instale as dependências:

```bash
npm install
```

## Executando o Projeto

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A API fica disponível em `http://localhost:3000`.

## Verificação, testes e produção

```bash
npm run typecheck
npm test
npm run build
npm start
```

O backend usa TypeScript. `npm run dev` executa `server.ts`; `npm start` executa o JavaScript compilado em `dist/`.

## Configuração e persistência

Crie um arquivo `.env` local se precisar alterar as opções abaixo. O arquivo `.env` é ignorado pelo Git.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP da API |
| `DATA_DIR` | `Back/data` | Diretório dos arquivos NeDB |
| `UPLOADS_DIR` | `Back/public/uploads` | Diretório das imagens enviadas |

O NeDB grava os clubes e jogadores em arquivos locais (`brasileirao.db` e `jogadores.db`). Essa escolha permite uma instalação simples para a demonstração local, sem serviço externo. Os testes usam diretórios temporários independentes e não alteram os dados do projeto. Em hospedagem sem disco persistente, é preciso configurar uma solução de armazenamento persistente antes de depender de novos cadastros em produção.

## Endpoints

Os endpoints de clubes e jogadores respondem com `{ "sucesso": true, "dados": ... }` quando há conteúdo. Erros seguem `{ "sucesso": false, "erro": "mensagem" }`. Criação retorna `201`, consulta e edição retornam `200`, exclusão retorna `204`, entrada inválida retorna `400`, registro ausente retorna `404` e clube com jogadores não pode ser excluído (`409`). Falhas inesperadas retornam `500`. O endpoint de saúde `/` retorna `status` e `mensagem`.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/` | Verifica se a API está ativa |
| `GET` | `/times` | Lista clubes |
| `GET` | `/times/:id` | Busca um clube |
| `POST` | `/times` | Cadastra clube |
| `PUT` | `/times/:id` | Atualiza campos de um clube |
| `DELETE` | `/times/:id` | Exclui clube sem jogadores vinculados |
| `GET` | `/times/:timeId/jogadores` | Lista jogadores do clube |
| `GET` | `/jogadores` | Lista todos os jogadores |
| `POST` | `/jogadores` | Cadastra jogador em clube existente |
| `PUT` | `/jogadores/:id` | Atualiza dados do jogador |
| `PATCH` | `/jogadores/:id` | Transfere jogador para outro clube |
| `DELETE` | `/jogadores/:id` | Exclui jogador |
| `GET` | `/uploads/:file` | Lê imagem enviada |

`POST` e `PUT` aceitam JSON sem imagem ou `multipart/form-data` com arquivo no campo `imagem` e os mesmos campos de texto. Em `/times`, a foto do estádio vai no campo de arquivo `imagemEstadio` (opcional, independente do escudo). O limite de imagem é 5 MB.

### Exemplos de requisição

```bash
curl -X POST http://localhost:3000/times \
  -H "Content-Type: application/json" \
  -d '{"nome":"Clube Exemplo","estadio":"Arena Exemplo","anoFundacao":2000}'
```

Resposta: `201 {"sucesso":true,"dados":{"_id":"...","nome":"Clube Exemplo","estadio":"Arena Exemplo","anoFundacao":2000,"imagem":null,"imagemEstadio":null}}`.

```bash
curl -X POST http://localhost:3000/jogadores \
  -H "Content-Type: application/json" \
  -d '{"nome":"Atleta Exemplo","idade":24,"posicao":"Meia","numeroCamisa":10,"timeId":"ID_DO_CLUBE"}'
```

O jogador deve ter nome, posição, idade e número da camisa. Idade e camisa devem ser inteiros positivos. O `timeId` precisa apontar para um clube existente. Para transferir: `PATCH /jogadores/ID_DO_JOGADOR` com JSON `{ "timeId": "ID_DO_NOVO_CLUBE" }`.

## Testes

`npm test` executa os testes HTTP por injeção do Fastify, cobrindo CRUD, upload, transferência, validações e respostas de erro. `npm run typecheck` verifica os tipos; `npm run build` gera `dist/` para execução com `npm start`.
