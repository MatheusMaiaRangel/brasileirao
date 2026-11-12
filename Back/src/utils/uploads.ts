import path from 'node:path';

export const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'public/uploads'));

/**
 * Devolve o caminho absoluto de um arquivo enviado, ou `null` quando o nome
 * tentaria sair da pasta de uploads (ex.: "../segredo.txt").
 */
export function resolverArquivoDeUpload(nomeArquivo: string): string | null {
  const caminho = path.resolve(UPLOADS_DIR, nomeArquivo);
  return path.dirname(caminho) === UPLOADS_DIR ? caminho : null;
}
