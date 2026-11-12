import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { criarAppDeTeste, criarJogador, criarTime, type AppDeTeste } from './helpers/app';

describe('PATCH /jogadores/:id (transferência)', () => {
  let ctx: AppDeTeste;
  let timeOrigem: string;
  let timeDestino: string;
  let jogadorId: string;

  before(async () => {
    ctx = await criarAppDeTeste('brasileirao-transferencia-');
    timeOrigem = await criarTime(ctx.app, { nome: 'Origem' });
    timeDestino = await criarTime(ctx.app, { nome: 'Destino' });
    jogadorId = await criarJogador(ctx.app, timeOrigem);
  });

  after(() => ctx.fechar());

  for (const [descricao, payload] of [
    ['sem corpo', undefined],
    ['sem timeId', {}],
    ['com timeId vazio', { timeId: '   ' }],
    ['com timeId que não é texto', { timeId: 123 }],
  ] as const) {
    test(`devolve 400 ${descricao}`, async () => {
      const resposta = await ctx.app.inject({ method: 'PATCH', url: `/jogadores/${jogadorId}`, payload });
      assert.equal(resposta.statusCode, 400);
      assert.equal(resposta.json().sucesso, false);
      assert.match(resposta.json().erro, /timeId/);
    });
  }

  test('devolve 404 para clube de destino inexistente', async () => {
    const resposta = await ctx.app.inject({
      method: 'PATCH', url: `/jogadores/${jogadorId}`, payload: { timeId: 'nao-existe' },
    });
    assert.equal(resposta.statusCode, 404);
    assert.equal(resposta.json().erro, 'Time não encontrado');
  });

  test('devolve 404 para jogador inexistente', async () => {
    const resposta = await ctx.app.inject({
      method: 'PATCH', url: '/jogadores/nao-existe', payload: { timeId: timeDestino },
    });
    assert.equal(resposta.statusCode, 404);
    assert.equal(resposta.json().erro, 'Jogador não encontrado');
  });

  test('transfere o jogador e atualiza os elencos dos dois clubes', async () => {
    const resposta = await ctx.app.inject({
      method: 'PATCH', url: `/jogadores/${jogadorId}`, payload: { timeId: timeDestino },
    });
    assert.equal(resposta.statusCode, 200);
    assert.equal(resposta.json().dados.timeId, timeDestino);

    const origem = await ctx.app.inject({ method: 'GET', url: `/times/${timeOrigem}/jogadores` });
    const destino = await ctx.app.inject({ method: 'GET', url: `/times/${timeDestino}/jogadores` });
    assert.equal(origem.json().total, 0);
    assert.equal(destino.json().total, 1);
  });
});
