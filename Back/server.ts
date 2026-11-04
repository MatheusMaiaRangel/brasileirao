import 'dotenv/config';
import Fastify from 'fastify';
import multipartPlugin from '@fastify/multipart';
import corsPlugin from '@fastify/cors';
import fs from 'node:fs';
import path from 'node:path';
import timeRoutes from './src/routes/timeRoutes';
import jogadorRoutes from './src/routes/jogadorRoutes';

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'public/uploads'));

export function buildServer() {
  const fastify = Fastify({ logger: true });

  fastify.register(multipartPlugin, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  fastify.get<{ Params: { file: string } }>('/uploads/:file', async (request, reply) => {
    const filePath = path.join(uploadsDir, request.params.file);
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch {
      return reply.code(404).send({ sucesso: false, erro: 'Arquivo não encontrado' });
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

  fastify.get('/', async () => ({ status: 'ok', mensagem: 'API Fastify + NeDB funcionando!' }));

  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);
    const failure = error as Error & { statusCode?: number };
    reply.code(failure.statusCode || 500).send({
      sucesso: false,
      erro: failure.message || 'Erro interno do servidor',
    });
  });

  return fastify;
}

if (require.main === module) {
  const fastify = buildServer();
  const port = Number.parseInt(process.env.PORT || '', 10) || 3000;
  fastify.listen({ port, host: '0.0.0.0' }, (error) => {
    if (error) {
      fastify.log.error(error);
      process.exit(1);
    }
  });
}
