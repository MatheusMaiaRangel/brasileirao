require('dotenv').config();

const fastify = require('fastify')({ logger: true });

fastify.register(require('@fastify/cors'),{
  origin: '*',
  methods:['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});
fastify.register(require('./src/routes/timeRoutes'));
fastify.register(require('./src/routes/jogadorRoutes'));

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

const PORT = parseInt(process.env.PORT) || 3000;

fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});