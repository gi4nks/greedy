import request from 'supertest';
process.env.DB_FILE = ':memory:';
process.env.SKIP_MIGRATIONS = '1';
console.log('TEST: about to import createApp');
import { createApp } from '../src/app';
console.log('TEST: imported createApp');

const app = createApp();
console.log('TEST: created app');

describe('Relationships API', () => {
  test('Health endpoint responds (isolate integration)', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
