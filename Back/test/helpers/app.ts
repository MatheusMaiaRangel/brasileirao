import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';

export interface AppDeTeste {
  app: FastifyInstance;
  dataDir: string;
  uploadsDir: string;
  fechar: () => Promise<void>;
}

/**
 * Sobe a API em um diretório temporário, sem abrir porta de rede.
 * Cada arquivo de teste roda em um processo próprio do `node --test`,
 * então as variáveis de ambiente valem só para aquele arquivo.
 */
export async function criarAppDeTeste(prefixo = 'brasileirao-'): Promise<AppDeTeste> {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), prefixo));
  const uploadsDir = path.join(dataDir, 'uploads');
  process.env.DATA_DIR = dataDir;
  process.env.UPLOADS_DIR = uploadsDir;

  const { buildServer } = await import('../../src/createServer.js');
  const { db } = await import('../../src/database/index.js');
  const bancos = [db.times, db.jogadores, db.tecnicos];
  const app = buildServer();
  await app.ready();

  return {
    app,
    dataDir,
    uploadsDir,
    fechar: async () => {
      await app.close();
      // espera a fila de gravação do NeDB terminar antes de apagar a pasta
      await Promise.all(bancos.map((banco) => banco.compactDatafileAsync()));
      await fs.rm(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    },
  };
}

export const TIME_VALIDO = { nome: 'Clube Teste', estadio: 'Arena Teste', anoFundacao: 2000 };

export async function criarTime(app: FastifyInstance, dados: Record<string, unknown> = {}): Promise<string> {
  const resposta = await app.inject({ method: 'POST', url: '/times', payload: { ...TIME_VALIDO, ...dados } });
  if (resposta.statusCode !== 201) throw new Error(`falha ao criar time: ${resposta.body}`);
  return resposta.json().dados._id as string;
}

export function jogadorValido(timeId: string) {
  return { nome: 'Atleta Teste', idade: 25, posicao: 'Meia', numeroCamisa: 10, timeId };
}

export async function criarJogador(app: FastifyInstance, timeId: string, dados: Record<string, unknown> = {}): Promise<string> {
  const resposta = await app.inject({
    method: 'POST', url: '/jogadores', payload: { ...jogadorValido(timeId), ...dados },
  });
  if (resposta.statusCode !== 201) throw new Error(`falha ao criar jogador: ${resposta.body}`);
  return resposta.json().dados._id as string;
}

export interface ArquivoDeTeste {
  campo: string;
  nome: string;
  conteudo: string;
}

const BOUNDARY = 'brasileirao-boundary';

/** Monta um corpo multipart/form-data simples para `app.inject`. */
export function multipart(campos: Record<string, string>, arquivos: ArquivoDeTeste[] = []) {
  const texto = Object.entries(campos)
    .map(([nome, valor]) => `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${nome}"\r\n\r\n${valor}\r\n`)
    .join('');
  const partesArquivo = arquivos
    .map(({ campo, nome, conteudo }) =>
      `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${campo}"; filename="${nome}"\r\n` +
      `Content-Type: image/png\r\n\r\n${conteudo}\r\n`)
    .join('');
  return {
    headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
    payload: Buffer.from(`${texto}${partesArquivo}--${BOUNDARY}--\r\n`),
  };
}
