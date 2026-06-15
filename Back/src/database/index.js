const Datastore = require('@seald-io/nedb');
const path = require('path');

const db = {
  times: new Datastore({
    filename: path.join(__dirname, '../../data/brasileirao.db'),
    autoload: true,
    timestampData: true,
  }),
};

db.times.ensureIndexAsync({ fieldName: 'nome' });

module.exports = db;