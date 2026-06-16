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

  if (anoFundacao === undefined || anoFundacao === null || anoFundacao === '' || isNaN(Number(anoFundacao)) || !Number.isInteger(Number(anoFundacao))) {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "Ano de Fundação" é obrigatório e precisa ser um número',
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

async function editarTime(request, reply) {
  const { id } = request.params;
  const { nome, estadio, anoFundacao} = request.body;

  const time = await db.times.findOneAsync({ _id: id });
  if (!time) {
    return reply.code(404).send({ sucesso: false, erro: 'Time não encontrado' });
  }

  if (!nome && !estadio && !anoFundacao) {
    return reply.code(400).send({ sucesso: false, erro: 'Nenhum campo para atualizar' });
  }

  const update = {};
  if (nome && String(nome).trim() !== ''){
    update.nome = String(nome).trim();
  }

  if (estadio && String(estadio).trim() !== ''){
    update.estadio = String(estadio).trim();
  }

  if (anoFundacao !== undefined){
    update.anoFundacao = anoFundacao;
  } 
  

  // garantir que o update seja persistido usando callback
  try {
    await new Promise((resolve, reject) => {
      db.times.update({ _id: id }, { $set: update }, {}, (err /*, numAffected */) => {
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
    await new Promise((resolve) => db.times.compactDatafile(resolve));
  } catch (err) {
    // não bloquear a resposta se a compactação falhar
  }

  return reply.send({ sucesso: true, dados: timeAtualizado });
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
  editarTime
};