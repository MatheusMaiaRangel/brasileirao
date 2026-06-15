const {
  criarJogador,
  deletarJogador,
  listarJogadores,
} = require('../controllers/jogadorController');

async function jogadorRoutes(fastify) {
  fastify.post('/jogadores', criarJogador);
  fastify.delete('/jogadores/:id', deletarJogador);
  fastify.get('/jogadores', listarJogadores);
}

module.exports = jogadorRoutes;
