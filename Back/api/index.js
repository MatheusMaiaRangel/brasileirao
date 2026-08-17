require('dotenv').config();

const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');

const multipartPlugin = require('@fastify/multipart');
fastify.register(multipartPlugin.default || multipartPlugin, {
  addToBody: true,
  limits: { fileSize: 5 * 1024 * 1024 }
});

fastify.get('/uploads/:file', async (request, reply) => {
  const file = request.params.file;
  const filePath = path.join(__dirname, '..', 'public', 'uploads', file);
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch (err) {
    return reply.code(404).send({ sucesso: false, erro: 'Arquivo não encontrado' });
  }
  reply.type('application/octet-stream');
  return reply.send(fs.createReadStream(filePath));
});

fastify.register(require('cors'), { // se preferir manter @fastify/cors, ver nota abaixo
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

fastify.register(require('../src/routes/timeRoutes'));
fastify.register(require('../src/routes/jogadorRoutes'));

fastify.get('/', async () => {
  return { status: 'ok', mensagem: 'API Fastify + NeDB funcionando!' };
});

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.code(error.statusCode || 500).send({
    sucesso: false,
    erro: error.message || 'Erro interno do servidor',
  });
});

module.exports = async (req, res) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};