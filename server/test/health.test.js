const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { once } = require('node:events');
const { test } = require('node:test');

const dataDir = mkdtempSync(path.join(os.tmpdir(), 'relief-management-test-'));
process.env.DATA_DIR = dataDir;
process.env.JWT_SECRET = 'test-only-jwt-secret';
process.env.NODE_ENV = 'test';

const app = require('../app');
const { db } = require('../config/database');

test('production refuses to start without a JWT secret', () => {
  const result = spawnSync(process.execPath, ['-e', "require('./middleware/auth')"], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: '' },
    encoding: 'utf8'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET must be set when NODE_ENV=production/);
});

test('health endpoint returns the application status and timestamp', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    db.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ONLINE');
  assert.equal(body.system, 'Vanguard Ops: Disaster Relief Management Platform');
  assert.equal(body.version, '1.0.0');
  assert.ok(Number.isFinite(Date.parse(body.timestamp)));
});
