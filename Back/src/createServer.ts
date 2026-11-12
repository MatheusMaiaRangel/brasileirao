import Fastify from 'fastify';
import multipartPlugin from '@fastify/multipart';
import corsPlugin from '@fastify/cors';
import fs from 'node:fs';
import timeRoutes from './routes/timeRoutes';
import jogadorRoutes from './routes/jogadorRoutes';
import tecnicoRoutes from './routes/tecnicoRoutes';
import { resolverArquivoDeUpload } from './utils/uploads';

export function buildServer() {
  const fastify = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });

  fastify.register(multipartPlugin, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  fastify.get<{ Params: { file: string } }>('/uploads/:file', async (request, reply) => {
    const naoEncontrado = () => reply.code(404).send({ sucesso: false, erro: 'Arquivo não encontrado' });
    const filePath = resolverArquivoDeUpload(request.params.file);
    if (!filePath) return naoEncontrado();
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch {
      return naoEncontrado();
    }
    reply.type('application/octet-stream');
    return reply.send(fs.createReadStream(filePath));
  });

  fastify.register(corsPlugin, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  fastify.register(timeRoutes);
  fastify.register(jogadorRoutes);
  fastify.register(tecnicoRoutes);

  fastify.get('/', async () => ({ status: 'ok', mensagem: 'API Fastify + NeDB funcionando!' }));

  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);
    const failure = error as Error & { statusCode?: number };
    const statusCode = failure.statusCode || 500;
    reply.code(statusCode).send({
      sucesso: false,
      erro: statusCode < 500 && failure.message ? failure.message : 'Erro interno do servidor',
    });
  });

  return fastify;
}
