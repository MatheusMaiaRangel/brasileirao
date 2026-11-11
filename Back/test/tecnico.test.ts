import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const BOUNDARY = 'tecnico-test-boundary';

function multipart(campos: Record<string, string>, foto?: { nome: string; conteudo: string }) {
  const texto = Object.entries(campos)
    .map(([nome, valor]) => `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${nome}"\r\n\r\n${valor}\r\n`)
    .join('');
  const arquivo = foto
    ? `--${BOUNDARY}\r\nContent-Disposition: form-data; name="imagem"; filename="${foto.nome}"\r\nContent-Type: image/png\r\n\r\n${foto.conteudo}\r\n`
    : '';
  return {
    headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
    payload: Buffer.from(`${texto}${arquivo}--${BOUNDARY}--\r\n`),
  };
}

test('fluxo do técnico: cadastro, leitura, edição, exclusão e regras', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brasileirao-tecnico-'));
  process.env.DATA_DIR = dataDir;
  process.env.UPLOADS_DIR = path.join(dataDir, 'uploads');

  const { buildServer } = await import('../src/createServer.js');
  const app = buildServer();

  try {
    await app.ready();

    const time = await app.inject({
      method: 'POST', url: '/times',
      payload: { nome: 'Grêmio', estadio: 'Arena', anoFundacao: 1903 },
    });
    const timeId = time.json().dados._id as string;

    // time sem técnico: 200 com dados null
    const vazio = await app.inject({ method: 'GET', url: `/times/${timeId}/tecnico` });
    assert.equal(vazio.statusCode, 200);
    assert.equal(vazio.json().dados, null);

    // time inexistente
    const semTime = await app.inject({ method: 'GET', url: '/times/inexistente/tecnico' });
    assert.equal(semTime.statusCode, 404);

    // validações do cadastro
    const tecnico = { nome: 'Mano Menezes', idade: '62', timeId };
    for (const payload of [
      { ...tecnico, nome: '' },
      { ...tecnico, idade: '0' },
      { ...tecnico, idade: '62.5' },
      { ...tecnico, idade: undefined },
      { ...tecnico, timeId: 'inexistente' },
      { ...tecnico, timeId: undefined },
    ]) {
      const resposta = await app.inject({ method: 'POST', url: '/tecnicos', payload });
      assert.equal(resposta.statusCode, 400, JSON.stringify(payload));
      assert.equal(resposta.json().sucesso, false);
    }

    // cadastro com foto (multipart)
    const criado = await app.inject({
      method: 'POST', url: '/tecnicos',
      ...multipart(tecnico, { nome: 'mano.png', conteudo: 'mano-bytes' }),
    });
    assert.equal(criado.statusCode, 201);
    const criadoDados = criado.json().dados;
    assert.equal(criadoDados.nome, 'Mano Menezes');
    assert.equal(criadoDados.timeId, timeId);
    assert.match(criadoDados.imagem, /^\/uploads\/.*mano\.png$/);
    const foto = await app.inject({ method: 'GET', url: criadoDados.imagem });
    assert.equal(foto.body, 'mano-bytes');

    // só um técnico por time
    const duplicado = await app.inject({ method: 'POST', url: '/tecnicos', payload: tecnico });
    assert.equal(duplicado.statusCode, 409);

    // leitura pelo time
    const lido = await app.inject({ method: 'GET', url: `/times/${timeId}/tecnico` });
    assert.equal(lido.statusCode, 200);
    assert.equal(lido.json().dados._id, criadoDados._id);

    // edição valida e preserva a foto quando não enviada
    const invalida = await app.inject({ method: 'PUT', url: `/tecnicos/${criadoDados._id}`, payload: { idade: '-1' } });
    assert.equal(invalida.statusCode, 400);
    const vazioEdicao = await app.inject({ method: 'PUT', url: `/tecnicos/${criadoDados._id}`, payload: {} });
    assert.equal(vazioEdicao.statusCode, 400);
    const editado = await app.inject({
      method: 'PUT', url: `/tecnicos/${criadoDados._id}`,
      payload: { nome: 'Renato Gaúcho', idade: '63' },
    });
    assert.equal(editado.statusCode, 200);
    assert.equal(editado.json().dados.nome, 'Renato Gaúcho');
    assert.equal(editado.json().dados.imagem, criadoDados.imagem);
    const naoExiste = await app.inject({ method: 'PUT', url: '/tecnicos/inexistente', payload: { nome: 'X' } });
    assert.equal(naoExiste.statusCode, 404);

    // time com técnico não pode ser excluído
    const bloqueado = await app.inject({ method: 'DELETE', url: `/times/${timeId}` });
    assert.equal(bloqueado.statusCode, 409);

    // exclusão do técnico libera o time
    const removido = await app.inject({ method: 'DELETE', url: `/tecnicos/${criadoDados._id}` });
    assert.equal(removido.statusCode, 204);
    const removidoDeNovo = await app.inject({ method: 'DELETE', url: `/tecnicos/${criadoDados._id}` });
    assert.equal(removidoDeNovo.statusCode, 404);
    const depois = await app.inject({ method: 'GET', url: `/times/${timeId}/tecnico` });
    assert.equal(depois.json().dados, null);
    const timeRemovido = await app.inject({ method: 'DELETE', url: `/times/${timeId}` });
    assert.equal(timeRemovido.statusCode, 204);
  } finally {
    await app.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});
