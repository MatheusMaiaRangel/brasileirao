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
