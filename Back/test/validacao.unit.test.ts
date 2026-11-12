import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, test } from 'node:test';
import { anoFundacaoValido, inteiroPositivo, textoPreenchido } from '../src/utils/validacao';
import { UPLOADS_DIR, resolverArquivoDeUpload } from '../src/utils/uploads';

describe('inteiroPositivo', () => {
  for (const valor of [1, '1', 25, '99', Number.MAX_SAFE_INTEGER]) {
    test(`aceita ${JSON.stringify(valor)}`, () => assert.equal(inteiroPositivo(valor), true));
  }
  for (const valor of [0, '0', -1, '-2', 2.5, '25.5', 'abc', '', ' 7', '1e3', null, undefined, '9007199254740993']) {
    test(`rejeita ${JSON.stringify(valor)}`, () => assert.equal(inteiroPositivo(valor), false));
  }
});

describe('textoPreenchido', () => {
  for (const valor of ['a', ' Flamengo ']) {
    test(`aceita ${JSON.stringify(valor)}`, () => assert.equal(textoPreenchido(valor), true));
  }
  for (const valor of ['', '   ', 123, null, undefined, {}, []]) {
    test(`rejeita ${JSON.stringify(valor)}`, () => assert.equal(textoPreenchido(valor), false));
  }
});

describe('anoFundacaoValido', () => {
  const ANO_ATUAL = 2026;
  for (const valor of [1, 1903, '1909', 2026]) {
    test(`aceita ${JSON.stringify(valor)}`, () => assert.equal(anoFundacaoValido(valor, ANO_ATUAL), true));
  }
  for (const valor of [0, -1900, 2027, '3000', 1903.5, 'abc', '', '  ', null, undefined, true, {}]) {
    test(`rejeita ${JSON.stringify(valor)}`, () => assert.equal(anoFundacaoValido(valor, ANO_ATUAL), false));
  }
  test('usa o ano atual como padrão', () => {
    assert.equal(anoFundacaoValido(new Date().getFullYear()), true);
    assert.equal(anoFundacaoValido(new Date().getFullYear() + 1), false);
  });
});

describe('resolverArquivoDeUpload', () => {
  test('resolve arquivo dentro da pasta de uploads', () => {
    assert.equal(resolverArquivoDeUpload('escudo.png'), path.join(UPLOADS_DIR, 'escudo.png'));
  });
  for (const nome of ['../segredo.txt', '../../etc/passwd', 'sub/escudo.png', '..', '/etc/passwd']) {
    test(`recusa ${JSON.stringify(nome)}`, () => assert.equal(resolverArquivoDeUpload(nome), null));
  }
});
