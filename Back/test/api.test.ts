import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('fluxo de clubes e jogadores pela API', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brasileirao-ts-'));
  process.env.DATA_DIR = dataDir;
  process.env.UPLOADS_DIR = path.join(dataDir, 'uploads');

  const { buildServer } = await import('../server.js');

  const app = buildServer();
  try {
    await app.ready();

    const health = await app.inject({ method: 'GET', url: '/' });
    assert.equal(health.statusCode, 200);
    assert.equal(health.json().status, 'ok');

    const boundary = 'brasileirao-test-boundary';
    const multipart = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="nome"\r\n\r\nGrêmio\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="estadio"\r\n\r\nArena do Grêmio\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="anoFundacao"\r\n\r\n1903\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="imagem"; filename="escudo.png"\r\nContent-Type: image/png\r\n\r\ntest-image\r\n` +
      `--${boundary}--\r\n`,
    );
    const first = await app.inject({
      method: 'POST', url: '/times',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: multipart,
    });
    assert.equal(first.statusCode, 201);
    const timeId = first.json().dados._id as string;
    const imagePath = first.json().dados.imagem as string;
    assert.match(imagePath, /^\/uploads\//);
    const uploaded = await app.inject({ method: 'GET', url: imagePath });
    assert.equal(uploaded.statusCode, 200);
    assert.equal(uploaded.body, 'test-image');

    const second = await app.inject({
      method: 'POST', url: '/times',
      payload: { nome: 'Internacional', estadio: 'Beira-Rio', anoFundacao: '1909' },
    });
    assert.equal(second.statusCode, 201);
    const nextTimeId = second.json().dados._id as string;

    const clubList = await app.inject({ method: 'GET', url: '/times' });
    assert.equal(clubList.statusCode, 200);
    assert.equal(clubList.json().dados.length, 2);

    const editClub = await app.inject({
      method: 'PUT', url: `/times/${timeId}`,
      payload: { estadio: 'Arena do Grêmio', anoFundacao: '1903' },
    });
    assert.equal(editClub.statusCode, 200);

    const player = await app.inject({
      method: 'POST', url: '/jogadores',
      payload: { nome: 'Atleta teste', idade: '25', posicao: 'Goleiro', numeroCamisa: '1', timeId },
    });
    assert.equal(player.statusCode, 201);
    const jogadorId = player.json().dados._id as string;

    const roster = await app.inject({ method: 'GET', url: `/times/${timeId}/jogadores` });
    assert.equal(roster.statusCode, 200);
    assert.equal(roster.json().total, 1);

    const editPlayer = await app.inject({
      method: 'PUT', url: `/jogadores/${jogadorId}`,
      payload: { nome: 'Atleta atualizado', idade: '26' },
    });
    assert.equal(editPlayer.statusCode, 200);
    assert.equal(editPlayer.json().dados.nome, 'Atleta atualizado');

    const transfer = await app.inject({
      method: 'PATCH', url: `/jogadores/${jogadorId}`,
      payload: { timeId: nextTimeId },
    });
    assert.equal(transfer.statusCode, 200);
    assert.equal(transfer.json().dados.timeId, nextTimeId);

    assert.equal((await app.inject({ method: 'DELETE', url: `/times/${nextTimeId}` })).statusCode, 409);
    assert.equal((await app.inject({ method: 'DELETE', url: `/jogadores/${jogadorId}` })).statusCode, 204);
    assert.equal((await app.inject({ method: 'DELETE', url: `/times/${timeId}` })).statusCode, 204);
    assert.equal((await app.inject({ method: 'DELETE', url: `/times/${nextTimeId}` })).statusCode, 204);
  } finally {
    await app.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});
