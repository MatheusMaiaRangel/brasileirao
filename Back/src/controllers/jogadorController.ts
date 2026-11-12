import type { FastifyReply, FastifyRequest } from 'fastify';
import db from '../database';
import { lerRequisicaoComImagem } from '../utils/multipart';
import { inteiroPositivo, textoPreenchido } from '../utils/validacao';
import type { IdParams, JogadorRecord, TimeIdParams } from '../types';


export async function criarJogador(request: FastifyRequest, reply: FastifyReply) {
  let fields: Record<string, string>, imagemPath: string | null;
  try {
    ({ fields, imagemPath } = await lerRequisicaoComImagem(request));
  } catch (err) {
    return reply.code(500).send({ sucesso: false, erro: 'Erro ao salvar imagem' });
  }

  const { nome, idade, posicao, numeroCamisa, timeId } = fields;

  // precisa existir pelo menos um time cadastrado
  const existeAlgumTime = await db.times.findOneAsync({});
  if (!existeAlgumTime) {
    return reply.code(400).send({
      sucesso: false,
      erro: 'Não é possível criar jogador sem times cadastrados',
    });
  }

  if (!textoPreenchido(nome)) {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "nome" é obrigatório',
    });
  }

  if (idade === undefined || idade === null || String(idade).trim() === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "idade" é obrigatório',
    });
  }

  if (!textoPreenchido(posicao)) {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "posicao" é obrigatório',
    });
  }

  if (numeroCamisa === undefined || numeroCamisa === null || String(numeroCamisa).trim() === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "numeroCamisa" é obrigatório',
    });
  }
  if (!inteiroPositivo(idade)) {
    return reply.code(400).send({ sucesso: false, erro: 'A idade deve ser um inteiro positivo' });
  }
  if (!inteiroPositivo(numeroCamisa)) {
    return reply.code(400).send({ sucesso: false, erro: 'O número da camisa deve ser um inteiro positivo' });
  }

  if (!textoPreenchido(timeId)) {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "timeId" é obrigatório',
    });
  }

  const time = await db.times.findOneAsync({ _id: timeId });
  if (!time) {
    return reply.code(400).send({
      sucesso: false,
      erro: 'Time associado não encontrado',
    });
  }

  const jogador = await db.jogadores.insertAsync({
    nome: nome.trim(),
    idade: idade,
    posicao: posicao || null,
    numeroCamisa: numeroCamisa,
    imagem: imagemPath,
    timeId,
  });

  return reply.code(201).send({ sucesso: true, dados: jogador });
}

export async function deletarJogador(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
  const { id } = request.params;

  const numRemoved = await db.jogadores.removeAsync({ _id: id }, {});

  if (numRemoved === 0) {
    return reply.code(404).send({
      sucesso: false,
      erro: 'Jogador não encontrado',
    });
  }

  return reply.code(204).send();
}

export async function listarJogadores(_request: FastifyRequest, reply: FastifyReply) {
  const jogadores = await db.jogadores.findAsync({});
  return reply.send({ sucesso: true, dados: jogadores });
}

export async function listarJogadoresPorTime(request: FastifyRequest<{ Params: TimeIdParams }>, reply: FastifyReply) {
  const { timeId } = request.params;

  const time = await db.times.findOneAsync({ _id: timeId });
  if (!time) {
    return reply.code(404).send({
      sucesso: false,
      erro: 'Time não encontrado',
    });
  }

  const jogadores = await db.jogadores.findAsync({ timeId });

  return reply.send({
    sucesso: true,
    total: jogadores.length,
    dados: jogadores,
  });
}

export async function transferenciaJogador(request: FastifyRequest<{ Params: IdParams; Body: { timeId?: string } }>, reply: FastifyReply) {
  const { id } = request.params;
  const body = request.body || {};
  const { timeId } = body;

  const update: Partial<JogadorRecord> = {};

  const jogador = await db.jogadores.findOneAsync({ _id: id });
  if (!jogador) {
    return reply.code(404).send({
      sucesso: false,
      erro: 'Jogador não encontrado',
    });
  }

  const time = await db.times.findOneAsync({ _id: timeId });
  if (!time) {
    return reply.code(404).send({
      sucesso: false,
      erro: 'Time não encontrado',
    });
  } 

  update.timeId = timeId;
  

  // garantir que o update seja persistido usando callback
  try {
    await new Promise<void>((resolve, reject) => {
      db.jogadores.update({ _id: id }, { $set: update }, {}, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (err) {
    return reply.code(500).send({ sucesso: false, erro: 'Erro ao transferir jogador' });
  }

  const jogadorTransferido = await db.jogadores.findOneAsync({ _id: id });

  // compacta o datafile usando a instância em execução (aguarda conclusão)
  try {
    await new Promise<void>((resolve) => db.jogadores.compactDatafile(() => resolve()));
  } catch (err) {
    // não bloquear a resposta se a compactação falhar
  }

  return reply.send({ sucesso: true, dados: jogadorTransferido });



}

export async function editarJogador(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
  const { id } = request.params;

  let fields: Record<string, string>, imagemPath: string | null;
  try {
    ({ fields, imagemPath } = await lerRequisicaoComImagem(request));
  } catch (err) {
    return reply.code(500).send({ sucesso: false, erro: 'Erro ao salvar imagem' });
  }

  const { nome, idade, posicao, numeroCamisa } = fields;

  const jogador = await db.jogadores.findOneAsync({ _id: id });
  if (!jogador) {
    return reply.code(404).send({ sucesso: false, erro: 'Jogador não encontrado' });
  }

  if (!nome && idade === undefined && !posicao && numeroCamisa === undefined && !imagemPath) {
    return reply.code(400).send({ sucesso: false, erro: 'Nenhum campo para atualizar' });
  }

  if (nome !== undefined && (!textoPreenchido(nome))) {
    return reply.code(400).send({ sucesso: false, erro: 'O campo "nome" deve conter texto' });
  }
  if (posicao !== undefined && (!textoPreenchido(posicao))) {
    return reply.code(400).send({ sucesso: false, erro: 'O campo "posicao" deve conter texto' });
  }
  if (idade !== undefined && !inteiroPositivo(idade)) {
    return reply.code(400).send({ sucesso: false, erro: 'A idade deve ser um inteiro positivo' });
  }
  if (numeroCamisa !== undefined && !inteiroPositivo(numeroCamisa)) {
    return reply.code(400).send({ sucesso: false, erro: 'O número da camisa deve ser um inteiro positivo' });
  }

  const update: Partial<JogadorRecord> = {};
  if (nome && String(nome).trim() !== ''){
    update.nome = String(nome).trim();
  }

  if (idade !== undefined){
    update.idade = idade;
  }

  if (posicao && String(posicao).trim() !== ''){
    update.posicao = String(posicao).trim();
  }

  if (numeroCamisa !== undefined){
    update.numeroCamisa = numeroCamisa;
  }

  if (imagemPath) {
    update.imagem = imagemPath;
  }

  // garantir que o update seja persistido usando callback
  try {
    await new Promise<void>((resolve, reject) => {
      db.jogadores.update({ _id: id }, { $set: update }, {}, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (err) {
    return reply.code(500).send({ sucesso: false, erro: 'Erro ao atualizar jogador' });
  }

  const jogadorAtualizado = await db.jogadores.findOneAsync({ _id: id });

  // compacta o datafile usando a instância em execução (aguarda conclusão)
  try {
    await new Promise<void>((resolve) => db.jogadores.compactDatafile(() => resolve()));
  } catch (err) {
    // não bloquear a resposta se a compactação falhar
  }

  return reply.send({ sucesso: true, dados: jogadorAtualizado });
}
