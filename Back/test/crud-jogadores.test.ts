import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { criarAppDeTeste, criarJogador, criarTime, jogadorValido, multipart, type AppDeTeste } from './helpers/app';

describe('CRUD de jogadores (/jogadores)', () => {
  let ctx: AppDeTeste;

  before(async () => { ctx = await criarAppDeTeste('brasileirao-crud-jogadores-'); });
  after(() => ctx.fechar());

  test('não cadastra jogador quando ainda não há clubes (400)', async () => {
    const resposta = await ctx.app.inject({ method: 'POST', url: '/jogadores', payload: jogadorValido('qualquer') });
    assert.equal(resposta.statusCode, 400);
    assert.match(resposta.json().erro, /sem times cadastrados/);
  });

  describe('com um clube cadastrado', () => {
    let timeId: string;
    before(async () => { timeId = await criarTime(ctx.app); });

    test('cadastra com 201 e vincula ao clube', async () => {
      const resposta = await ctx.app.inject({
        method: 'POST', url: '/jogadores', payload: { ...jogadorValido(timeId), nome: '  Neymar  ' },
      });
      assert.equal(resposta.statusCode, 201);
      assert.equal(resposta.json().dados.nome, 'Neymar');
      assert.equal(resposta.json().dados.timeId, timeId);
      assert.equal(resposta.json().dados.imagem, null);
    });

    test('cadastra com foto via multipart', async () => {
      const resposta = await ctx.app.inject({
        method: 'POST', url: '/jogadores',
        ...multipart(
          { nome: 'Com Foto', idade: '20', posicao: 'Atacante', numeroCamisa: '9', timeId },
          [{ campo: 'imagem', nome: 'foto.png', conteudo: 'png' }],
        ),
      });
      assert.equal(resposta.statusCode, 201);
      assert.match(resposta.json().dados.imagem, /^\/uploads\//);
    });

    for (const campo of ['nome', 'idade', 'posicao', 'numeroCamisa', 'timeId'] as const) {
      test(`rejeita cadastro sem ${campo} (400)`, async () => {
        const { [campo]: _removido, ...payload } = jogadorValido(timeId);
        const resposta = await ctx.app.inject({ method: 'POST', url: '/jogadores', payload });
        assert.equal(resposta.statusCode, 400);
        assert.match(resposta.json().erro, new RegExp(campo));
      });

      test(`rejeita cadastro com ${campo} em branco (400)`, async () => {
        const resposta = await ctx.app.inject({
          method: 'POST', url: '/jogadores', payload: { ...jogadorValido(timeId), [campo]: '  ' },
        });
        assert.equal(resposta.statusCode, 400);
      });
    }

    test('rejeita cadastro em clube inexistente (400)', async () => {
      const resposta = await ctx.app.inject({ method: 'POST', url: '/jogadores', payload: jogadorValido('nao-existe') });
      assert.equal(resposta.statusCode, 400);
      assert.equal(resposta.json().erro, 'Time associado não encontrado');
    });

    test('lista todos os jogadores com 200', async () => {
      const resposta = await ctx.app.inject({ method: 'GET', url: '/jogadores' });
      assert.equal(resposta.statusCode, 200);
      assert.ok(resposta.json().dados.length >= 1);
    });

    test('elenco do clube traz total e dados', async () => {
      const resposta = await ctx.app.inject({ method: 'GET', url: `/times/${timeId}/jogadores` });
      assert.equal(resposta.statusCode, 200);
      assert.equal(resposta.json().total, resposta.json().dados.length);
    });

    test('edita idade, camisa e foto', async () => {
      const id = await criarJogador(ctx.app, timeId);
      const resposta = await ctx.app.inject({
        method: 'PUT', url: `/jogadores/${id}`,
        ...multipart({ idade: '30', numeroCamisa: '7' }, [{ campo: 'imagem', nome: 'nova.png', conteudo: 'png' }]),
      });
      assert.equal(resposta.statusCode, 200);
      // comportamento atual: campos vindos de multipart são gravados como texto
      assert.equal(resposta.json().dados.idade, '30');
      assert.equal(resposta.json().dados.numeroCamisa, '7');
      assert.match(resposta.json().dados.imagem, /nova\.png$/);
    });

    test('rejeita edição sem campos (400) e de jogador inexistente (404)', async () => {
      const id = await criarJogador(ctx.app, timeId);
      const vazio = await ctx.app.inject({ method: 'PUT', url: `/jogadores/${id}`, payload: {} });
      assert.equal(vazio.statusCode, 400);
      assert.match(vazio.json().erro, /Nenhum campo/);
      const inexistente = await ctx.app.inject({ method: 'PUT', url: '/jogadores/nao-existe', payload: { nome: 'X' } });
      assert.equal(inexistente.statusCode, 404);
    });

    test('exclui com 204 e devolve 404 na segunda tentativa', async () => {
      const id = await criarJogador(ctx.app, timeId);
      assert.equal((await ctx.app.inject({ method: 'DELETE', url: `/jogadores/${id}` })).statusCode, 204);
      assert.equal((await ctx.app.inject({ method: 'DELETE', url: `/jogadores/${id}` })).statusCode, 404);
    });

    test('impede excluir clube que ainda tem jogadores (409)', async () => {
      const resposta = await ctx.app.inject({ method: 'DELETE', url: `/times/${timeId}` });
      assert.equal(resposta.statusCode, 409);
      assert.match(resposta.json().erro, /jogadores vinculados/);
    });
  });
});
