import type { FastifyReply, FastifyRequest } from 'fastify';
import db from '../database';
import { lerRequisicaoComImagem } from '../utils/multipart';
import type { IdParams, TimeRecord } from '../types';

function anoFundacaoValido(valor: unknown): boolean {
  if ((typeof valor !== 'string' && typeof valor !== 'number') || String(valor).trim() === '') return false;
  const ano = Number(valor);
  return Number.isSafeInteger(ano) && ano > 0 && ano <= new Date().getFullYear();
}

export async function criarTime(request: FastifyRequest, reply: FastifyReply) {
  let fields: Record<string, string>, imagemPath: string | null, imagemEstadioPath: string | null;
  try {
    ({ fields, imagemPath, imagemEstadioPath } = await lerRequisicaoComImagem(request));
  } catch (err) {
    return reply.code(500).send({ sucesso: false, erro: 'Erro ao salvar imagem' });
  }

  const { nome, estadio, anoFundacao } = fields;

  // validação de campos obrigatorios
  if (typeof nome !== 'string' || nome.trim() === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "nome" é obrigatório',
    });
  }
  if (typeof estadio !== 'string' || estadio.trim() === '') {
    return reply.code(400).send({ sucesso: false, erro: 'O campo "estádio" é obrigatório' });
  }
  if (!anoFundacaoValido(anoFundacao)) {
    return reply.code(400).send({ sucesso: false, erro: 'Ano de fundação deve ser um ano válido' });
  }

  const time = await db.times.insertAsync({
    nome: nome.trim(),
    estadio: estadio.trim(),
    anoFundacao: Number(anoFundacao),
    imagem: imagemPath,
    imagemEstadio: imagemEstadioPath,
  });

  return reply.code(201).send({ sucesso: true, dados: time });
}

export async function deletarTime(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
  const { id } = request.params;

  const jogadorVinculado = await db.jogadores.findOneAsync({ timeId: id });
  if (jogadorVinculado) {
    return reply.code(409).send({
      sucesso: false,
      erro: 'Não é possível deletar o time porque existem jogadores vinculados a ele',
    });
  }

  const numRemoved = await db.times.removeAsync({ _id: id }, {});

  if (numRemoved === 0) {
    return reply.code(404).send({
      sucesso: false,
      erro: 'Time não encontrado',
    });
  }

  return reply.code(204).send();
}

export async function editarTime(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
  const { id } = request.params;

  let fields: Record<string, string>, imagemPath: string | null, imagemEstadioPath: string | null;
  try {
    ({ fields, imagemPath, imagemEstadioPath } = await lerRequisicaoComImagem(request));
  } catch (err) {
    return reply.code(500).send({ sucesso: false, erro: 'Erro ao salvar imagem' });
  }

  const { nome, estadio, anoFundacao } = fields;

  const time = await db.times.findOneAsync({ _id: id });
  if (!time) {
    return reply.code(404).send({ sucesso: false, erro: 'Time não encontrado' });
  }

  if (!nome && !estadio && anoFundacao === undefined && !imagemPath && !imagemEstadioPath) {
    return reply.code(400).send({ sucesso: false, erro: 'Nenhum campo para atualizar' });
  }

  if (nome !== undefined && (typeof nome !== 'string' || nome.trim() === '')) {
    return reply.code(400).send({ sucesso: false, erro: 'O campo "nome" deve conter texto' });
  }
  if (estadio !== undefined && (typeof estadio !== 'string' || estadio.trim() === '')) {
    return reply.code(400).send({ sucesso: false, erro: 'O campo "estádio" deve conter texto' });
  }
  if (anoFundacao !== undefined && !anoFundacaoValido(anoFundacao)) {
    return reply.code(400).send({ sucesso: false, erro: 'Ano de fundação deve ser um ano válido' });
  }

  const update: Partial<TimeRecord> = {};
  if (nome && String(nome).trim() !== '') {
    update.nome = String(nome).trim();
  }
  if (estadio && String(estadio).trim() !== '') {
    update.estadio = String(estadio).trim();
  }

  if (anoFundacao !== undefined){
    update.anoFundacao = Number(anoFundacao);
  }

  if (imagemPath) {
    update.imagem = imagemPath;
  }

  if (imagemEstadioPath) {
    update.imagemEstadio = imagemEstadioPath;
  }

  // garantir que o update seja persistido usando callback
  try {
    await new Promise<void>((resolve, reject) => {
      db.times.update({ _id: id }, { $set: update }, {}, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (err) {
    return reply.code(500).send({ sucesso: false, erro: 'Erro ao atualizar time' });
  }

  const timeAtualizado = await db.times.findOneAsync({ _id: id });

  // compacta o datafile usando a instância em execução (aguarda conclusão)
  try {
    await new Promise<void>((resolve) => db.times.compactDatafile(() => resolve()));
  } catch (err) {
    // não bloquear a resposta se a compactação falhar
  }

  return reply.send({ sucesso: true, dados: timeAtualizado });
}




export async function buscarTime(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
  const { id } = request.params;

  const time = await db.times.findOneAsync({ _id: id });

  if (!time) {
    return reply.code(404).send({
      sucesso: false,
      erro: 'Time não encontrado',
    });
  }

  return reply.send({ sucesso: true, dados: time });
}

export async function listarTimes(_request: FastifyRequest, reply: FastifyReply) {
    const times = await db.times.findAsync({});
    return reply.send({ sucesso: true, dados: times });
  }
