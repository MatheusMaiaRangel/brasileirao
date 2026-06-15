const {
  criarTime,
  deletarTime,
  buscarTime,
  listarTimes,
} = require('../controllers/timeController');

async function timeRoutes(fastify) {
  fastify.post('/times', criarTime);
  fastify.get('/times/:id', buscarTime);
  fastify.delete('/times/:id', deletarTime);
  fastify.get('/times', listarTimes);
}

module.exports = timeRoutes;