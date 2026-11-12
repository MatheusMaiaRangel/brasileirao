import type { FastifyReply, FastifyRequest } from 'fastify';
import db from '../database';
import { lerRequisicaoComImagem } from '../utils/multipart';
import { inteiroPositivo, textoPreenchido } from '../utils/validacao';
import type { IdParams, TecnicoRecord, TimeIdParams } from '../types';

export async function criarTecnico(request: FastifyRequest, reply: FastifyReply) {
  let fields: Record<string, string>, imagemPath: string | null;
  try {
    ({ fields, imagemPath } = await lerRequisicaoComImagem(request));
  } catch (err) {
    return reply.code(500).send({ sucesso: false, erro: 'Erro ao salvar imagem' });
  }

  const { nome, idade, timeId } = fields;

  if (!textoPreenchido(nome)) {
    return reply.code(400).send({ sucesso: false, erro: 'O campo "nome" é obrigatório' });
  }
  if (idade === undefined || idade === null || String(idade).trim() === '') {
    return reply.code(400).send({ sucesso: false, erro: 'O campo "idade" é obrigatório' });
  }
  if (!inteiroPositivo(idade)) {
    return reply.code(400).send({ sucesso: false, erro: 'A idade deve ser um inteiro positivo' });
  }
  if (!textoPreenchido(timeId)) {
    return reply.code(400).send({ sucesso: false, erro: 'O campo "timeId" é obrigatório' });
  }

  const time = await db.times.findOneAsync({ _id: timeId });
  if (!time) {
    return reply.code(400).send({ sucesso: false, erro: 'Time associado não encontrado' });
  }

  const tecnicoExistente = await db.tecnicos.findOneAsync({ timeId });
  if (tecnicoExistente) {
    return reply.code(409).send({ sucesso: false, erro: 'Este time já possui um técnico' });
  }

  const tecnico = await db.tecnicos.insertAsync({
    nome: nome.trim(),
    idade,
    imagem: imagemPath,
    timeId,
  });

  return reply.code(201).send({ sucesso: true, dados: tecnico });
}

export async function buscarTecnicoPorTime(request: FastifyRequest<{ Params: TimeIdParams }>, reply: FastifyReply) {
  const { timeId } = request.params;

  const time = await db.times.findOneAsync({ _id: timeId });
  if (!time) {
    return reply.code(404).send({ sucesso: false, erro: 'Time não encontrado' });
  }

  const tecnico = await db.tecnicos.findOneAsync({ timeId });

  return reply.send({ sucesso: true, dados: tecnico });
}

export async function editarTecnico(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
  const { id } = request.params;

  let fields: Record<string, string>, imagemPath: string | null;
  try {
    ({ fields, imagemPath } = await lerRequisicaoComImagem(request));
  } catch (err) {
    return reply.code(500).send({ sucesso: false, erro: 'Erro ao salvar imagem' });
  }

  const { nome, idade } = fields;

  const tecnico = await db.tecnicos.findOneAsync({ _id: id });
  if (!tecnico) {
    return reply.code(404).send({ sucesso: false, erro: 'Técnico não encontrado' });
  }

  if (!nome && idade === undefined && !imagemPath) {
    return reply.code(400).send({ sucesso: false, erro: 'Nenhum campo para atualizar' });
  }

  if (nome !== undefined && (!textoPreenchido(nome))) {
    return reply.code(400).send({ sucesso: false, erro: 'O campo "nome" deve conter texto' });
  }
  if (idade !== undefined && !inteiroPositivo(idade)) {
    return reply.code(400).send({ sucesso: false, erro: 'A idade deve ser um inteiro positivo' });
  }

  const update: Partial<TecnicoRecord> = {};
  if (nome) {
    update.nome = nome.trim();
  }
  if (idade !== undefined) {
    update.idade = idade;
  }
  if (imagemPath) {
    update.imagem = imagemPath;
  }

  try {
    await db.tecnicos.updateAsync({ _id: id }, { $set: update }, {});
  } catch (err) {
    return reply.code(500).send({ sucesso: false, erro: 'Erro ao atualizar técnico' });
  }

  const tecnicoAtualizado = await db.tecnicos.findOneAsync({ _id: id });

  return reply.send({ sucesso: true, dados: tecnicoAtualizado });
}

export async function deletarTecnico(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
  const { id } = request.params;

  const numRemoved = await db.tecnicos.removeAsync({ _id: id }, {});

  if (numRemoved === 0) {
    return reply.code(404).send({ sucesso: false, erro: 'Técnico não encontrado' });
  }

  return reply.code(204).send();
}
