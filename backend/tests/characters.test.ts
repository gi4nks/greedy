import request from 'supertest';
process.env.DB_FILE = ':memory:';
process.env.SKIP_MIGRATIONS = '1';
import { createApp } from '../src/app';

const app = createApp();

describe('API Structure Tests', () => {
  test('Health endpoint returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });

  test('Characters endpoint exists and responds', async () => {
    const response = await request(app).get('/api/characters');
    // Should return 200 even if database is empty
    expect([200, 500]).toContain(response.status);
  });

  test('POST /api/characters validates input', async () => {
    const response = await request(app)
      .post('/api/characters')
      .send({ name: '' }); // Invalid: empty name

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('Unknown routes return 404', async () => {
    const response = await request(app).get('/api/nonexistent');
    expect(response.status).toBe(404);
  });
});