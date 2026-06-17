const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

/**
 * Lê uma requisição que pode conter imagem.
 *
 * - Se for multipart (envio de arquivo), percorre todas as partes: salva o
 *   arquivo (campo "imagem"/"image") em /public/uploads e devolve os campos de
 *   texto já como strings simples + o caminho público da imagem.
 * - Se for uma requisição JSON normal, devolve o próprio body e imagem null.
 *
 * Isso permite que os controllers tratem JSON e multipart da mesma forma,
 * lendo sempre de `fields`.
 */
async function lerRequisicaoComImagem(request) {
  if (!(request.isMultipart && request.isMultipart())) {
    return { fields: request.body || {}, imagemPath: null };
  }

  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });

  const fields = {};
  let imagemPath = null;

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
      imagemPath = `/uploads/${safeName}`;
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  return { fields, imagemPath };
}

module.exports = { lerRequisicaoComImagem };
