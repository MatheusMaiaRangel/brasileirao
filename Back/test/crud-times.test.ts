import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { TIME_VALIDO, criarAppDeTeste, criarTime, multipart, type AppDeTeste } from './helpers/app';

describe('CRUD de clubes (/times)', () => {
  let ctx: AppDeTeste;

  before(async () => { ctx = await criarAppDeTeste('brasileirao-crud-times-'); });
  after(() => ctx.fechar());

  describe('POST /times', () => {
    test('cadastra com 201, remove espaços e converte o ano para número', async () => {
      const resposta = await ctx.app.inject({
        method: 'POST', url: '/times', payload: { nome: '  Santos  ', estadio: ' Vila Belmiro ', anoFundacao: '1912' },
      });
      assert.equal(resposta.statusCode, 201);
      const { dados } = resposta.json();
      assert.equal(dados.nome, 'Santos');
      assert.equal(dados.estadio, 'Vila Belmiro');
      assert.equal(dados.anoFundacao, 1912);
      assert.equal(dados.imagem, null);
      assert.equal(dados.imagemEstadio, null);
      assert.equal(typeof dados._id, 'string');
    });

    for (const [descricao, payload, erro] of [
      ['sem nome', { estadio: 'Arena', anoFundacao: 2000 }, /nome/],
      ['com nome em branco', { nome: '  ', estadio: 'Arena', anoFundacao: 2000 }, /nome/],
      ['sem estádio', { nome: 'Clube', anoFundacao: 2000 }, /estádio/],
      ['sem ano', { nome: 'Clube', estadio: 'Arena' }, /Ano/],
      ['com ano no futuro', { nome: 'Clube', estadio: 'Arena', anoFundacao: new Date().getFullYear() + 1 }, /Ano/],
      ['com ano negativo', { nome: 'Clube', estadio: 'Arena', anoFundacao: -10 }, /Ano/],
    ] as const) {
      test(`rejeita ${descricao} com 400`, async () => {
        const resposta = await ctx.app.inject({ method: 'POST', url: '/times', payload });
        assert.equal(resposta.statusCode, 400);
        assert.equal(resposta.json().sucesso, false);
        assert.match(resposta.json().erro, erro);
      });
    }

    test('aceita cadastro sem corpo como entrada inválida (400)', async () => {
      const resposta = await ctx.app.inject({ method: 'POST', url: '/times' });
      assert.equal(resposta.statusCode, 400);
    });
  });

  describe('GET /times e /times/:id', () => {
    test('lista clubes com 200 e envelope { sucesso, dados }', async () => {
      await criarTime(ctx.app, { nome: 'Listado' });
      const resposta = await ctx.app.inject({ method: 'GET', url: '/times' });
      assert.equal(resposta.statusCode, 200);
      assert.equal(resposta.json().sucesso, true);
      assert.ok(Array.isArray(resposta.json().dados));
      assert.ok(resposta.json().dados.some((t: { nome: string }) => t.nome === 'Listado'));
    });

    test('busca um clube pelo id', async () => {
      const id = await criarTime(ctx.app, { nome: 'Buscado' });
      const resposta = await ctx.app.inject({ method: 'GET', url: `/times/${id}` });
      assert.equal(resposta.statusCode, 200);
      assert.equal(resposta.json().dados.nome, 'Buscado');
    });

    test('devolve 404 para id inexistente', async () => {
      const resposta = await ctx.app.inject({ method: 'GET', url: '/times/nao-existe' });
      assert.equal(resposta.statusCode, 404);
      assert.equal(resposta.json().erro, 'Time não encontrado');
    });

    test('devolve 404 ao listar elenco de clube inexistente', async () => {
      const resposta = await ctx.app.inject({ method: 'GET', url: '/times/nao-existe/jogadores' });
      assert.equal(resposta.statusCode, 404);
    });
  });

  describe('PUT /times/:id', () => {
    let id: string;
    before(async () => { id = await criarTime(ctx.app, { nome: 'Editavel' }); });

    test('atualiza cada campo separadamente', async () => {
      for (const [campo, valor, esperado] of [
        ['nome', '  Novo Nome ', 'Novo Nome'],
        ['estadio', ' Novo Estádio ', 'Novo Estádio'],
        ['anoFundacao', '1950', 1950],
      ] as const) {
        const resposta = await ctx.app.inject({ method: 'PUT', url: `/times/${id}`, payload: { [campo]: valor } });
        assert.equal(resposta.statusCode, 200, campo);
        assert.equal(resposta.json().dados[campo], esperado);
      }
    });

    test('atualiza só o escudo via multipart', async () => {
      const resposta = await ctx.app.inject({
        method: 'PUT', url: `/times/${id}`,
        ...multipart({}, [{ campo: 'imagem', nome: 'novo escudo.png', conteudo: 'png' }]),
      });
      assert.equal(resposta.statusCode, 200);
      assert.match(resposta.json().dados.imagem, /^\/uploads\/\d+-novo_escudo\.png$/);
      assert.equal(resposta.json().dados.nome, 'Novo Nome');
    });

    for (const [descricao, payload, erro] of [
      ['sem nenhum campo', {}, /Nenhum campo/],
      ['com nome em branco', { nome: '   ' }, /nome/],
      ['com nome numérico', { nome: 10 }, /nome/],
      ['com estádio em branco', { estadio: ' ' }, /estádio/],
      ['com ano inválido', { anoFundacao: 'abc' }, /Ano/],
    ] as const) {
      test(`rejeita edição ${descricao} com 400`, async () => {
        const resposta = await ctx.app.inject({ method: 'PUT', url: `/times/${id}`, payload });
        assert.equal(resposta.statusCode, 400);
        assert.match(resposta.json().erro, erro);
      });
    }

    test('devolve 404 ao editar clube inexistente', async () => {
      const resposta = await ctx.app.inject({ method: 'PUT', url: '/times/nao-existe', payload: TIME_VALIDO });
      assert.equal(resposta.statusCode, 404);
    });
  });

  describe('DELETE /times/:id', () => {
    test('exclui com 204 e depois o clube não é mais encontrado', async () => {
      const id = await criarTime(ctx.app);
      const resposta = await ctx.app.inject({ method: 'DELETE', url: `/times/${id}` });
      assert.equal(resposta.statusCode, 204);
      assert.equal(resposta.body, '');
      const busca = await ctx.app.inject({ method: 'GET', url: `/times/${id}` });
      assert.equal(busca.statusCode, 404);
    });

    test('devolve 404 ao excluir clube inexistente', async () => {
      const resposta = await ctx.app.inject({ method: 'DELETE', url: '/times/nao-existe' });
      assert.equal(resposta.statusCode, 404);
    });
  });
});
