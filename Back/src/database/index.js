const Datastore = require('@seald-io/nedb');
const path = require('path');

const db = {
  times: new Datastore({
    filename: path.join(__dirname, '../../data/brasileirao.db'),
    autoload: true,
    timestampData: true,
  }),
  jogadores: new Datastore({
    filename: path.join(__dirname, '../../data/jogadores.db'),
    autoload: true,
    timestampData: true,
  }),
};

db.times.ensureIndexAsync({ fieldName: 'nome' });
db.jogadores.ensureIndexAsync({ fieldName: 'nome' });
db.jogadores.ensureIndexAsync({ fieldName: 'timeId' });

module.exports = db;