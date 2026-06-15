const db = require('../database');

async function criarTime(request, reply) {
  const { nome, estadio, anoFundacao } = request.body;

  //validacao de campos obrigatorios
  if (!nome || nome.trim() === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "nome" é obrigatório',
    });
  }

  if (!estadio || estadio.trim() === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "estádio" é obrigatório',
    });
  }

  if (anoFundacao === undefined || anoFundacao === null || anoFundacao === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "Ano de Fundação" é obrigatório',
    });
  }

  const time = await db.times.insertAsync({
    nome: nome.trim(),
    estadio: estadio.trim(),
    anoFundacao,
  });

  return reply.code(201).send({ sucesso: true, dados: time });
}

async function deletarTime(request, reply) {
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

async function buscarTime(request, reply) {
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

async function listarTimes(request, reply) {
    const times = await db.times.findAsync({});
    return reply.send({ sucesso: true, dados: times });
  }

module.exports = {
  criarTime,
  deletarTime,
  buscarTime,
  listarTimes,
};