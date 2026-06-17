const db = require('../database');
const { lerRequisicaoComImagem } = require('../utils/multipart');

async function criarJogador(request, reply) {
  let fields, imagemPath;
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

  if (!nome || nome.trim() === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "nome" é obrigatório',
    });
  }

  if (!idade || idade.trim() === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "idade" é obrigatório',
    });
  }

  if (!posicao || posicao.trim() === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "posicao" é obrigatório',
    });
  }

  if (!numeroCamisa || numeroCamisa.trim() === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "numeroCamisa" é obrigatório',
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
    idade: idade,
    posicao: posicao || null,
    numeroCamisa: numeroCamisa,
    imagem: imagemPath,
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

async function transferenciaJogador(request, reply) {
  const { id } = request.params;
  const body = request.body || {};
  const { timeId } = body;

  const update = {};

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
    await new Promise((resolve, reject) => {
      db.jogadores.update({ _id: id }, { $set: update }, {}, (err /*, numAffected */) => {
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
    await new Promise((resolve) => db.jogadores.compactDatafile(resolve));
  } catch (err) {
    // não bloquear a resposta se a compactação falhar
  }

  return reply.send({ sucesso: true, dados: jogadorTransferido });



}

async function editarJogador(request, reply) {
  const { id } = request.params;

  let fields, imagemPath;
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

  const update = {};
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
    await new Promise((resolve, reject) => {
      db.jogadores.update({ _id: id }, { $set: update }, {}, (err /*, numAffected */) => {
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
    await new Promise((resolve) => db.jogadores.compactDatafile(resolve));
  } catch (err) {
    // não bloquear a resposta se a compactação falhar
  }

  return reply.send({ sucesso: true, dados: jogadorAtualizado });
}

module.exports = {
  criarJogador,
  editarJogador,
  deletarJogador,
  listarJogadores,
  listarJogadoresPorTime,
  transferenciaJogador
};
