import express, { Express } from 'express';
import cors from 'cors';
import { migrate } from '../db';

import adventures from './routes/adventures';
import sessions from './routes/sessions';
import characters from './routes/characters';
import locations from './routes/locations';
import misc from './routes/misc';
import magicItems from './routes/magicItems';

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  migrate();

  // lightweight health endpoint for orchestration checks
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/adventures', adventures);
  app.use('/api/sessions', sessions);
  app.use('/api/characters', characters);
  app.use('/api/locations', locations);
  app.use('/api/magic-items', magicItems);
  // misc handles /api/global_notes, /api/export, /api/import, /api/search
  app.use('/api', misc);

  return app;
}

export default createApp;
