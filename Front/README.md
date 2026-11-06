# Frontend

Interface do sistema desenvolvida com React.

## Instalação

Clone o repositório: 

```bash
git clone https://github.com/MatheusMaiaRangel/brasileirao.git
```

Acesse a pasta do frontend:

```bash
cd Front
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

Após a inicialização, acesse a URL exibida no terminal.

## Verificação e build

```bash
npm run typecheck
npm run lint
npm run build
```

O frontend usa TypeScript (`.ts` e `.tsx`).

## Configuração da API

No desenvolvimento local, o frontend usa `http://localhost:3000`. O endereço pode ser alterado criando `Front/.env.local` a partir de `.env.example`:

```env
VITE_API_URL=http://localhost:3000
```

O build de produção usa `Front/.env.production`, que aponta para a API pública `https://backdobrasileirao.vercel.app`. Em outra hospedagem, configure `VITE_API_URL` para a URL do backend antes de fazer o build. Se frontend e backend estiverem no mesmo domínio, a aplicação também pode usar a origem atual quando a variável não estiver definida.

Para validar a interface, rode `npm run typecheck`, `npm run lint` e `npm run build`. No celular, os formulários e o modal passam para uma coluna.
