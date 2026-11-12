import assert from 'node:assert/strict';
import { after, afterEach, before, describe, mock, test } from 'node:test';
import { criarAppDeTeste, criarJogador, criarTime, type AppDeTeste } from './helpers/app';

describe('falhas inesperadas respondem 500 sem vazar detalhes internos', () => {
  let ctx: AppDeTeste;
  let timeId: string;
  let jogadorId: string;
  const DETALHE_INTERNO = 'ENOSPC: disco cheio em /var/lib/dados';

  before(async () => {
    ctx = await criarAppDeTeste('brasileirao-erros-internos-');
    timeId = await criarTime(ctx.app);
    jogadorId = await criarJogador(ctx.app, timeId);
  });

  afterEach(() => mock.restoreAll());
  after(() => ctx.fechar());

  test('erro ao listar clubes vira 500 com mensagem genérica', async () => {
    mock.method(ctx.db.times, 'findAsync', () => { throw new Error(DETALHE_INTERNO); });
    const resposta = await ctx.app.inject({ method: 'GET', url: '/times' });
    assert.equal(resposta.statusCode, 500);
    assert.deepEqual(resposta.json(), { sucesso: false, erro: 'Erro interno do servidor' });
  });

  test('erro ao editar jogador vira 500', async () => {
    mock.method(ctx.db.jogadores, 'updateAsync', async () => { throw new Error(DETALHE_INTERNO); });
    const resposta = await ctx.app.inject({ method: 'PUT', url: `/jogadores/${jogadorId}`, payload: { nome: 'X' } });
    assert.equal(resposta.statusCode, 500);
    assert.equal(resposta.json().erro, 'Erro ao atualizar jogador');
  });

  test('erro ao transferir jogador vira 500', async () => {
    const destino = await criarTime(ctx.app, { nome: 'Destino' });
    mock.method(ctx.db.jogadores, 'updateAsync', async () => { throw new Error(DETALHE_INTERNO); });
    const resposta = await ctx.app.inject({ method: 'PATCH', url: `/jogadores/${jogadorId}`, payload: { timeId: destino } });
    assert.equal(resposta.statusCode, 500);
    assert.equal(resposta.json().erro, 'Erro ao transferir jogador');
  });

  test('erro ao editar clube vira 500', async () => {
    mock.method(ctx.db.times, 'updateAsync', async () => { throw new Error(DETALHE_INTERNO); });
    const resposta = await ctx.app.inject({ method: 'PUT', url: `/times/${timeId}`, payload: { nome: 'X' } });
    assert.equal(resposta.statusCode, 500);
    assert.equal(resposta.json().erro, 'Erro ao atualizar time');
  });

  test('erros de cliente do Fastify (JSON malformado) continuam 400 com a mensagem', async () => {
    const resposta = await ctx.app.inject({
      method: 'POST', url: '/times', headers: { 'content-type': 'application/json' }, payload: '{quebrado',
    });
    assert.equal(resposta.statusCode, 400);
    assert.equal(resposta.json().sucesso, false);
    assert.match(resposta.json().erro, /JSON/);
  });
});
