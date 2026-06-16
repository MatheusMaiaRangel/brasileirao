const db = require('../database');
const fs = require('fs');
const path = require('path');

async function criarTime(request, reply) {
  const body = request.body || {};
  const { nome, estadio, anoFundacao } = body;

  // validação de campos obrigatorios
  if (!nome || nome.trim() === '') {
    return reply.code(400).send({
      sucesso: false,
      erro: 'O campo "nome" é obrigatório',
    });
  }
  if (!estadio || estadio.trim() === '') {
    return reply.code(400).send({ sucesso: false, erro: 'O campo "estádio" é obrigatório' });
  }
  if (anoFundacao === undefined || anoFundacao === null || anoFundacao === '' || isNaN(Number(anoFundacao)) || !Number.isInteger(Number(anoFundacao))) {
    return reply.code(400).send({ sucesso: false, erro: 'O campo "Ano de Fundação" é obrigatório e precisa ser um número' });
  }

  // processar arquivo de imagem se for multipart
  let imagemPath = null;
  if (request.isMultipart && request.isMultipart()) {
    try {
      // primeiro, tentar API de stream (request.file())
      let file = null;
      try { file = await request.file(); } catch (e) { file = null; }
      if (file && file.filename) {
        const uploadsDir = path.join(__dirname, '../../public/uploads');
        await fs.promises.mkdir(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}-${file.filename.replace(/\s+/g, '_')}`;
        const dest = path.join(uploadsDir, safeName);
        await new Promise((resolve, reject) => {
          const ws = fs.createWriteStream(dest);
          file.file.pipe(ws);
          ws.on('finish', resolve);
          ws.on('error', reject);
        });
        imagemPath = `/uploads/${safeName}`;
      } else {
        // se addToBody foi usado, o arquivo pode estar em request.body.imagem
        const fileField = (request.body && request.body.imagem) || (request.body && request.body.image);
        if (fileField) {
          const fileObj = Array.isArray(fileField) ? fileField[fileField.length - 1] : fileField;
          if (fileObj && (fileObj.data || fileObj.filename)) {
            const buffer = fileObj.data;
            const filename = fileObj.filename || `file-${Date.now()}`;
            const uploadsDir = path.join(__dirname, '../../public/uploads');
            await fs.promises.mkdir(uploadsDir, { recursive: true });
            const safeName = `${Date.now()}-${filename.replace(/\s+/g, '_')}`;
            const dest = path.join(uploadsDir, safeName);
            await fs.promises.writeFile(dest, buffer);
            imagemPath = `/uploads/${safeName}`;
          }
        }
      }
    } catch (err) {
      return reply.code(500).send({ sucesso: false, erro: 'Erro ao salvar imagem' });
    }
  }

  const time = await db.times.insertAsync({
    nome: nome.trim(),
    estadio: estadio.trim(),
    anoFundacao,
    imagem: imagemPath,
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
  const body = request.body || {};
  const { nome, estadio, anoFundacao } = body;

  const time = await db.times.findOneAsync({ _id: id });
  if (!time) {
    return reply.code(404).send({ sucesso: false, erro: 'Time não encontrado' });
  }

  if (!nome && !estadio && anoFundacao === undefined && !(request.isMultipart && request.isMultipart())) {
    return reply.code(400).send({ sucesso: false, erro: 'Nenhum campo para atualizar' });
  }

  const update = {};
  if (nome && String(nome).trim() !== '') {
    update.nome = String(nome).trim();
  }
  if (estadio && String(estadio).trim() !== '') {
    update.estadio = String(estadio).trim();
  }

  if (anoFundacao !== undefined){
    update.anoFundacao = anoFundacao;
  } 
  
    // processar possível novo arquivo de imagem
  if (request.isMultipart && request.isMultipart()) {
    try {
        let file = null;
        try { file = await request.file(); } catch (e) { file = null; }
        if (file && file.filename) {
          const uploadsDir = path.join(__dirname, '../../public/uploads');
          await fs.promises.mkdir(uploadsDir, { recursive: true });
          const safeName = `${Date.now()}-${file.filename.replace(/\s+/g, '_')}`;
          const dest = path.join(uploadsDir, safeName);
          await new Promise((resolve, reject) => {
            const ws = fs.createWriteStream(dest);
            file.file.pipe(ws);
            ws.on('finish', resolve);
            ws.on('error', reject);
          });
          update.imagem = `/uploads/${safeName}`;
        } else {
          const fileField = (request.body && request.body.imagem) || (request.body && request.body.image);
          if (fileField) {
            const fileObj = Array.isArray(fileField) ? fileField[fileField.length - 1] : fileField;
            if (fileObj && (fileObj.data || fileObj.filename)) {
              const buffer = fileObj.data;
              const filename = fileObj.filename || `file-${Date.now()}`;
              const uploadsDir = path.join(__dirname, '../../public/uploads');
              await fs.promises.mkdir(uploadsDir, { recursive: true });
              const safeName = `${Date.now()}-${filename.replace(/\s+/g, '_')}`;
              const dest = path.join(uploadsDir, safeName);
              await fs.promises.writeFile(dest, buffer);
              update.imagem = `/uploads/${safeName}`;
            }
          }
        }
    } catch (err) {
      return reply.code(500).send({ sucesso: false, erro: 'Erro ao salvar imagem' });
    }
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