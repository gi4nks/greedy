const express = require('express');
const cors = require('cors');
const { migrate } = require('../db');

const adventures = require('./routes/adventures');
const sessions = require('./routes/sessions');
const npcs = require('./routes/npcs');
const locations = require('./routes/locations');
const misc = require('./routes/misc');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  migrate();

  app.use('/api/adventures', adventures);
  app.use('/api/sessions', sessions);
  app.use('/api/npcs', npcs);
  app.use('/api/locations', locations);
  // misc handles /api/global_notes, /api/export, /api/import, /api/search
  app.use('/api', misc);

  return app;
}

module.exports = { createApp };
