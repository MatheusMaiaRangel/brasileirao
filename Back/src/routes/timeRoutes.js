const {
  criarTime,
  deletarTime,
  buscarTime,
  listarTimes,
} = require('../controllers/timeController');
const {
  listarJogadoresPorTime,
} = require('../controllers/jogadorController');

async function timeRoutes(fastify) {
  fastify.post('/times', criarTime);
  fastify.get('/times/:id', buscarTime);
  fastify.get('/times/:timeId/jogadores', listarJogadoresPorTime);
  fastify.delete('/times/:id', deletarTime);
  fastify.get('/times', listarTimes);
}

module.exports = timeRoutes;