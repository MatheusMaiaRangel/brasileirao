const db = require('../database');

async function criarJogador(request, reply) {
  const { nome, posicao, timeId } = request.body;

  // precisa existir pelo menos um time cadastrado
  const existeAlgumTime = await db.times.findOneAsync({});
  if (!existeAlgumTime) {
    return reply.code(400).send({
      sucesso: false,
      erro: 'Não é possível criar jogador sem times cadastrados',
    });
  }

  if (!nome || nome.trim() === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "nome" é obrigatório',
    });
  }

  if (!timeId || timeId.trim() === '') {
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
    posicao: posicao || null,
    timeId,
  });

  return reply.code(201).send({ sucesso: true, dados: jogador });
}

async function deletarJogador(request, reply) {
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

async function listarJogadores(request, reply) {
  const jogadores = await db.jogadores.findAsync({});
  return reply.send({ sucesso: true, dados: jogadores });
}

async function listarJogadoresPorTime(request, reply) {
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

module.exports = {
  criarJogador,
  deletarJogador,
  listarJogadores,
  listarJogadoresPorTime,
};
