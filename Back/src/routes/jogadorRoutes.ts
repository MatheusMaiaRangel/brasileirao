import type { FastifyInstance } from 'fastify';
import {
  criarJogador,
  editarJogador,
  deletarJogador,
  transferenciaJogador,
  listarJogadores,
} from '../controllers/jogadorController';

export default async function jogadorRoutes(fastify: FastifyInstance) {
  fastify.post('/jogadores', criarJogador);
  fastify.put('/jogadores/:id', editarJogador);
  fastify.delete('/jogadores/:id', deletarJogador);
  fastify.get('/jogadores', listarJogadores);
  fastify.patch('/jogadores/:id', transferenciaJogador);
}
