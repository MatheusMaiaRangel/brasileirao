import Datastore from '@seald-io/nedb';
import path from 'node:path';
import type { JogadorRecord, TecnicoRecord, TimeRecord } from '../types';

const dataDir = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));

export const db = {
  times: new Datastore<TimeRecord>({
    filename: path.join(dataDir, 'brasileirao.db'),
    autoload: true,
    timestampData: true,
  }),
  jogadores: new Datastore<JogadorRecord>({
    filename: path.join(dataDir, 'jogadores.db'),
    autoload: true,
    timestampData: true,
  }),
  tecnicos: new Datastore<TecnicoRecord>({
    filename: path.join(dataDir, 'tecnicos.db'),
    autoload: true,
    timestampData: true,
  }),
};

db.times.ensureIndexAsync({ fieldName: 'nome' });
db.jogadores.ensureIndexAsync({ fieldName: 'nome' });
db.jogadores.ensureIndexAsync({ fieldName: 'timeId' });
db.tecnicos.ensureIndexAsync({ fieldName: 'timeId' });

export default db;
