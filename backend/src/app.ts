import express, { Express } from 'express';
import cors from 'cors';

// Route modules will be required lazily inside createApp to avoid heavy imports at module load time


export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // In tests or when explicitly skipped, do not run migrations to avoid IO or heavy operations
  if (process.env.NODE_ENV !== 'test' && process.env.SKIP_MIGRATIONS !== '1') {
    try {
      // Lazy-require migrations to avoid DB open on module import
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { migrate } = require('../db');
      migrate();
    } catch (err) {
      console.error('APP: failed to run migrations', err);
      throw err;
    }
  }

  // lightweight health endpoint for orchestration checks
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  // Lazy-require routes and add logging to trace heavy imports during tests
  try {
    console.log('APP: requiring routes/adventures');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const adventures = require('./routes/adventures').default;
    app.use('/api/adventures', adventures);
    console.log('APP: loaded adventures');

    console.log('APP: requiring routes/sessions');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sessions = require('./routes/sessions').default;
    app.use('/api/sessions', sessions);
    console.log('APP: loaded sessions');

    console.log('APP: requiring routes/characters');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const characters = require('./routes/characters').default;
    app.use('/api/characters', characters);
    console.log('APP: loaded characters');

    console.log('APP: requiring routes/locations');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const locations = require('./routes/locations').default;
    app.use('/api/locations', locations);
    console.log('APP: loaded locations');

    console.log('APP: requiring routes/npcs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const npcs = require('./routes/npcs').default;
    app.use('/api/npcs', npcs);
    console.log('APP: loaded npcs');

    console.log('APP: requiring routes/quests');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const quests = require('./routes/quests').default;
    app.use('/api/quests', quests);
    console.log('APP: loaded quests');

    console.log('APP: requiring routes/magicItems');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const magicItems = require('./routes/magicItems').default;
    app.use('/api/magic-items', magicItems);
    console.log('APP: loaded magicItems');

    console.log('APP: requiring routes/combat');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const combat = require('./routes/combat').default;
    app.use('/api/combat', combat);
    console.log('APP: loaded combat');

    console.log('APP: requiring routes/relationships');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const relationships = require('./routes/relationships').default;
    app.use('/api/relationships', relationships);
    console.log('APP: loaded relationships');

    console.log('APP: requiring routes/misc');
    // misc handles /api/global_notes, /api/export, /api/import, /api/search
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const misc = require('./routes/misc').default;
    app.use('/api', misc);
    console.log('APP: loaded misc');

    console.log('APP: requiring routes/images');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const images = require('./routes/images').default;
    app.use('/api/images', images);
    console.log('APP: loaded images');

    console.log('APP: requiring routes/campaigns');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const campaigns = require('./routes/campaigns').default;
    app.use('/api/campaigns', campaigns);
    console.log('APP: loaded campaigns');
  } catch (err) {
    console.error('APP: error while requiring routes', err);
    throw err;
  }

  // Error handling middleware (must be last)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
