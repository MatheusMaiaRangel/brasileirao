const {
  criarJogador,
  editarJogador,
  deletarJogador,
  transferenciaJogador,
  listarJogadores,
} = require('../controllers/jogadorController');

async function jogadorRoutes(fastify) {
  fastify.post('/jogadores', criarJogador);
  fastify.put('/jogadores/:id', editarJogador);
  fastify.delete('/jogadores/:id', deletarJogador);
  fastify.get('/jogadores', listarJogadores);
  fastify.patch('/jogadores/:id', transferenciaJogador);
}

module.exports = jogadorRoutes;
