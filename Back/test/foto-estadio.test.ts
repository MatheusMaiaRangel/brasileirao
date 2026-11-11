import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const BOUNDARY = 'estadio-test-boundary';

function campo(nome: string, valor: string) {
  return `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${nome}"\r\n\r\n${valor}\r\n`;
}

function arquivo(nome: string, arquivoNome: string, conteudo: string) {
  return (
    `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${nome}"; filename="${arquivoNome}"\r\n` +
    `Content-Type: image/png\r\n\r\n${conteudo}\r\n`
  );
}

function multipart(...partes: string[]) {
  return {
    headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
    payload: Buffer.from(partes.join('') + `--${BOUNDARY}--\r\n`),
  };
}

test('foto do estádio: envio, leitura e troca independente do escudo', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brasileirao-estadio-'));
  process.env.DATA_DIR = dataDir;
  process.env.UPLOADS_DIR = path.join(dataDir, 'uploads');

  const { buildServer } = await import('../src/createServer.js');
  const app = buildServer();

  try {
    await app.ready();

    // cria com escudo e foto do estádio
    const criado = await app.inject({
      method: 'POST', url: '/times',
      ...multipart(
        campo('nome', 'Grêmio'),
        campo('estadio', 'Arena do Grêmio'),
        campo('anoFundacao', '1903'),
        arquivo('imagem', 'escudo.png', 'escudo-bytes'),
        arquivo('imagemEstadio', 'arena.png', 'arena-bytes'),
      ),
    });
    assert.equal(criado.statusCode, 201);
    const time = criado.json().dados;
    assert.match(time.imagem, /^\/uploads\/.*escudo\.png$/);
    assert.match(time.imagemEstadio, /^\/uploads\/.*arena\.png$/);

    const arena = await app.inject({ method: 'GET', url: time.imagemEstadio });
    assert.equal(arena.statusCode, 200);
    assert.equal(arena.body, 'arena-bytes');

    // sem foto do estádio fica null
    const semFoto = await app.inject({
      method: 'POST', url: '/times',
      payload: { nome: 'Internacional', estadio: 'Beira-Rio', anoFundacao: '1909' },
    });
    assert.equal(semFoto.statusCode, 201);
    assert.equal(semFoto.json().dados.imagemEstadio, null);

    // editar só a foto do estádio não mexe no escudo
    const editado = await app.inject({
      method: 'PUT', url: `/times/${time._id}`,
      ...multipart(arquivo('imagemEstadio', 'nova-arena.png', 'nova-arena-bytes')),
    });
    assert.equal(editado.statusCode, 200);
    assert.equal(editado.json().dados.imagem, time.imagem);
    assert.match(editado.json().dados.imagemEstadio, /^\/uploads\/.*nova-arena\.png$/);
    assert.notEqual(editado.json().dados.imagemEstadio, time.imagemEstadio);

    // editar só o escudo não mexe na foto do estádio
    const novoEscudo = await app.inject({
      method: 'PUT', url: `/times/${time._id}`,
      ...multipart(arquivo('imagem', 'escudo2.png', 'escudo2-bytes')),
    });
    assert.equal(novoEscudo.statusCode, 200);
    assert.equal(novoEscudo.json().dados.imagemEstadio, editado.json().dados.imagemEstadio);
    assert.match(novoEscudo.json().dados.imagem, /escudo2\.png$/);
  } finally {
    await app.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});
