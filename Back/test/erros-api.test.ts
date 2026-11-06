import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('API valida entradas JSON e devolve erros apropriados', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brasileirao-erros-'));
  process.env.DATA_DIR = dataDir;
  process.env.UPLOADS_DIR = path.join(dataDir, 'uploads');

  const { buildServer } = await import('../src/createServer.js');
  const app = buildServer();

  try {
    await app.ready();

    for (const request of [
      { method: 'GET' as const, url: '/times/inexistente' },
      { method: 'POST' as const, url: '/times', payload: { estadio: 'Arena', anoFundacao: 2000 } },
      { method: 'POST' as const, url: '/times', payload: { nome: 'Teste', estadio: 'Arena', anoFundacao: 'invalido' } },
      { method: 'POST' as const, url: '/times', payload: { nome: 123, estadio: 'Arena', anoFundacao: 2000 } },
      { method: 'POST' as const, url: '/times', payload: { nome: 'Teste', estadio: 123, anoFundacao: 2000 } },
    ]) {
      const response = await app.inject(request);
      assert.ok([400, 404].includes(response.statusCode));
      assert.equal(response.json().sucesso, false);
      assert.equal(typeof response.json().erro, 'string');
    }

    const time = await app.inject({
      method: 'POST', url: '/times',
      payload: { nome: 'Clube de teste', estadio: 'Arena', anoFundacao: 2000 },
    });
    assert.equal(time.statusCode, 201);
    const timeId = time.json().dados._id as string;

    const edicaoInvalida = await app.inject({
      method: 'PUT', url: `/times/${timeId}`, payload: { anoFundacao: 'invalido' },
    });
    assert.equal(edicaoInvalida.statusCode, 400);

    const jogador = { nome: 'Atleta', idade: 27, posicao: 'Meia', numeroCamisa: 9, timeId };
    for (const payload of [
      { ...jogador, nome: '' },
      { ...jogador, timeId: 'inexistente' },
      { ...jogador, posicao: 10 },
      { ...jogador, timeId: 123 },
    ]) {
      const response = await app.inject({ method: 'POST', url: '/jogadores', payload });
      assert.equal(response.statusCode, 400);
      assert.equal(response.json().sucesso, false);
    }

    const criado = await app.inject({ method: 'POST', url: '/jogadores', payload: jogador });
    assert.equal(criado.statusCode, 201, 'JSON deve aceitar números para idade e camisa');
    const jogadorId = criado.json().dados._id as string;

    const transferencia = await app.inject({
      method: 'PATCH', url: `/jogadores/${jogadorId}`, payload: { timeId: 'inexistente' },
    });
    assert.equal(transferencia.statusCode, 404);
    assert.equal(transferencia.json().sucesso, false);

    const exclusao = await app.inject({ method: 'DELETE', url: '/jogadores/inexistente' });
    assert.equal(exclusao.statusCode, 404);
    assert.equal(exclusao.json().sucesso, false);
  } finally {
    await app.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});
