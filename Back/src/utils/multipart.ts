import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { FastifyRequest } from 'fastify';
import { UPLOADS_DIR } from './uploads';

const CAMPO_IMAGEM_ESTADIO = 'imagemEstadio';

/**
 * Lê uma requisição que pode conter imagem.
 *
 * - Se for multipart (envio de arquivo), percorre todas as partes: salva os
 *   arquivos em /public/uploads e devolve os campos de texto já como strings
 *   simples + o caminho público das imagens. O campo de arquivo
 *   "imagemEstadio" vira `imagemEstadioPath`; qualquer outro vira `imagemPath`.
 * - Se for uma requisição JSON normal, devolve o próprio body e imagens null.
 *
 * Isso permite que os controllers tratem JSON e multipart da mesma forma,
 * lendo sempre de `fields`.
 */
export async function lerRequisicaoComImagem(request: FastifyRequest): Promise<{
  fields: Record<string, string>;
  imagemPath: string | null;
  imagemEstadioPath: string | null;
}> {
  if (!(request.isMultipart && request.isMultipart())) {
    return { fields: (request.body || {}) as Record<string, string>, imagemPath: null, imagemEstadioPath: null };
  }

  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });

  const fields: Record<string, string> = {};
  let imagemPath: string | null = null;
  let imagemEstadioPath: string | null = null;

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      // campo de arquivo vazio (usuário não escolheu imagem) — descarta o stream
      if (!part.filename) {
        part.file.resume();
        continue;
      }
      const safeName = `${Date.now()}-${part.filename.replace(/\s+/g, '_')}`;
      const dest = path.join(UPLOADS_DIR, safeName);
      await pipeline(part.file, fs.createWriteStream(dest));
      const publicPath = `/uploads/${safeName}`;
      if (part.fieldname === CAMPO_IMAGEM_ESTADIO) {
        imagemEstadioPath = publicPath;
      } else {
        imagemPath = publicPath;
      }
    } else {
      fields[part.fieldname] = String(part.value);
    }
  }

  return { fields, imagemPath, imagemEstadioPath };
}
