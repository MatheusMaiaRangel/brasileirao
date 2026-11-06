import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('idade e número da camisa devem ser inteiros positivos no cadastro e na edição', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brasileirao-validacao-'));
  process.env.DATA_DIR = dataDir;
  process.env.UPLOADS_DIR = path.join(dataDir, 'uploads');

  const { buildServer } = await import('../src/createServer.js');
  const app = buildServer();

  try {
    await app.ready();
    const timeResponse = await app.inject({
      method: 'POST',
      url: '/times',
      payload: { nome: 'Time de teste', estadio: 'Estádio de teste', anoFundacao: 2000 },
    });
    assert.equal(timeResponse.statusCode, 201);
    const timeId = timeResponse.json().dados._id as string;
    const jogador = { nome: 'Atleta teste', idade: '25', posicao: 'Goleiro', numeroCamisa: '1', timeId };

    for (const [campo, valor] of [
      ['idade', '0'],
      ['idade', '-2'],
      ['idade', '25.5'],
      ['numeroCamisa', '0'],
      ['numeroCamisa', 'abc'],
    ] as const) {
      const response = await app.inject({
        method: 'POST', url: '/jogadores', payload: { ...jogador, [campo]: valor },
      });
      assert.equal(response.statusCode, 400, `${campo}=${valor} deve ser rejeitado no cadastro`);
    }

    const criado = await app.inject({ method: 'POST', url: '/jogadores', payload: jogador });
    assert.equal(criado.statusCode, 201);
    const id = criado.json().dados._id as string;

    for (const [campo, valor] of [
      ['idade', '0'],
      ['numeroCamisa', '-1'],
    ] as const) {
      const response = await app.inject({
        method: 'PUT', url: `/jogadores/${id}`, payload: { [campo]: valor },
      });
      assert.equal(response.statusCode, 400, `${campo}=${valor} deve ser rejeitado na edição`);
    }

    const salvo = await app.inject({ method: 'GET', url: `/times/${timeId}/jogadores` });
    assert.equal(salvo.statusCode, 200);
    assert.equal(salvo.json().total, 1);
    assert.equal(salvo.json().dados[0].idade, '25');
    assert.equal(salvo.json().dados[0].numeroCamisa, '1');
  } finally {
    await app.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});
