import 'dotenv/config';
import { buildServer } from './src/createServer';

const fastify = buildServer();
const port = Number.parseInt(process.env.PORT || '', 10) || 3000;

fastify.listen({ port, host: '0.0.0.0' }, (error) => {
  if (error) {
    fastify.log.error(error);
    process.exit(1);
  }
});
