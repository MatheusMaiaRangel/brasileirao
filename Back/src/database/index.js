const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

// Copia o .db original (read-only, dentro do repo) pra /tmp (gravável),
// só se ainda não existir lá.
function prepareDbFile(filename) {
  const sourcePath = path.join(__dirname, '../../data', filename);
  const destPath = path.join('/tmp', filename);

  if (!fs.existsSync(destPath) && fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
  }

  return destPath;
}

const db = {
  times: new Datastore({
    filename: prepareDbFile('brasileirao.db'),
    autoload: true,
    timestampData: true,
  }),
  jogadores: new Datastore({
    filename: prepareDbFile('jogadores.db'),
    autoload: true,
    timestampData: true,
  }),
};

db.times.ensureIndexAsync({ fieldName: 'nome' });
db.jogadores.ensureIndexAsync({ fieldName: 'nome' });
db.jogadores.ensureIndexAsync({ fieldName: 'timeId' });

module.exports = db;