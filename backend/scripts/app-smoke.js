// Smoke test: start the app and hit endpoints to reproduce the crash outside Jest
process.env.DB_FILE = ':memory:';
process.env.SKIP_MIGRATIONS = '1';

const http = require('http');

console.log('SMOKE: mem start', process.memoryUsage());

const { createApp } = require('../dist/src/app.js');
const app = createApp();

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log('SMOKE: server listening on', port);

  try {
    await doReq('/health');
    await doReq('/api/characters');
    await doPost('/api/characters', JSON.stringify({ name: '' }));
    console.log('SMOKE: done');
  } catch (err) {
    console.error('SMOKE: error', err && err.stack ? err.stack : err);
  } finally {
    server.close(() => process.exit(0));
  }
});

function doReq(path) {
  return new Promise((resolve, reject) => {
    console.log('SMOKE: before req', path, process.memoryUsage());
    const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path, method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c.toString()));
      res.on('end', () => {
        console.log('SMOKE: after req', path, 'status', res.statusCode, 'mem', process.memoryUsage());
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function doPost(path, data) {
  return new Promise((resolve, reject) => {
    console.log('SMOKE: before post', path, process.memoryUsage());
    const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c.toString()));
      res.on('end', () => {
        console.log('SMOKE: after post', path, 'status', res.statusCode, 'mem', process.memoryUsage());
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
