import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { criarAppDeTeste, criarJogador, criarTime, type AppDeTeste } from './helpers/app';

describe('PUT /jogadores/:id valida nome e posição', () => {
  let ctx: AppDeTeste;
  let jogadorId: string;

  before(async () => {
    ctx = await criarAppDeTeste('brasileirao-edicao-jogador-');
    const timeId = await criarTime(ctx.app);
    jogadorId = await criarJogador(ctx.app, timeId, { nome: 'Nome Original', posicao: 'Zagueiro' });
  });

  after(() => ctx.fechar());

  for (const [campo, valor] of [
    ['nome', '   '],
    ['nome', 123],
    ['posicao', '   '],
    ['posicao', 7],
  ] as const) {
    test(`rejeita ${campo}=${JSON.stringify(valor)} com 400`, async () => {
      const resposta = await ctx.app.inject({
        method: 'PUT', url: `/jogadores/${jogadorId}`, payload: { [campo]: valor },
      });
      assert.equal(resposta.statusCode, 400);
      assert.equal(resposta.json().sucesso, false);
      assert.match(resposta.json().erro, new RegExp(campo));
    });
  }

  test('não altera o jogador quando a edição é rejeitada', async () => {
    const resposta = await ctx.app.inject({ method: 'GET', url: '/jogadores' });
    const jogador = resposta.json().dados.find((j: { _id: string }) => j._id === jogadorId);
    assert.equal(jogador.nome, 'Nome Original');
    assert.equal(jogador.posicao, 'Zagueiro');
  });

  test('aceita nome e posição válidos, removendo espaços extras', async () => {
    const resposta = await ctx.app.inject({
      method: 'PUT', url: `/jogadores/${jogadorId}`, payload: { nome: '  Novo Nome  ', posicao: ' Lateral ' },
    });
    assert.equal(resposta.statusCode, 200);
    assert.equal(resposta.json().dados.nome, 'Novo Nome');
    assert.equal(resposta.json().dados.posicao, 'Lateral');
  });
});
