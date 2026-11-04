import type { FastifyInstance } from 'fastify';
import {
  criarTime,
  deletarTime,
  buscarTime,
  listarTimes,
  editarTime
} from '../controllers/timeController';
import {
  listarJogadoresPorTime,
} from '../controllers/jogadorController';

export default async function timeRoutes(fastify: FastifyInstance) {
  fastify.post('/times', criarTime);
  fastify.get('/times/:id', buscarTime);
  fastify.get('/times/:timeId/jogadores', listarJogadoresPorTime);
  fastify.delete('/times/:id', deletarTime);
  fastify.get('/times', listarTimes);
  fastify.put('/times/:id', editarTime);
}
