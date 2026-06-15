const {
  criarTime,
  deletarTime,
  listarTimes,
} = require('../controllers/timeController');

async function timeRoutes(fastify) {
  fastify.post('/times', criarTime);
  fastify.delete('/times/:id', deletarTime);
  fastify.get('/times', listarTimes);
}

module.exports = timeRoutes;