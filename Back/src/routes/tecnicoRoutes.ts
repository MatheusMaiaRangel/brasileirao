import type { FastifyInstance } from 'fastify';
import {
  criarTecnico,
  buscarTecnicoPorTime,
  editarTecnico,
  deletarTecnico,
} from '../controllers/tecnicoController';

export default async function tecnicoRoutes(fastify: FastifyInstance) {
  fastify.post('/tecnicos', criarTecnico);
  fastify.get('/times/:timeId/tecnico', buscarTecnicoPorTime);
  fastify.put('/tecnicos/:id', editarTecnico);
  fastify.delete('/tecnicos/:id', deletarTecnico);
}
