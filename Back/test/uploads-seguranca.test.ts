import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { criarAppDeTeste, type AppDeTeste } from './helpers/app';

describe('GET /uploads/:file', () => {
  let ctx: AppDeTeste;

  before(async () => {
    ctx = await criarAppDeTeste('brasileirao-uploads-');
    await fs.mkdir(ctx.uploadsDir, { recursive: true });
    await fs.writeFile(path.join(ctx.uploadsDir, 'escudo.png'), 'imagem-publica');
    // arquivo FORA da pasta de uploads: não pode ser lido pela API
    await fs.writeFile(path.join(ctx.dataDir, 'segredo.txt'), 'conteudo-secreto');
  });

  after(() => ctx.fechar());

  test('devolve 200 e o conteúdo de um arquivo existente', async () => {
    const resposta = await ctx.app.inject({ method: 'GET', url: '/uploads/escudo.png' });
    assert.equal(resposta.statusCode, 200);
    assert.equal(resposta.body, 'imagem-publica');
  });

  test('devolve 404 para arquivo inexistente', async () => {
    const resposta = await ctx.app.inject({ method: 'GET', url: '/uploads/nao-existe.png' });
    assert.equal(resposta.statusCode, 404);
    assert.equal(resposta.json().sucesso, false);
  });

  for (const url of [
    '/uploads/..%2Fsegredo.txt',
    '/uploads/..%2F..%2Fsegredo.txt',
    '/uploads/%2E%2E%2Fsegredo.txt',
  ]) {
    test(`bloqueia path traversal em ${url}`, async () => {
      const resposta = await ctx.app.inject({ method: 'GET', url });
      assert.equal(resposta.statusCode, 404);
      assert.doesNotMatch(resposta.body, /conteudo-secreto/);
    });
  }
});
